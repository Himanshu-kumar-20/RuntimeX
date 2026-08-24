import sys
import os

# Add root directory to Python path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.main import app

# Export FastAPI app for Vercel Serverless
__all__ = ["app"]
