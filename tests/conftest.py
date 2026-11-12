import os
import pytest
from ava.config import get_settings

@pytest.fixture(autouse=True)
def force_demo_mode_in_tests(monkeypatch):
    """Enforces deterministic offline demo mode for test suite (Blueprint C-08)."""
    monkeypatch.setenv("ASK_AVA_MODE", "demo")
    settings = get_settings()
    monkeypatch.setattr(settings, "ASK_AVA_MODE", "demo")
