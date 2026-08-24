import re
from typing import List, Dict

def check(file_name: str, content: str) -> List[Dict]:
    issues = []
    lines = content.splitlines()
    
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith(("//", "/*", "*")):
            continue
            
        # Detect while(true)
        if re.search(r"while\s*\(\s*true\s*\)", stripped):
            issues.append({
                "category": "CPU",
                "severity": "HIGH",
                "rule": "InfiniteLoop",
                "file": file_name,
                "line": idx + 1,
                "message": "Potential infinite loop detected: while(true). Ensure there is a reliable exit condition.",
                "code": stripped,
                "impact": "High CPU usage, battery drain, and UI freezing"
            })
            continue

        # Detect nested loops (triple nesting)
        if "for " in stripped or "while " in stripped or "forEach" in stripped:
            # Check if this loop has two levels of nested loops within the next 15 lines
            scope_lines = lines[idx+1 : min(idx + 15, len(lines))]
            
            nested_count = 0
            current_indent = len(line) - len(line.lstrip())
            
            first_nested_line = None
            second_nested_line = None
            
            for s_idx, s_line in enumerate(scope_lines):
                s_stripped = s_line.strip()
                if s_stripped.startswith(("//", "/*", "*")) or not s_stripped:
                    continue
                    
                s_indent = len(s_line) - len(s_line.lstrip())
                if s_indent > current_indent:
                    if ("for " in s_stripped or "while " in s_stripped or "forEach" in s_stripped):
                        if nested_count == 0:
                            nested_count = 1
                            first_nested_line = s_stripped
                            first_indent = s_indent
                        elif nested_count == 1 and s_indent > first_indent:
                            nested_count = 2
                            second_nested_line = s_stripped
                            break
            
            if nested_count == 2:
                issues.append({
                    "category": "CPU",
                    "severity": "MEDIUM",
                    "rule": "DeepNestedLoops",
                    "file": file_name,
                    "line": idx + 1,
                    "message": "Deeply nested loops detected (3+ levels). Consider optimizing the algorithm or using lookups.",
                    "code": f"{stripped} -> {first_nested_line} -> {second_nested_line}",
                    "impact": "Inefficient loop execution and CPU spikes"
                })
                
    return issues
