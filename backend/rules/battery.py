import re
from typing import List, Dict

def check(file_name: str, content: str) -> List[Dict]:
    issues = []
    
    # Check if there is an acquire but no release in the file
    has_acquire = "acquire()" in content or ".acquire(" in content
    has_release = "release()" in content or ".release(" in content
    
    if has_acquire and not has_release:
        # Find the line containing the acquire to report it
        lines = content.splitlines()
        for idx, line in enumerate(lines):
            if "acquire" in line and not line.strip().startswith(("//", "/*", "*")):
                issues.append({
                    "category": "Battery",
                    "severity": "HIGH",
                    "rule": "WakeLock",
                    "file": file_name,
                    "line": idx + 1,
                    "message": "WakeLock may remain active longer than necessary",
                    "code": line.strip(),
                    "impact": "Potential battery drain"
                })
                # Only report the first one per file to avoid noise
                break
                
    return issues
