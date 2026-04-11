from pydantic import BaseModel
from typing import Optional, List


class ReviewRequest(BaseModel):
    code: str
    language: str
    filename: Optional[str] = None


class Issue(BaseModel):
    type: str
    severity: str
    line: Optional[int] = None
    title: str
    description: str
    suggestion: str
    before: Optional[str] = None
    after: Optional[str] = None
    explanation: Optional[str] = None


class CategoryScore(BaseModel):
    security: int
    performance: int
    style: int
    bugs: int


class ReviewResponse(BaseModel):
    summary: str
    score: int
    category_scores: CategoryScore
    issues: List[Issue]
    positives: List[str]
    language: str
    filename: Optional[str] = None
    analysis_time: float
    code: Optional[str] = None
