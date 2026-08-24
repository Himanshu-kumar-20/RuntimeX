"""
ai.py — High-Performance Gemini / OpenAI integration with:
  • Non-streaming generateContent (normal request for reliability)
  • 8-second hard timeout per call
  • Concurrent parallel processing across issues
  • Immediate graceful fallback to deterministic analysis on any slow/failed call
  • Never raises an exception — always returns a valid analysis dict
"""

import os
import json
import time
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Tuple

# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------

def _call_with_retry(fn, retries: int = 1) -> Tuple[bool, any]:
    """
    Call fn() up to (1 + retries) times with a short 0.5s backoff.
    Returns (success: bool, result).
    """
    for attempt in range(retries + 1):
        try:
            result = fn()
            return True, result
        except Exception as exc:
            if attempt < retries:
                print(f"[ai.py] Attempt {attempt + 1} failed: {exc}. Retrying in 0.5s…")
                time.sleep(0.5)
            else:
                print(f"[ai.py] Final attempt failed. Error: {exc}")
    return False, None


# ---------------------------------------------------------------------------
# JSON extraction (robust: handles ```json … ``` wrapping)
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> Dict:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


# ---------------------------------------------------------------------------
# Fallback deterministic analysis — comprehensive rule-based responses
# ---------------------------------------------------------------------------

def get_fallback_analysis(issue: Dict) -> Dict:
    """
    Returns a high-quality, deterministic fallback explanation and fix
    instantaneously when the AI is unavailable or running asynchronously.
    """
    rule = issue.get("rule", "")
    code = issue.get("code", "")
    file = issue.get("file", "")

    analysis = {
        "root_cause": f"Performance vulnerability detected in '{file}' by static AST analyzer.",
        "impact": issue.get("impact", "Runtime performance and battery risk."),
        "recommendation": "Refactor the flagged pattern according to Android performance best practices.",
        "fixed_code": code or "// Recommended fix pattern",
        "confidence": 0.88,
        "ai_unavailable": True,
    }

    if rule == "WakeLock":
        analysis.update({
            "root_cause": (
                f"A WakeLock is acquired in '{file}' without a deterministic release() in finally. "
                "The CPU stays awake in high-power state indefinitely."
            ),
            "impact": "Severe battery drain. Background CPU cannot transition into deep sleep.",
            "recommendation": (
                "Wrap WakeLock usage in try-finally with wakeLock.release() and include a maximum safety timeout."
            ),
            "fixed_code": """\
try {
    wakeLock.acquire(10 * 60 * 1000L) // 10-minute timeout
    // Perform background operation
} finally {
    if (wakeLock.isHeld) {
        wakeLock.release()
    }
}""",
            "confidence": 0.95,
        })

    elif rule == "MainThreadBlocking":
        analysis.update({
            "root_cause": (
                f"Synchronous blocking operation executed on the Android UI/Main thread in '{file}'."
            ),
            "impact": "UI frame drops, touch unresponsiveness, and ANR (Application Not Responding) crash if >5s.",
            "recommendation": (
                "Offload blocking tasks to Dispatchers.IO via Kotlin Coroutines and switch back to Main for UI updates."
            ),
            "fixed_code": """\
lifecycleScope.launch(Dispatchers.IO) {
    try {
        val result = performHeavyOperation()
        withContext(Dispatchers.Main) {
            updateUi(result)
        }
    } catch (e: Exception) {
        withContext(Dispatchers.Main) {
            handleError(e)
        }
    }
}""",
            "confidence": 0.95,
        })

    elif rule in ("InfiniteLoop", "DeepNestedLoops"):
        analysis.update({
            "root_cause": (
                f"High-complexity loop or unbounded while-loop detected in '{file}'."
            ),
            "impact": "Excessive CPU cycles, thermal throttling, and immediate battery drain.",
            "recommendation": (
                "Ensure guaranteed loop exit conditions and optimize O(N³) nested loops to O(N) using HashMaps."
            ),
            "fixed_code": """\
// Fast O(N) lookup instead of nested loops
val lookupMap = datasetB.associateBy { it.id }
for (itemA in datasetA) {
    val match = lookupMap[itemA.id]
    if (match != null) {
        processMatch(itemA, match)
    }
}""",
            "confidence": 0.92,
        })

    elif rule == "StaticContextLeak":
        analysis.update({
            "root_cause": (
                f"Static field in '{file}' holds an Activity/Context reference, preventing GC reclamation."
            ),
            "impact": "Permanent memory leak holding entire Activity view hierarchy → OutOfMemoryError.",
            "recommendation": "Use WeakReference<Activity> or Application context.",
            "fixed_code": """\
import java.lang.ref.WeakReference

companion object {
    private var activityRef: WeakReference<MainActivity>? = null

    fun register(activity: MainActivity) {
        activityRef = WeakReference(activity)
    }

    fun get(): MainActivity? = activityRef?.get()?.takeUnless { it.isFinishing }
}""",
            "confidence": 0.95,
        })

    elif rule == "InefficientBitmapLoading":
        analysis.update({
            "root_cause": (
                f"Full-resolution unscaled Bitmap decoded into RAM in '{file}'."
            ),
            "impact": "High memory consumption, GC allocation churn, and risk of OutOfMemoryError.",
            "recommendation": "Use Coil / Glide or configure BitmapFactory.Options.inSampleSize.",
            "fixed_code": """\
// Recommended: Modern asynchronous image loading with Coil
imageView.load(imageSource) {
    crossfade(true)
    placeholder(R.drawable.placeholder)
    error(R.drawable.error)
}""",
            "confidence": 0.92,
        })

    elif rule in ("InefficientLoop", "StringConcatInLoop"):
        analysis.update({
            "root_cause": (
                f"Repeated allocations or string concatenation with '+' inside a loop in '{file}'."
            ),
            "impact": "High GC overhead and frame stutters due to short-lived object allocations.",
            "recommendation": "Use StringBuilder and cache loop boundaries outside the loop.",
            "fixed_code": """\
val sb = StringBuilder()
val total = items.size
for (i in 0 until total) {
    sb.append(items[i])
}
val result = sb.toString()""",
            "confidence": 0.90,
        })

    return analysis


