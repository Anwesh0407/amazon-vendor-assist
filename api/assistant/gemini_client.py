"""Gemini client integration with function calling, verifier, and demo fallback."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

from ava.config import get_settings
from ava.storage.base import Repository
from api.assistant.demo_engine import answer_demo_question
from api.assistant.guard import check_input_guards
from api.assistant.prompt import SYSTEM_PROMPT
from api.assistant.tools import TOOL_DEFINITIONS, execute_tool
from api.assistant.verifier import verify_answer
from api.envelope import DEFAULT_LIMITATIONS
from api.schemas import AskQuestionResponse, EvidenceItem

logger = logging.getLogger("ava.assistant.gemini")


def _format_tools_for_gemini() -> List[Dict[str, Any]]:
    """Convert TOOL_DEFINITIONS to Gemini API format."""
    decls = []
    for t in TOOL_DEFINITIONS:
        decl = {
            "name": t["name"],
            "description": t["description"],
            "parameters": t["parameters"],
        }
        decls.append(decl)
    return [{"function_declarations": decls}]


async def ask_ava(
    question: str,
    repo: Repository,
    niche_filter: Optional[Dict[str, Any]] = None,
    niche_name: str = "All Listings",
    category: Optional[str] = "Women's Kurtas & Kurtis",
    session_id: Optional[str] = None,
) -> AskQuestionResponse:
    """Entry point for Ask AVA queries with guardrails, Gemini tool calling, verifier, and demo fallback."""
    settings = get_settings()

    # 1. Guard check
    allowed, refusal_msg, refusal_cat = check_input_guards(question)
    if not allowed:
        return AskQuestionResponse(
            answer=refusal_msg or "Query was declined by AVA safety and compliance guards.",
            evidence=[],
            estimates_labeled=[],
            limitations=list(DEFAULT_LIMITATIONS),
            follow_up_suggestions=[
                "What is the median price in this category?",
                "Which price bands show the highest listing concentration?",
            ],
            mode="demo",
            session_id=session_id,
        )

    # 2. Check mode and credentials
    api_key = settings.GEMINI_API_KEY
    mode_setting = settings.ASK_AVA_MODE.lower().strip()

    # If demo mode forced or no key available -> demo engine fallback
    if mode_setting == "demo" or not api_key:
        logger.info("Using demo fallback engine (mode=%s, key_present=%s)", mode_setting, bool(api_key))
        return answer_demo_question(
            question=question,
            repo=repo,
            niche_filter=niche_filter,
            niche_name=niche_name,
            category=category,
            session_id=session_id,
        )

    # 3. Call Gemini with function calling
    model_name = settings.GEMINI_MODEL or "gemini-3.1-flash-lite-preview"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    gemini_tools = _format_tools_for_gemini()
    messages: List[Dict[str, Any]] = [
        {"role": "user", "parts": [{"text": f"[Niche Context: '{niche_name}']\n\nQuestion: {question}"}]}
    ]

    executed_results: List[Dict[str, Any]] = []
    evidence_items: List[EvidenceItem] = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": messages,
                "tools": gemini_tools,
            }

            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning("Gemini API call failed (%d): %s. Falling back to demo.", resp.status_code, resp.text)
                return answer_demo_question(question, repo, niche_filter, niche_name, category, session_id)

            resp_data = resp.json()
            candidate = resp_data.get("candidates", [{}])[0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])

            # Check for function calls
            function_calls = [p["functionCall"] for p in parts if "functionCall" in p]

            if function_calls:
                # Add model's tool calls to conversation
                messages.append(content)

                # Execute all requested functions
                tool_response_parts = []
                for call in function_calls:
                    fn_name = call.get("name")
                    fn_args = call.get("args", {})
                    try:
                        res = execute_tool(fn_name, fn_args, repo, niche_filter, niche_name, category)
                        executed_results.append(res)
                        tool_response_parts.append({
                            "functionResponse": {
                                "name": fn_name,
                                "response": {"result": res["data"], "sample_size": res["sample_size"]}
                            }
                        })
                        evidence_items.append(
                            EvidenceItem(
                                metric=fn_name,
                                value=f"Executed with sample size {res['sample_size']}",
                                sample_size=res["sample_size"],
                                source_tool=fn_name,
                                niche=niche_name,
                            )
                        )
                    except Exception as err:
                        logger.error("Error executing tool %s: %s", fn_name, err)
                        tool_response_parts.append({
                            "functionResponse": {
                                "name": fn_name,
                                "response": {"error": str(err)}
                            }
                        })

                # Send tool results back to Gemini
                messages.append({"role": "function", "parts": tool_response_parts})

                payload2 = {
                    "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                    "contents": messages,
                }
                resp2 = await client.post(url, json=payload2)
                if resp2.status_code != 200:
                    logger.warning("Gemini follow-up call failed. Falling back to demo.")
                    return answer_demo_question(question, repo, niche_filter, niche_name, category, session_id)

                candidate2 = resp2.json().get("candidates", [{}])[0]
                final_parts = candidate2.get("content", {}).get("parts", [])
                answer_text = "".join(p.get("text", "") for p in final_parts).strip()
            else:
                answer_text = "".join(p.get("text", "") for p in parts).strip()

            # 4. Verify answer numbers against executed tool results
            if executed_results:
                is_valid, unverified = verify_answer(answer_text, executed_results)
                if not is_valid:
                    logger.warning("Verifier flagged unverified numbers in Gemini output: %s. Using demo fallback.", unverified)
                    return answer_demo_question(question, repo, niche_filter, niche_name, category, session_id)

            return AskQuestionResponse(
                answer=answer_text,
                evidence=evidence_items,
                estimates_labeled=["Derived via verified Gemini language layer grounded in database tool metrics."],
                limitations=list(DEFAULT_LIMITATIONS),
                follow_up_suggestions=[
                    "What are the top opportunities in this niche?",
                    "What is the review rating distribution?",
                ],
                mode="gemini",
                session_id=session_id,
            )

    except Exception as exc:
        logger.warning("Gemini integration error (%s). Falling back to demo engine.", exc)
        return answer_demo_question(question, repo, niche_filter, niche_name, category, session_id)
