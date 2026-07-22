from typing import Literal
from pydantic import BaseModel, Field

TemplateType = Literal[
    "Chronological",
    "Functional",
    "Combination",
    "Targeted",
    "Academic CV",
    "Creative Portfolio",
]

class RewriteSuggestion(BaseModel):
    section: str = Field(min_length=2, max_length=120)
    issue: str = Field(min_length=10, max_length=700)
    suggested_rewrite: str = Field(min_length=10, max_length=1400)

class TemplateRecommendation(BaseModel):
    template_type: TemplateType
    reason: str = Field(min_length=20, max_length=900)
    best_for: str = Field(min_length=10, max_length=500)
    practical_tip: str = Field(min_length=10, max_length=600)

class AnalysisResult(BaseModel):
    match_score: int = Field(ge=0, le=100)
    missing_keywords: list[str]
    suggestions: list[RewriteSuggestion]
    template_recommendation: TemplateRecommendation
