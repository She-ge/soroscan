import sys
from pathlib import Path

# Add the e2e-tests directory to sys.path so `scenarios` module is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
