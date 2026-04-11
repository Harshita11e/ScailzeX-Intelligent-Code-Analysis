import time
from models import ReviewResponse, Issue, CategoryScore
from unixcoder import UniXcoderAnalyzer
from ai_review import ai_review

unixcoder = UniXcoderAnalyzer()
SUPPORTED_LANGUAGES = {'python', 'java', 'c', 'cpp', 'javascript'}

def run_review(code: str, language: str, filename: str = None) -> ReviewResponse:
    start = time.time()
    ml_issues = unixcoder.analyze(code, language)
    groq_result = ai_review(code, language, ml_issues)
    all_issues = []

    for ml in ml_issues:
        all_issues.append(Issue(
            type=ml['type'], severity=ml['severity'], line=ml.get('line'),
            title=ml['title'], description=ml['description'],
            suggestion=ml.get('suggestion', ''),
            before=ml.get('before'), after=ml.get('after'),
            explanation=ml.get('explanation')
        ))

    existing = {i.title.lower()[:30] for i in all_issues}
    for g in groq_result.get('issues', []):
        key = g.get('title', '').lower()[:30]
        if key not in existing:
            all_issues.append(Issue(
                type=g.get('type', 'bug'), severity=g.get('severity', 'low'),
                line=g.get('line'), title=g.get('title', 'Issue'),
                description=g.get('description', ''),
                suggestion=g.get('explanation', g.get('description', '')),
                before=g.get('before'), after=g.get('after'),
                explanation=g.get('explanation')
            ))
            existing.add(key)

    order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    all_issues.sort(key=lambda x: order.get(x.severity, 4))

    cat = groq_result.get('category_scores', {})
    return ReviewResponse(
        summary=groq_result.get('summary', 'Review complete.'),
        score=groq_result.get('score', 70),
        category_scores=CategoryScore(
            security=cat.get('security', 70), performance=cat.get('performance', 70),
            style=cat.get('style', 70), bugs=cat.get('bugs', 70)
        ),
        issues=all_issues,
        positives=groq_result.get('positives', []),
        language=language, filename=filename,
        analysis_time=round(time.time() - start, 2),
        code=code
    )