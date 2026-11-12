"""Verifier engine to ensure NO invented numbers or metrics in Ask AVA responses."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Set, Tuple

# Years and benign list numbers to exclude from strict metric verification
BENIGN_INTEGERS = {1, 2, 3, 4, 5, 2024, 2025, 2026, 2027}


def extract_numbers_from_text(text: str) -> List[float]:
    """Extracts numeric values (integers, floats, currency, percentages) from answer text."""
    # Match currency, percentages, floats, comma-grouped numbers without splitting 4+ digit integers
    pattern = r'(?:₹|Rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:%|★)?'
    raw_matches = re.findall(pattern, text)

    extracted = []
    for m in raw_matches:
        clean = m.replace(",", "").strip()
        try:
            val = float(clean)
            # Skip common markdown list numbers (e.g. 1, 2, 3) or current year unless they represent metrics
            if val in BENIGN_INTEGERS and f"{int(val)}." in text:
                continue
            extracted.append(val)
        except ValueError:
            continue
    return extracted


def _collect_numbers_from_structure(val: Any, collected: Set[float]) -> None:
    if isinstance(val, (int, float)):
        collected.add(round(float(val), 2))
        collected.add(float(int(val)))
    elif isinstance(val, str):
        for num in extract_numbers_from_text(val):
            collected.add(round(num, 2))
            collected.add(float(int(num)))
    elif isinstance(val, dict):
        for k, v in val.items():
            if isinstance(k, str):
                for num in extract_numbers_from_text(k):
                    collected.add(round(num, 2))
                    collected.add(float(int(num)))
            try:
                # also include numeric keys e.g. star ratings 1..5
                k_float = float(k)
                collected.add(round(k_float, 2))
            except ValueError:
                pass
            _collect_numbers_from_structure(v, collected)
    elif isinstance(val, (list, tuple, set)):
        for item in val:
            _collect_numbers_from_structure(item, collected)


def collect_tool_numbers(tool_results: List[Dict[str, Any]]) -> Set[float]:
    collected: Set[float] = set()
    for res in tool_results:
        _collect_numbers_from_structure(res.get("data", {}), collected)
        sample_size = res.get("sample_size")
        if sample_size is not None:
            collected.add(float(sample_size))
    return collected


def verify_answer(answer: str, tool_results: List[Dict[str, Any]]) -> Tuple[bool, List[float]]:
    """Verifies that all metric numbers in answer are supported by tool results within rounding tolerance.

    Returns:
        (is_valid: bool, unverified_numbers: List[float])
    """
    if not tool_results:
        return False, []

    tool_numbers = collect_tool_numbers(tool_results)
    answer_numbers = extract_numbers_from_text(answer)

    unverified: List[float] = []
    for num in answer_numbers:
        # Check if number matches any tool number within rounding tolerance (0.1)
        matched = False
        for t_num in tool_numbers:
            if abs(num - t_num) <= 0.15 or round(num) == round(t_num):
                matched = True
                break
        if not matched:
            unverified.append(num)

    return len(unverified) == 0, unverified
