import re
from typing import List, Dict

def check(file_name: str, content: str) -> List[Dict]:
    issues = []
    lines = content.splitlines()
    
    # Matches BitmapFactory.decodeFile, decodeResource, decodeStream
    bitmap_factory_pattern = r"BitmapFactory\.decode(?:Resource|File|Stream|ByteArray)"
    
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith(("//", "/*", "*")):
            continue
            
        if re.search(bitmap_factory_pattern, stripped):
            # Check if this is within a Glide, Coil, or background thread context to avoid false positives (e.g. if options is passed on next lines)
            # But for static rules, any direct BitmapFactory decode is worth noting as high-risk if done directly.
            issues.append({
                "category": "Images",
                "severity": "MEDIUM",
                "rule": "InefficientBitmapLoading",
                "file": file_name,
                "line": idx + 1,
                "message": "Direct bitmap decoding detected (consider Glide, Coil, or BitmapFactory.Options scaling).",
                "code": stripped,
                "impact": "Out Of Memory (OOM) errors and high memory usage"
            })
            
    return issues
