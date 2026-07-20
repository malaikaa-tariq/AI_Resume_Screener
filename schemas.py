from pydantic import BaseModel, Field


class RewriteSuggestion(BaseModel):
    section: str = Field(
        description="Resume section where the improvement applies."
    )
    issue: str = Field(
        description="Brief explanation of the resume problem."
    )
    suggested_rewrite: str = Field(
        description="An improved but truthful version of the resume text."
    )


class AnalysisResult(BaseModel):
    match_score: int = Field(
        ge=0,
        le=100,
        description="Resume and job description match score."
    )
    missing_keywords: list[str] = Field(
        default_factory=list,
        description="Important job keywords missing from the resume."
    )
    suggestions: list[RewriteSuggestion] = Field(
        default_factory=list,
        description="Concrete resume rewrite suggestions."
    )