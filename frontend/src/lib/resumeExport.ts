import { ResumeDraft } from "@/lib/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function lines(value: string): string {
  return escapeHtml(value)
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

export function resumeHtml(draft: ResumeDraft): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(draft.fullName || "Resume")}</title>
<style>
body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;color:#222;line-height:1.55;padding:0 24px}
h1{margin-bottom:4px;font-size:34px}h2{border-bottom:2px solid #e99683;padding-bottom:6px;margin-top:28px}
.meta{color:#666}section{margin-top:22px}p{margin:6px 0}
</style></head><body>
<header><h1>${escapeHtml(draft.fullName || "Your Name")}</h1><strong>${escapeHtml(draft.title)}</strong>
<p class="meta">${escapeHtml([draft.email,draft.phone,draft.location,draft.website].filter(Boolean).join(" · "))}</p></header>
<section><h2>Professional Summary</h2>${lines(draft.summary)}</section>
<section><h2>Skills</h2>${lines(draft.skills)}</section>
<section><h2>Experience</h2>${lines(draft.experience)}</section>
<section><h2>Education</h2>${lines(draft.education)}</section>
<section><h2>Projects</h2>${lines(draft.projects)}</section>
<section><h2>Certifications</h2>${lines(draft.certifications)}</section>
</body></html>`;
}

function downloadBlob(content: BlobPart, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportResume(
  draft: ResumeDraft,
  format: "html" | "doc" | "txt" | "json" | "md",
): void {
  const baseName = (draft.fullName.trim() || "resume")
    .replaceAll(/[^a-zA-Z0-9_-]+/g, "_")
    .toLowerCase();

  if (format === "html") {
    downloadBlob(resumeHtml(draft), "text/html;charset=utf-8", `${baseName}.html`);
    return;
  }
  if (format === "doc") {
    downloadBlob(resumeHtml(draft), "application/msword", `${baseName}.doc`);
    return;
  }
  if (format === "json") {
    downloadBlob(JSON.stringify(draft, null, 2), "application/json;charset=utf-8", `${baseName}.json`);
    return;
  }

  const text = [
    draft.fullName,
    draft.title,
    [draft.email,draft.phone,draft.location,draft.website].filter(Boolean).join(" | "),
    "",
    "PROFESSIONAL SUMMARY", draft.summary,
    "", "SKILLS", draft.skills,
    "", "EXPERIENCE", draft.experience,
    "", "EDUCATION", draft.education,
    "", "PROJECTS", draft.projects,
    "", "CERTIFICATIONS", draft.certifications,
  ].join("\n");

  if (format === "md") {
    downloadBlob(`# ${text.replaceAll("\n", "\n\n")}`, "text/markdown;charset=utf-8", `${baseName}.md`);
  } else {
    downloadBlob(text, "text/plain;charset=utf-8", `${baseName}.txt`);
  }
}

export function printResumePdf(draft: ResumeDraft): void {
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("Allow pop-ups to print or save the resume as PDF.");
  popup.document.write(resumeHtml(draft));
  popup.document.close();
  popup.focus();
  popup.print();
}
