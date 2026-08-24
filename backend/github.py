import os
import re
import shutil
import uuid
import zipfile
import tempfile
import requests
import subprocess
from typing import Dict, Optional, Generator
from contextlib import contextmanager

def parse_github_url(url: str) -> Optional[Dict[str, str]]:
    """
    Validates and extracts owner and name from a GitHub URL.
    Supports URLs like:
      - https://github.com/owner/repo
      - https://github.com/owner/repo.git
      - https://github.com/owner/repo/tree/branch
    """
    url = url.strip()
    pattern = r"^https?://(?:www\.)?github\.com/([^/]+)/([^/]+)"
    match = re.match(pattern, url)
    if not match:
        return None
    
    owner = match.group(1)
    repo = match.group(2)
    
    # Strip trailing .git, slash, or subpaths
    if repo.endswith(".git"):
        repo = repo[:-4]
    
    # In case there are subpaths (e.g. repo/tree/main)
    repo_parts = repo.split("/")
    repo_name = repo_parts[0]
    
    return {"owner": owner, "name": repo_name}

def clone_via_subprocess(clone_url: str, dest_path: str) -> bool:
    """Clones a repo using git subprocess with depth 1 and single branch."""
    try:
        env = dict(os.environ)
        env["GIT_TERMINAL_PROMPT"] = "0"
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--single-branch", clone_url, dest_path],
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            timeout=35 # 35s timeout for fast responsiveness
        )
        return True
    except Exception as e:
        print(f"Git subprocess clone failed: {e}")
        return False

def clone_via_zip(owner: str, repo: str, dest_path: str) -> bool:
    """
    Fallback method: downloads the repo as a ZIP file and extracts it.
    Attempts 'main' branch first, then 'master'.
    """
    headers = {"User-Agent": "RuntimeX-Profiler/1.0"}
    for branch in ["main", "master"]:
        zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"
        try:
            print(f"Attempting ZIP download: {zip_url}")
            response = requests.get(zip_url, headers=headers, timeout=60)
            if response.status_code == 200:
                os.makedirs(dest_path, exist_ok=True)
                zip_file_path = os.path.join(dest_path, "repo.zip")
                with open(zip_file_path, "wb") as f:
                    f.write(response.content)
                
                with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                    zip_ref.extractall(dest_path)
                
                os.remove(zip_file_path)
                
                extracted_dirs = [d for d in os.listdir(dest_path) if os.path.isdir(os.path.join(dest_path, d))]
                if len(extracted_dirs) == 1:
                    subdir = os.path.join(dest_path, extracted_dirs[0])
                    for file_name in os.listdir(subdir):
                        shutil.move(os.path.join(subdir, file_name), os.path.join(dest_path, file_name))
                    os.rmdir(subdir)
                return True
        except Exception as e:
            print(f"ZIP clone failed for branch {branch}: {e}")
            if os.path.exists(dest_path):
                shutil.rmtree(dest_path, ignore_errors=True)
    return False

@contextmanager
def temp_repository(github_url: str) -> Generator[Dict, None, None]:
    """
    Context manager that clones the repo to a temporary directory inside the workspace,
    yields the path and repository metadata, and cleans up afterwards.
    """
    repo_info = parse_github_url(github_url)
    if not repo_info:
        raise ValueError("Invalid GitHub repository URL")
    
    owner = repo_info["owner"]
    name = repo_info["name"]
    
    # Use system temp directory (works seamlessly on Vercel /tmp as well as local)
    temp_root = os.path.join(tempfile.gettempdir(), "runtimex_clones")
    os.makedirs(temp_root, exist_ok=True)
    
    unique_id = str(uuid.uuid4())
    dest_path = os.path.join(temp_root, f"{owner}_{name}_{unique_id}")
    
    clone_url = f"https://github.com/{owner}/{name}.git"
    
    success = False
    
    # 1. Try git subprocess clone
    print(f"Cloning {clone_url} to {dest_path}...")
    success = clone_via_subprocess(clone_url, dest_path)
    
    # 2. Try ZIP download fallback
    if not success:
        print("Subprocess clone failed. Trying ZIP fallback...")
        success = clone_via_zip(owner, name, dest_path)
        
    if not success:
        raise RuntimeError("Failed to clone or download repository. Ensure the repository exists and is public.")
    
    try:
        yield {
            "path": dest_path,
            "owner": owner,
            "name": name,
            "clone_url": clone_url
        }
    finally:
        # Cleanup
        print(f"Cleaning up {dest_path}...")
        if os.path.exists(dest_path):
            import stat
            def remove_readonly(func, path, excinfo):
                try:
                    os.chmod(path, stat.S_IWRITE)
                    func(path)
                except Exception:
                    pass
            
            for i in range(5):
                try:
                    shutil.rmtree(dest_path, onerror=remove_readonly)
                    break
                except Exception as e:
                    import time
                    print(f"Retry {i+1} cleaning up: {e}")
                    time.sleep(1)
