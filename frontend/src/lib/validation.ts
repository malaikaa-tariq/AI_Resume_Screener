export const MAX_RESUME_SIZE = 50 * 1024 * 1024;
export const MAX_JOB_FILE_SIZE = 20 * 1024 * 1024;
export const MIN_JOB_TEXT_LENGTH = 80;
export const MAX_JOB_TEXT_LENGTH = 15_000;

const RESUME_EXTENSIONS = new Set([
  "pdf", "docx", "png", "jpg", "jpeg", "webp",
]);

const JOB_EXTENSIONS = new Set([
  "pdf", "docx", "txt", "png", "jpg", "jpeg", "webp",
]);

export function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateResume(file: File | null): string {
  if (!file) return "Please upload your resume.";
  if (file.size === 0) return "The selected resume is empty.";
  if (file.size > MAX_RESUME_SIZE) return "Resume must not exceed 50 MB.";
  if (!RESUME_EXTENSIONS.has(extensionOf(file))) {
    return "Resume must be PDF, DOCX, PNG, JPG, JPEG, or WEBP.";
  }
  return "";
}

export function validateJobInput(text: string, file: File | null): string {
  const cleaned = text.trim();
  if (!cleaned && !file) {
    return "Paste a job description or upload a job-description file.";
  }
  if (cleaned && cleaned.length < MIN_JOB_TEXT_LENGTH && !file) {
    return `Use at least ${MIN_JOB_TEXT_LENGTH} characters for a meaningful analysis.`;
  }
  if (cleaned.length > MAX_JOB_TEXT_LENGTH) {
    return `Job description must stay under ${MAX_JOB_TEXT_LENGTH.toLocaleString()} characters.`;
  }
  if (file) {
    if (file.size === 0) return "The job-description file is empty.";
    if (file.size > MAX_JOB_FILE_SIZE) return "Job-description file must not exceed 20 MB.";
    if (!JOB_EXTENSIONS.has(extensionOf(file))) {
      return "Job-description file must be PDF, DOCX, TXT, PNG, JPG, JPEG, or WEBP.";
    }
  }
  return "";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
