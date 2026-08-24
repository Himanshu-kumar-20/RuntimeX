import re
from typing import List, Dict

def check(file_name: str, content: str) -> List[Dict]:
    issues = []
    lines = content.splitlines()
    
    # Matches: static Activity varName, static Context varName, static View varName, static WebView varName
    # Also matches subclasses like static MainActivity varName
    java_static_leak_pattern = r"static\s+(?:\w*(?:Activity|Context|View|ViewGroup|ImageView|Button|TextView|WebView|Fragment))\s+\w+"
    
    # Matches Kotlin properties in companion object or file level: val/var name: Activity or Context or View
    # Also matches subclasses like val activity: MainActivity?
    kotlin_static_leak_pattern = r"(?:val|var)\s+\w+\s*:\s*(?:\w*(?:Activity|Context|View|ViewGroup|ImageView|Button|TextView|WebView|Fragment))\??\s*(?:=|$)"

    # Let's track if we are in a companion object or a static context in Kotlin
    in_companion_object = False
    brace_count = 0

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith(("//", "/*", "*")):
            continue
            
        # Track Kotlin companion object boundaries
        if "companion object" in stripped:
            in_companion_object = True
            brace_count = stripped.count("{") - stripped.count("}")
            continue
        elif in_companion_object:
            brace_count += stripped.count("{") - stripped.count("}")
            if brace_count <= 0:
                in_companion_object = False
        
        # Check Java static leak
        if re.search(java_static_leak_pattern, stripped):
            issues.append({
                "category": "Memory",
                "severity": "HIGH",
                "rule": "StaticContextLeak",
                "file": file_name,
                "line": idx + 1,
                "message": "Potential memory retention risk: static reference to Activity/Context/View.",
                "code": stripped,
                "impact": "Memory leak preventing Activity/Context garbage collection"
            })
            continue

        # Check Kotlin static leak (companion object fields)
        if in_companion_object and re.search(kotlin_static_leak_pattern, stripped):
            issues.append({
                "category": "Memory",
                "severity": "HIGH",
                "rule": "StaticContextLeak",
                "file": file_name,
                "line": idx + 1,
                "message": "Potential memory retention risk: companion object holding a strong reference to Activity/Context/View.",
                "code": stripped,
                "impact": "Memory leak preventing Activity/Context garbage collection"
            })

    return issues
