from pydantic import BaseModel, Field
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    github_url: str = Field(..., description="The URL of the public GitHub Android repository")

class RepositoryInfo(BaseModel):
    name: str
    owner: str
    files_scanned: int
    android_project: bool

class Issue(BaseModel):
    id: str
    category: str  # Battery, UI, CPU, Memory, Images
    severity: str  # HIGH, MEDIUM, LOW
    rule: str
    file: str
    line: int
    message: str
    code: str
    impact: str

class AIAnalysisItem(BaseModel):
    issue_id: str
    root_cause: str
    impact: str
    recommendation: str
    fixed_code: str
    confidence: float

class CategoryScores(BaseModel):
    battery: int
    cpu: int
    ui: int
    memory: int
    images: int

class IssueSummary(BaseModel):
    critical: int
    high: int
    medium: int
    low: int

class AnalyzeResponse(BaseModel):
    repository: RepositoryInfo
    score: int
    rating: str          # Excellent, Good, Needs Improvement, Poor
    categories: CategoryScores
    summary: IssueSummary
    issues: List[Issue]
    ai_analysis: List[AIAnalysisItem]
    # True  = Gemini responded with live AI insights
    # False = Network/quota failure; fallback deterministic analysis used instead
    ai_available: bool = True

class DemoOptimizeRequest(BaseModel):
    current_score: int
    issues_to_fix: List[str]  # List of issue IDs to apply suggested fixes for

class AIInsightsRequest(BaseModel):
    issues: List[Issue]

class AIInsightsResponse(BaseModel):
    ai_analysis: List[AIAnalysisItem]
    ai_available: bool = True

class BatchFixRequest(BaseModel):
    issues: List[Issue]
    ai_analysis: List[AIAnalysisItem]
    current_score: int

class BatchFixResponse(BaseModel):
    fixed_count: int
    remaining_count: int
    needs_review_count: int
    initial_score: int
    new_score: int
    rating: str
    categories: CategoryScores
    summary: IssueSummary
    fixed_issue_ids: List[str]
    needs_review_issue_ids: List[str]
    remaining_issues: List[Issue]
    ai_analysis: List[AIAnalysisItem]
