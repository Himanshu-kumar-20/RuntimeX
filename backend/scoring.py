from typing import List, Dict, Tuple

def get_rating(score: int) -> str:
    """
    Returns the rating label based on the performance score:
    90-100 = Excellent
    75-89 = Good
    50-74 = Needs Improvement
    0-49 = Poor
    """
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Needs Improvement"
    else:
        return "Poor"

def calculate_scores(issues: List[Dict]) -> Tuple[int, str, Dict[str, int], Dict[str, int]]:
    """
    Calculates deterministic performance scores:
    Deducts per issue: HIGH = 12, MEDIUM = 7, LOW = 3
    Capped at 0.
    
    Returns:
      (overall_score, rating, category_scores, issue_summary)
    """
    # Deductions dictionary
    deductions = {
        "HIGH": 12,
        "MEDIUM": 7,
        "LOW": 3
    }
    
    # Initialize overall and category scores
    overall_score = 100
    category_scores = {
        "battery": 100,
        "cpu": 100,
        "ui": 100,
        "memory": 100,
        "images": 100
    }
    
    # Initialize issue counts by severity for the summary
    summary = {
        "critical": 0,  # CRITICAL is 0 since we have HIGH, MEDIUM, LOW
        "high": 0,
        "medium": 0,
        "low": 0
    }
    
    for issue in issues:
        severity = issue.get("severity", "MEDIUM").upper()
        category = issue.get("category", "").lower()
        
        # Normalize CPU/UI/Images keys
        if category == "images":
            cat_key = "images"
        elif category in ["ui", "uijank"]:
            cat_key = "ui"
        elif category in ["cpu", "performance"]:
            cat_key = "cpu"
        elif category == "battery":
            cat_key = "battery"
        elif category == "memory":
            cat_key = "memory"
        else:
            cat_key = None
            
        deduct_val = deductions.get(severity, 7)
        
        # Deduct from overall score
        overall_score -= deduct_val
        
        # Deduct from category score
        if cat_key in category_scores:
            category_scores[cat_key] -= deduct_val
            
        # Update summary counts
        if severity == "HIGH":
            summary["high"] += 1
        elif severity == "MEDIUM":
            summary["medium"] += 1
        elif severity == "LOW":
            summary["low"] += 1

    # Clamp scores between 0 and 100
    overall_score = max(0, min(100, overall_score))
    for cat in category_scores:
        category_scores[cat] = max(0, min(100, category_scores[cat]))
        
    rating = get_rating(overall_score)
    
    return overall_score, rating, category_scores, summary
