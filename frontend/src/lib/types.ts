export type RewriteSuggestion = {
  section: string;
  issue: string;
  suggested_rewrite: string;
};

export type TemplateRecommendation = {
  template_type:
    | "Chronological"
    | "Functional"
    | "Combination"
    | "Targeted"
    | "Academic CV"
    | "Creative Portfolio";
  reason: string;
  best_for: string;
  practical_tip: string;
};

export type AnalysisResult = {
  match_score: number;
  missing_keywords: string[];
  suggestions: RewriteSuggestion[];
  template_recommendation: TemplateRecommendation;
};

export type HistoryRecord = {
  id: string;
  createdAt: string;
  resumeName: string;
  resumeType: string;
  resumeBlob: Blob;
  jobDescription: string;
  jobFileName?: string;
  result: AnalysisResult;
};

export type UserProfile = {
  id: "current";
  fullName: string;
  email: string;
  title: string;
  location: string;
  phone: string;
  website: string;
  bio: string;
  avatar?: Blob;
};

export type ResumeDraft = {
  id: "current";
  updatedAt: string;
  template:
    | "Chronological"
    | "Functional"
    | "Combination"
    | "Targeted"
    | "Academic CV"
    | "Creative Portfolio";
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value)) return false;
  const template = value.template_recommendation;
  return (
    typeof value.match_score === "number" &&
    value.match_score >= 0 &&
    value.match_score <= 100 &&
    Array.isArray(value.missing_keywords) &&
    value.missing_keywords.every((item) => typeof item === "string") &&
    Array.isArray(value.suggestions) &&
    value.suggestions.every(
      (item) =>
        isRecord(item) &&
        typeof item.section === "string" &&
        typeof item.issue === "string" &&
        typeof item.suggested_rewrite === "string",
    ) &&
    isRecord(template) &&
    typeof template.template_type === "string" &&
    typeof template.reason === "string" &&
    typeof template.best_for === "string" &&
    typeof template.practical_tip === "string"
  );
}

export function apiErrorMessage(
  value: unknown,
  fallback = "The resume could not be analyzed. Please try again.",
): string {
  return (
    isRecord(value) &&
    typeof value.detail === "string" &&
    value.detail.trim()
  )
    ? value.detail
    : fallback;
}
