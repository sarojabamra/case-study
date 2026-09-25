from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_app_env() -> None:
    load_dotenv(PROJECT_ROOT / ".env")
