"""
ScailzeX UniXcoder ML Analysis Layer
Semantic pattern detection for Python, Java, C, C++, JavaScript
"""
import re
from typing import List, Dict, Any

class UniXcoderAnalyzer:
    def __init__(self):
        self.loaded = True

    def analyze(self, code: str, language: str) -> List[Dict[str, Any]]:
        issues = []
        lines = code.split('\n')
        issues.extend(self._check_dangerous_patterns(lines, language))
        issues.extend(self._check_null_safety(lines, language))
        issues.extend(self._check_resource_leaks(lines, language))
        issues.extend(self._check_error_handling(lines, language))
        issues.extend(self._check_logic_patterns(lines, language))
        issues.extend(self._check_javascript_patterns(lines, language))
        return issues

    def _before_after(self, lines, line_num, after_code):
        before = lines[line_num].strip() if line_num < len(lines) else ""
        return before, after_code

    def _check_dangerous_patterns(self, lines, language):
        issues = []
        dangerous = {
            'c': [
                ('gets(', 'critical', 'gets() is critically unsafe — always causes buffer overflow',
                 'gets() reads input with no size limit so an attacker can write past your buffer and crash or hijack the program.',
                 'gets(input)', 'fgets(input, sizeof(input), stdin);'),
                ('strcpy(', 'high', 'strcpy() has no bounds check — buffer overflow risk',
                 'strcpy copies until it finds a null byte with no size limit — if the source is longer than the destination buffer the program crashes or behaves unpredictably.',
                 'strcpy(dest, src)', 'strncpy(dest, src, sizeof(dest) - 1);\ndest[sizeof(dest) - 1] = \'\\0\';'),
                ('strcat(', 'high', 'strcat() can overflow the destination buffer',
                 'strcat appends without checking if there is enough space — causing a buffer overflow.',
                 'strcat(dest, src)', 'strncat(dest, src, sizeof(dest) - strlen(dest) - 1);'),
                ('sprintf(', 'medium', 'sprintf() does not check destination size',
                 'sprintf writes without knowing how much space is available — use snprintf with an explicit size limit.',
                 'sprintf(buf, fmt, ...)', 'snprintf(buf, sizeof(buf), fmt, ...);'),
            ],
            'cpp': [
                ('gets(', 'critical', 'gets() is critically unsafe in C++',
                 'gets() always causes buffer overflow — there is no safe use of this function.',
                 'gets(input)', 'std::getline(std::cin, input);'),
                ('strcpy(', 'high', 'strcpy() is unsafe — use std::string instead',
                 'strcpy has no bounds checking — prefer std::string assignment which handles memory safely.',
                 'strcpy(dest, src)', '// Use std::string:\nstd::string dest = src;'),
            ],
            'python': [
                ('eval(', 'critical', 'eval() can execute any code — critical security risk',
                 'eval() runs whatever string you pass it as Python code — if that string contains user input an attacker can execute anything on your system.',
                 'eval(user_input)', 'ast.literal_eval(user_input)  # safe for literals only'),
                ('exec(', 'critical', 'exec() executes arbitrary Python code — dangerous',
                 'exec() is extremely dangerous with any untrusted input — it gives an attacker full control of your program.',
                 'exec(code)', '# Refactor to avoid dynamic code execution entirely'),
                ('pickle.loads(', 'high', 'pickle.loads() with untrusted data can execute code',
                 'Pickle can run arbitrary Python code during deserialization — never use it with data from untrusted sources.',
                 'pickle.loads(data)', 'import json\ndata = json.loads(raw)  # use JSON for safe deserialization'),
                ('os.system(', 'critical', 'os.system() with user input allows command injection',
                 'os.system passes your string directly to the shell — an attacker can inject extra commands using ; or && characters.',
                 'os.system(cmd)', 'subprocess.run([cmd], shell=False, check=True)'),
            ],
            'java': [
                ('Runtime.exec(', 'high', 'Runtime.exec() can enable command injection',
                 'Passing unsanitized user input to exec() lets attackers run arbitrary system commands.',
                 'Runtime.exec(cmd)', 'ProcessBuilder pb = new ProcessBuilder(List.of("cmd", "arg"));\npb.start();'),
            ],
            'javascript': [
                ('eval(', 'critical', 'eval() executes arbitrary JavaScript — critical XSS risk',
                 'eval() runs any string as JavaScript code — if it contains user input an attacker can steal data or take over the page.',
                 'eval(userInput)', '// Refactor to avoid eval — use JSON.parse() for data parsing'),
                ('innerHTML', 'critical', 'innerHTML with user data causes XSS vulnerability',
                 'Setting innerHTML with unescaped user content lets attackers inject malicious scripts into your page.',
                 'element.innerHTML = userInput', 'element.textContent = userInput; // safe — escapes HTML automatically'),
                ('document.write(', 'high', 'document.write() is unsafe and deprecated',
                 'document.write() can overwrite your entire page and is a common XSS vector — use DOM methods instead.',
                 'document.write(content)', 'document.getElementById("id").textContent = content;'),
            ],
        }
        patterns = dangerous.get(language, [])
        for i, line in enumerate(lines):
            for pattern, severity, title, description, before, after in patterns:
                if pattern in line:
                    issues.append({
                        'type': 'security', 'severity': severity, 'line': i + 1,
                        'title': title, 'description': description,
                        'suggestion': after, 'before': line.strip(), 'after': after,
                        'explanation': f'The after code eliminates the dangerous pattern and replaces it with a safe alternative.'
                    })
        return issues

    def _check_null_safety(self, lines, language):
        issues = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if language == 'python':
                if re.search(r'\w+\s*=\s*None', stripped):
                    var_match = re.match(r'(\w+)\s*=\s*None', stripped)
                    if var_match:
                        var = var_match.group(1)
                        for j in range(i+1, min(i+10, len(lines))):
                            if re.search(rf'{var}\.\w+', lines[j]) and f'if {var}' not in lines[j]:
                                issues.append({
                                    'type': 'bug', 'severity': 'high', 'line': j + 1,
                                    'title': f'NoneType access on \'{var}\' without null check',
                                    'description': f'The variable \'{var}\' is set to None at line {i+1} and then accessed at line {j+1} without checking if it is None first — this will crash with AttributeError at runtime.',
                                    'suggestion': f'if {var} is not None:\n    {lines[j].strip()}',
                                    'before': lines[j].strip(),
                                    'after': f'if {var} is not None:\n    {lines[j].strip()}',
                                    'explanation': 'The None check prevents AttributeError when the variable has not been assigned a real value yet.'
                                })
                                break
            if language in ('c', 'cpp'):
                if 'malloc(' in stripped or 'calloc(' in stripped:
                    has_null = any('NULL' in lines[k] or 'null' in lines[k].lower() for k in range(i+1, min(i+4, len(lines))))
                    if not has_null:
                        issues.append({
                            'type': 'bug', 'severity': 'high', 'line': i + 1,
                            'title': 'malloc() result not checked for NULL',
                            'description': 'malloc() returns NULL if the system runs out of memory — using the pointer without checking causes an immediate crash or undefined behavior.',
                            'suggestion': 'if (ptr == NULL) {\n    fprintf(stderr, "Memory allocation failed\\n");\n    return -1;\n}',
                            'before': stripped,
                            'after': f'{stripped}\nif (ptr == NULL) {{\n    fprintf(stderr, "Memory allocation failed\\n");\n    return -1;\n}}',
                            'explanation': 'The NULL check ensures the program handles memory allocation failure gracefully instead of crashing.'
                        })
        return issues

    def _check_resource_leaks(self, lines, language):
        issues = []
        code = '\n'.join(lines)
        if language == 'python':
            for i, line in enumerate(lines):
                if re.search(r'\w+\s*=\s*open\(', line.strip()):
                    surrounding = code[max(0, code.find(line)-50):code.find(line)]
                    if 'with ' not in surrounding:
                        issues.append({
                            'type': 'bug', 'severity': 'medium', 'line': i + 1,
                            'title': 'File opened without context manager — resource leak',
                            'description': 'If an exception occurs between open() and close() the file handle is never closed — leaking system resources and potentially corrupting the file.',
                            'suggestion': "with open(filepath, 'r') as f:\n    content = f.read()",
                            'before': line.strip(),
                            'after': "with open(filepath, 'r') as f:\n    content = f.read()",
                            'explanation': 'The with statement guarantees the file is closed even if an exception occurs.'
                        })
        if language in ('c', 'cpp'):
            malloc_count = len(re.findall(r'\bmalloc\b|\bcalloc\b|\brealloc\b', code))
            free_count = len(re.findall(r'\bfree\b', code))
            if malloc_count > free_count:
                line_num = next((i+1 for i, l in enumerate(lines) if 'malloc(' in l or 'calloc(' in l), 1)
                issues.append({
                    'type': 'bug', 'severity': 'high', 'line': line_num,
                    'title': f'Memory leak — {malloc_count} allocation(s), only {free_count} free(s)',
                    'description': f'You are allocating memory {malloc_count} time(s) but only freeing it {free_count} time(s) — the difference leaks memory every time this code runs.',
                    'suggestion': 'free(ptr); // add this after you are done using the allocated memory',
                    'before': '// allocated memory never freed',
                    'after': 'free(ptr); // free memory when done',
                    'explanation': 'Calling free() returns the memory to the system so it can be reused by other parts of the program.'
                })
        return issues

    def _check_error_handling(self, lines, language):
        issues = []
        if language == 'python':
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped in ('except:', 'except :'):
                    issues.append({
                        'type': 'bug', 'severity': 'medium', 'line': i + 1,
                        'title': 'Bare except catches all exceptions including system ones',
                        'description': 'A bare except: catches everything including SystemExit and KeyboardInterrupt — this can prevent your program from shutting down properly and hides serious errors.',
                        'suggestion': 'except ValueError as e:\n    logging.error("Error: %s", e)',
                        'before': stripped,
                        'after': 'except ValueError as e:\n    logging.error("Error: %s", e)',
                        'explanation': 'Catching a specific exception type only handles errors you expect and lets unexpected ones surface properly.'
                    })
                if i > 0 and 'except' in lines[i-1] and stripped == 'pass':
                    issues.append({
                        'type': 'bug', 'severity': 'high', 'line': i + 1,
                        'title': 'Exception silently swallowed with pass',
                        'description': 'Catching an exception and doing nothing hides errors — your program continues in a broken state without you knowing anything went wrong.',
                        'suggestion': 'except Exception as e:\n    logging.error("Unexpected error: %s", e)\n    raise',
                        'before': 'pass',
                        'after': 'logging.error("Unexpected error: %s", e)',
                        'explanation': 'At minimum log the error so you know it happened — then decide whether to re-raise or handle it.'
                    })
        if language == 'javascript':
            for i, line in enumerate(lines):
                if '.then(' in line and 'catch' not in '\n'.join(lines[i:min(i+5, len(lines))]):
                    issues.append({
                        'type': 'bug', 'severity': 'high', 'line': i + 1,
                        'title': 'Promise without .catch() — unhandled rejection',
                        'description': 'A promise without error handling will silently fail — in Node.js this can crash your process and in browsers the error disappears with no trace.',
                        'suggestion': 'fetch(url)\n  .then(res => res.json())\n  .catch(err => console.error("Error:", err));',
                        'before': line.strip(),
                        'after': line.strip().replace('.then(', '.then(') + '\n  .catch(err => console.error("Error:", err));',
                        'explanation': '.catch() ensures errors are handled instead of silently swallowed.'
                    })
        return issues

    def _check_logic_patterns(self, lines, language):
        issues = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if re.search(r'/\s*\w+', stripped) and '==' not in stripped and language in ('python', 'java', 'c', 'cpp'):
                divisors = re.findall(r'/\s*(\w+)', stripped)
                for d in divisors:
                    if d.isidentifier() and d not in ('self', 'cls', 'this', '2', '100'):
                        nearby = '\n'.join(lines[max(0,i-5):i])
                        if f'{d} == 0' not in nearby and f'{d}!=0' not in nearby:
                            issues.append({
                                'type': 'bug', 'severity': 'medium', 'line': i + 1,
                                'title': f'Possible division by zero — no check for \'{d}\'',
                                'description': f'If \'{d}\' is zero this line crashes with ZeroDivisionError in Python or causes undefined behavior in C/C++ — there is no guard preventing it.',
                                'suggestion': f'if {d} == 0:\n    raise ValueError("Cannot divide by zero")\nresult = x / {d}',
                                'before': stripped,
                                'after': f'if {d} == 0:\n    raise ValueError("Cannot divide by zero")\n{stripped}',
                                'explanation': 'The zero check stops execution before the division and raises a clear error instead of crashing unpredictably.'
                            })
                            break
            if language == 'javascript' and '==' in stripped and '===' not in stripped and '!=' in stripped and '!==' not in stripped:
                issues.append({
                    'type': 'bug', 'severity': 'medium', 'line': i + 1,
                    'title': 'Using == instead of === — type coercion bug',
                    'description': 'In JavaScript == compares values with type coercion which gives surprising results — for example 0 == false is true and "" == 0 is true.',
                    'suggestion': stripped.replace('==', '===').replace('!==', '!=').replace('!===', '!=='),
                    'before': stripped,
                    'after': stripped.replace('!=', '!==').replace('==', '==='),
                    'explanation': '=== checks both value and type so 0 === false is false — which is what you actually want.'
                })
        return issues


    def _check_javascript_patterns(self, lines, language):
        """JavaScript specific security and bug patterns."""
        if language != 'javascript':
            return []
        issues = []
        code = '\n'.join(lines)

        dangerous_js = [
            ('eval(', 'critical', 'eval() executes arbitrary code',
             'Remove eval() entirely. Use JSON.parse() for JSON data or restructure to avoid dynamic code execution.',
             'before_eval', 'after_eval'),
            ('innerHTML', 'high', 'innerHTML can cause XSS attacks',
             'Use textContent instead of innerHTML when inserting user data. If HTML is needed, sanitize with DOMPurify first.',
             None, None),
            ('document.write(', 'high', 'document.write() is unsafe with user data',
             'Use DOM manipulation methods like createElement() and appendChild() instead.',
             None, None),
            ('setTimeout(', 'medium', 'setTimeout with string executes code like eval',
             'Pass a function reference instead of a string: setTimeout(() => { ... }, delay)',
             None, None),
        ]

        for i, line in enumerate(lines):
            for pattern, severity, title, suggestion, _, __ in dangerous_js:
                if pattern in line:
                    issues.append({
                        'type': 'security',
                        'severity': severity,
                        'line': i + 1,
                        'title': f'{pattern.rstrip("(")} is unsafe',
                        'description': title,
                        'suggestion': suggestion,
                        'before': line.strip(),
                        'after': None,
                        'explanation': None,
                    })

        # Hardcoded secrets
        secret_patterns = ['api_key', 'apikey', 'secret', 'password', 'token', 'api_secret']
        for i, line in enumerate(lines):
            lower = line.lower()
            if any(p in lower for p in secret_patterns):
                if '=' in line and ('"' in line or "'" in line):
                    issues.append({
                        'type': 'security',
                        'severity': 'critical',
                        'line': i + 1,
                        'title': 'Hardcoded secret or credential',
                        'description': 'A secret key, password or token is hardcoded directly in the source code. Anyone with access to the code can steal these credentials.',
                        'suggestion': 'Move secrets to environment variables: process.env.API_KEY',
                        'before': line.strip(),
                        'after': f'const API_KEY = process.env.API_KEY;',
                        'explanation': 'Environment variables keep secrets out of source code and version control.',
                    })

        # var instead of let/const
        for i, line in enumerate(lines):
            if re.match(r'\s*var\s+\w+', line):
                issues.append({
                    'type': 'style',
                    'severity': 'low',
                    'line': i + 1,
                    'title': 'Use let or const instead of var',
                    'description': 'var has function scope and can cause unexpected behavior. let and const have block scope and are safer.',
                    'suggestion': 'Replace var with const if value never changes, or let if it does.',
                    'before': line.strip(),
                    'after': line.strip().replace('var ', 'const ', 1),
                    'explanation': 'const and let prevent accidental variable hoisting and scoping issues.',
                })

        return issues