# ---------------------------------------------------------------------------
# Single Issue AI Analysis (Normal non-streaming with 8s timeout)
# ---------------------------------------------------------------------------

def analyze_issue(issue: Dict) -> Dict:
    """
    Sends a single issue to Gemini / OpenAI using a reliable non-streaming request.
    Timeout is capped at 8 seconds. Falls back gracefully on any error.
    """
    api_key = os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("LLM_MODEL", "gemini-1.5-flash").strip()

    if not model or model in ("gemini-2.5-flash", "gemini-3.6-flash"):
        model = "gemini-1.5-flash"

    if not api_key:
        return get_fallback_analysis(issue)

    prompt = f"""\
You are an expert Android performance engineer.
Analyze the following detected issue and code snippet:

File: {issue.get("file", "")}
Line: {issue.get("line", 1)}
Category: {issue.get("category", "")}
Rule: {issue.get("rule", "")}
Code:
```
{issue.get("code", "")}
```

Return ONLY a raw JSON object (no markdown, no formatting text) with these exact keys:
{{
  "root_cause": "Clear explanation of the performance issue",
  "impact": "Concrete runtime impact on Android performance",
  "recommendation": "Step-by-step resolution advice",
  "fixed_code": "Optimized replacement Kotlin/Java code",
  "confidence": 0.95
}}"""

    # Gemini non-streaming call
    if "gpt" not in model.lower():
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
                "maxOutputTokens": 1024,
            },
        }

        def _gemini_call():
            resp = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=8,  # strict 8s timeout
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            parsed = _extract_json(raw_text)
            return {
                "root_cause": parsed.get("root_cause", ""),
                "impact": parsed.get("impact", ""),
                "recommendation": parsed.get("recommendation", ""),
                "fixed_code": parsed.get("fixed_code", ""),
                "confidence": float(parsed.get("confidence", 0.95)),
                "ai_unavailable": False,
            }

        success, result = _call_with_retry(_gemini_call, retries=1)
        if success:
            return result
        return get_fallback_analysis(issue)

    # OpenAI call
    def _openai_call():
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            },
            timeout=8,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"].strip()
        parsed = _extract_json(content)
        return {
            "root_cause": parsed.get("root_cause", ""),
            "impact": parsed.get("impact", ""),
            "recommendation": parsed.get("recommendation", ""),
            "fixed_code": parsed.get("fixed_code", ""),
            "confidence": float(parsed.get("confidence", 0.95)),
            "ai_unavailable": False,
        }

    success, result = _call_with_retry(_openai_call, retries=1)
    if success:
        return result
    return get_fallback_analysis(issue)


# ---------------------------------------------------------------------------
# Batch Concurrent AI Processing (Runs top issues in parallel)
# ---------------------------------------------------------------------------

def batch_analyze_issues(issues: List[Dict]) -> Tuple[List[Dict], bool]:
    """
    Analyzes issues concurrently across threads with an 8-second ceiling.
    Returns (results, ai_available_bool).
    """
    if not issues:
        return [], True

    sorted_issues = sorted(
        issues,
        key=lambda x: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(x.get("severity", "MEDIUM"), 1)
    )

    results_by_id = {}
    ai_available = True

    # Process top 5 with LLM, rest with deterministic fallback
    llm_targets = sorted_issues[:5]
    fallback_targets = sorted_issues[5:]

    for iss in fallback_targets:
        fb = get_fallback_analysis(iss)
        fb["issue_id"] = iss["id"]
        results_by_id[iss["id"]] = fb

    if not llm_targets:
        return [results_by_id[i["id"]] for i in sorted_issues], True

    # Parallelize LLM calls across max 5 workers
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_issue = {
            executor.submit(analyze_issue, iss): iss
            for iss in llm_targets
        }
        for future in as_completed(future_to_issue):
            iss = future_to_issue[future]
            try:
                res = future.result()
                res["issue_id"] = iss["id"]
                if res.get("ai_unavailable"):
                    ai_available = False
                results_by_id[iss["id"]] = res
            except Exception as e:
                print(f"[ai.py] Thread exception for {iss['id']}: {e}")
                ai_available = False
                fb = get_fallback_analysis(iss)
                fb["issue_id"] = iss["id"]
                results_by_id[iss["id"]] = fb

    ordered_results = [results_by_id[i["id"]] for i in sorted_issues]
    return ordered_results, ai_available
