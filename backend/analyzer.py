import os
import uuid
from typing import List, Dict, Tuple
from backend.rules import battery, ui, cpu, memory, images

IGNORED_DIRS = {
    ".git", ".github", ".gradle", ".idea", ".vscode", ".cxx",
    "build", "node_modules", "dist", "out", "bin", "captures",
    "androidTest", "test", "testAssets", "androidTestAssets",
    "generated", "intermediates", "tmp", "temp"
}

MAX_FILES_SCANNED = 120  # Limit scanning on mega-repositories for blazing-fast response

def is_android_project(root_path: str) -> bool:
    """
    Detects if the directory represents an Android project.
    Looks for typical files like build.gradle, AndroidManifest.xml, settings.gradle, etc.
    """
    signals = {
        "AndroidManifest.xml",
        "build.gradle",
        "build.gradle.kts",
        "settings.gradle",
        "settings.gradle.kts"
    }
    
    for dirpath, dirnames, filenames in os.walk(root_path):
        # Prune ignored directory trees in-place to prevent unnecessary descent
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
            
        for file in filenames:
            if file in signals:
                return True
                
        if "src" in dirnames:
            src_path = os.path.join(dirpath, "src")
            if os.path.exists(os.path.join(src_path, "main")):
                return True
                
    return False

def scan_repository(root_path: str) -> Tuple[List[Dict], int]:
    """
    Fast AST scanner for Kotlin and Java files in the repository.
    Prunes build/test/cache trees and caps scan count to ensure sub-2-second performance.
    """
    issues = []
    files_scanned = 0
    
    for dirpath, dirnames, filenames in os.walk(root_path):
        # Prune non-source directories in-place for instant traversal
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
            
        for file in filenames:
            if files_scanned >= MAX_FILES_SCANNED:
                break
                
            if file.endswith((".kt", ".java")):
                files_scanned += 1
                file_path = os.path.join(dirpath, file)
                rel_path = os.path.relpath(file_path, root_path)
                
                try:
                    # Skip massive files > 512KB (generated stubs, big datasets)
                    if os.path.getsize(file_path) > 512 * 1024:
                        continue
                        
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        
                    # Run 5-pillar rule checks
                    file_issues = []
                    file_issues.extend(battery.check(rel_path, content))
                    file_issues.extend(ui.check(rel_path, content))
                    file_issues.extend(cpu.check(rel_path, content))
                    file_issues.extend(memory.check(rel_path, content))
                    file_issues.extend(images.check(rel_path, content))
                    
                    # Attach unique IDs to issues
                    for issue in file_issues:
                        issue["id"] = f"issue-{uuid.uuid4().hex[:8]}"
                        issues.append(issue)
                        
                except Exception as e:
                    print(f"Error scanning file {file_path}: {e}")
                    
        if files_scanned >= MAX_FILES_SCANNED:
            break
                    
    return issues, files_scanned
