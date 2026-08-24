import re
from typing import List, Dict

def check(file_name: str, content: str) -> List[Dict]:
    issues = []
    lines = content.splitlines()
    
    # Common blocking operation signatures
    blocking_patterns = [
        r"Thread\.sleep",
        r"HttpURLConnection",
        r"OkHttpClient",
        r"HttpClient",
        r"Retrofit",
        r"URL\(.*\)\.openStream",
        r"URL\(.*\)\.readBytes",
        r"\.execute\(\)", # synchronous execute in okhttp/retrofit
        r"databaseQuery",
        r"Socket\(.*\)"
    ]
    
    # We look for runOnUiThread blocks and then see if any blocking patterns are within subsequent lines
    # or if they are directly inside an Activity classonCreate/onResume without background dispatch
    for idx, line in enumerate(lines):
        # Flag 1: runOnUiThread with nested blocking call
        if "runOnUiThread" in line and not line.strip().startswith(("//", "/*", "*")):
            # Check the next 10 lines for blocking operations
            scope_lines = lines[idx:min(idx + 10, len(lines))]
            scope_text = "\n".join(scope_lines)
            
            for pattern in blocking_patterns:
                if re.search(pattern, scope_text):
                    issues.append({
                        "category": "UI",
                        "severity": "HIGH",
                        "rule": "MainThreadBlocking",
                        "file": file_name,
                        "line": idx + 1,
                        "message": "Heavy or blocking work on the main thread can cause UI jank.",
                        "code": line.strip() + " ... " + [l.strip() for l in scope_lines if re.search(pattern, l)][0],
                        "impact": "UI Jank or Application Not Responding (ANR)"
                    })
                    break
                    
        # Flag 2: Direct Thread.sleep inside UI classes
        if "Thread.sleep" in line and not line.strip().startswith(("//", "/*", "*")):
            # If the class looks like an Activity, Fragment, or View
            is_ui_class = any(term in file_name for term in ["Activity", "Fragment", "View", "Adapter"])
            if is_ui_class:
                issues.append({
                    "category": "UI",
                    "severity": "HIGH",
                    "rule": "MainThreadBlocking",
                    "file": file_name,
                    "line": idx + 1,
                    "message": "Heavy or blocking work on the main thread can cause UI jank.",
                    "code": line.strip(),
                    "impact": "UI Jank or Application Not Responding (ANR)"
                })
                
    return issues
