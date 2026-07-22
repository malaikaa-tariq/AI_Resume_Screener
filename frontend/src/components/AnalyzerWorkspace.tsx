"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useRef,
  useState,
} from "react";

import AnalysisLoading from "@/components/AnalysisLoading";
import Icon from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";
import { saveHistory } from "@/lib/db";
import {
  AnalysisResult,
  apiErrorMessage,
  isAnalysisResult,
} from "@/lib/types";
import {
  MAX_JOB_TEXT_LENGTH,
  formatFileSize,
  validateJobInput,
  validateResume,
} from "@/lib/validation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const sampleJob = `We are looking for a junior software engineer with strong Python knowledge, experience building REST APIs, familiarity with FastAPI or Django, SQL databases, Git, testing, and clear communication skills. The candidate will collaborate with a product team, write maintainable code, troubleshoot issues, and contribute to technical documentation.`;

export default function AnalyzerWorkspace() {
  const resumeInput = useRef<HTMLInputElement>(null);
  const jobInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);

  const [resume, setResume] = useState<File | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");
  const [dragTarget, setDragTarget] = useState<"resume" | "job" | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [historyState, setHistoryState] = useState<
    "idle" | "saved" | "login-required" | "failed"
  >("idle");

  function chooseResume(file: File | null) {
    const message = validateResume(file);
    if (message) {
      setResume(null);
      setError(message);
      return;
    }
    setResume(file);
    setError("");
  }

  function chooseJob(file: File | null) {
    const message = validateJobInput(jobText, file);
    if (message) {
      setJobFile(null);
      setError(message);
      return;
    }
    setJobFile(file);
    setError("");
  }

  function handleResumeDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragTarget(null);
    chooseResume(event.dataTransfer.files?.[0] ?? null);
  }

  function handleJobDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragTarget(null);
    chooseJob(event.dataTransfer.files?.[0] ?? null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resumeError = validateResume(resume);
    const jobError = validateJobInput(jobText, jobFile);

    if (resumeError || jobError) {
      setError(resumeError || jobError);
      return;
    }

    const abortController = new AbortController();
    controller.current = abortController;

    const formData = new FormData();
    formData.append("resume", resume as File);
    formData.append("job_description", jobText.trim());
    if (jobFile) formData.append("job_description_file", jobFile);

    setLoading(true);
    setResult(null);
    setError("");
    setCopied(null);
    setHistoryState("idle");

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) throw new Error(apiErrorMessage(payload));
      if (!isAnalysisResult(payload)) {
        throw new Error("The server returned an unexpected response.");
      }

      setResult(payload);

      const signedInUser = getCurrentUser();

      if (!signedInUser) {
        setHistoryState("login-required");
      } else {
        try {
          await saveHistory({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            resumeName: (resume as File).name,
            resumeType: (resume as File).type,
            resumeBlob: resume as File,
            jobDescription: jobText.trim(),
            jobFileName: jobFile?.name,
            result: payload,
          });

          setHistoryState("saved");
        } catch {
          setHistoryState("failed");
          setError(
            "Analysis succeeded, but the browser could not save it to your private history.",
          );
        }
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError("Analysis cancelled.");
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "An unexpected error occurred.",
        );
      }
    } finally {
      controller.current = null;
      setLoading(false);
    }
  }

  function reset() {
    controller.current?.abort();
    setResume(null);
    setJobFile(null);
    setJobText("");
    setResult(null);
    setError("");
    setCopied(null);
    setHistoryState("idle");
    if (resumeInput.current) resumeInput.current.value = "";
    if (jobInput.current) jobInput.current.value = "";
  }

  function downloadOriginal() {
    if (!resume) return;
    const url = URL.createObjectURL(resume);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resume.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="workspace-grid">
      <form onSubmit={submit} noValidate className="form-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">New analysis</span>
            <h2>Compare your resume with a real role</h2>
          </div>
          {(resume || jobFile || jobText || result) && (
            <button type="button" className="icon-text-button" onClick={reset}>
              <Icon name="close" size={17} />
              Start over
            </button>
          )}
        </div>

        <div className="form-stack">
          <section>
            <div className="field-row">
              <label>Resume</label>
              <span>PDF, DOCX, PNG, JPG, JPEG, WEBP · 50 MB</span>
            </div>

            <input
              ref={resumeInput}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                chooseResume(event.target.files?.[0] ?? null)
              }
            />

            <div
              role="button"
              tabIndex={0}
              className={`drop-zone ${
                dragTarget === "resume" ? "drop-zone-active" : ""
              }`}
              onClick={() => resumeInput.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  resumeInput.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragTarget("resume");
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragTarget(null)}
              onDrop={handleResumeDrop}
            >
              <span className="upload-symbol">
                <Icon name={resume ? "check" : "upload"} size={28} />
              </span>
              <strong>{resume?.name ?? "Drag and drop your resume here"}</strong>
              <small>
                {resume
                  ? `${formatFileSize(resume.size)} · click to replace`
                  : "or click to browse"}
              </small>
            </div>
          </section>

          <section>
            <div className="field-row">
              <label htmlFor="job-text">Job description</label>
              <button
                type="button"
                onClick={() => {
                  setJobText(sampleJob);
                  setError("");
                }}
              >
                Use sample
              </button>
            </div>

            <textarea
              id="job-text"
              rows={10}
              maxLength={MAX_JOB_TEXT_LENGTH}
              value={jobText}
              onChange={(event) => {
                setJobText(event.target.value);
                setError("");
              }}
              className="input-control textarea"
              placeholder="Paste the complete role requirements..."
            />

            <div className="character-count">
              {jobText.length.toLocaleString()} /{" "}
              {MAX_JOB_TEXT_LENGTH.toLocaleString()}
            </div>

            <div className="or-divider">
              <span />
              or upload a job description
              <span />
            </div>

            <input
              ref={jobInput}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(event) =>
                chooseJob(event.target.files?.[0] ?? null)
              }
            />

            <div
              role="button"
              tabIndex={0}
              className={`compact-drop-zone ${
                dragTarget === "job" ? "drop-zone-active" : ""
              }`}
              onClick={() => jobInput.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  jobInput.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragTarget("job");
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragTarget(null)}
              onDrop={handleJobDrop}
            >
              <Icon name="file" size={24} />
              <div>
                <strong>
                  {jobFile?.name ?? "Drop PDF, DOCX, TXT, or image"}
                </strong>
                <small>
                  {jobFile
                    ? formatFileSize(jobFile.size)
                    : "Maximum size: 20 MB"}
                </small>
              </div>
            </div>
          </section>

          {error && <div className="error-banner">{error}</div>}

          <button
            type="submit"
            className="primary-button analyze-button"
            disabled={loading}
          >
            <Icon name="sparkles" size={19} />
            {loading ? "Analysis in progress" : "Analyze my resume"}
            {!loading && <Icon name="arrow" size={18} />}
          </button>
        </div>
      </form>

      <section className="results-panel" aria-live="polite">
        {loading && (
          <AnalysisLoading onCancel={() => controller.current?.abort()} />
        )}

        {!loading && !result && (
          <div className="empty-results">
            <span>
              <Icon name="sparkles" size={34} />
            </span>
            <h2>Your result will appear here</h2>
            <p>
              The report includes your match score, missing keywords,
              resume-format recommendation, and truthful rewrite ideas.
            </p>
          </div>
        )}

        {!loading && result && (
          <div className="result-content fade-in-up">
            <div className="result-header">
              <div>
                <span className="eyebrow">Analysis complete</span>
                <h2>Your personalized report</h2>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={downloadOriginal}
                >
                  <Icon name="download" size={17} />
                  Original file
                </button>
                <Link href="/resume-builder" className="primary-button">
                  <Icon name="edit" size={17} />
                  Create or update resume
                </Link>
              </div>
            </div>

            <div className="score-template-grid">
              <article className="score-card">
                <div
                  className="score-ring"
                  style={
                    {
                      "--score": `${result.match_score * 3.6}deg`,
                    } as CSSProperties
                  }
                >
                  <div>
                    <strong>{result.match_score}</strong>
                    <span>out of 100</span>
                  </div>
                </div>
              </article>

              <article className="recommended-template">
                <span className="eyebrow">Recommended format</span>
                <h3>{result.template_recommendation.template_type}</h3>
                <p>{result.template_recommendation.reason}</p>

                <div className="recommendation-notes">
                  <div>
                    <strong>Best for</strong>
                    <span>{result.template_recommendation.best_for}</span>
                  </div>
                  <div>
                    <strong>Practical tip</strong>
                    <span>{result.template_recommendation.practical_tip}</span>
                  </div>
                </div>

                <Link href="/templates" className="inline-link">
                  View the full template
                  <Icon name="arrow" size={15} />
                </Link>
              </article>
            </div>

            <section className="result-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">ATS language</span>
                  <h3>Missing keywords</h3>
                </div>
                <span className="count-badge">
                  {result.missing_keywords.length}
                </span>
              </div>

              <div className="keyword-list">
                {result.missing_keywords.length > 0 ? (
                  result.missing_keywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))
                ) : (
                  <p>No important missing keywords were identified.</p>
                )}
              </div>
            </section>

            <section className="result-section">
              <span className="eyebrow">Improvement plan</span>
              <h3>Truthful rewrite suggestions</h3>

              <div className="suggestion-list">
                {result.suggestions.map((suggestion, index) => (
                  <article key={`${suggestion.section}-${index}`}>
                    <div className="suggestion-top">
                      <span>{suggestion.section}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            suggestion.suggested_rewrite,
                          );
                          setCopied(index);
                          window.setTimeout(() => setCopied(null), 1600);
                        }}
                      >
                        {copied === index ? "Copied" : "Copy rewrite"}
                      </button>
                    </div>
                    <strong>Why it needs attention</strong>
                    <p>{suggestion.issue}</p>
                    <div className="rewrite-box">
                      <strong>Suggested improvement</strong>
                      <p>{suggestion.suggested_rewrite}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {historyState === "saved" && (
              <div className="history-success">
                <Icon name="history" size={20} />
                <span>
                  This result was saved only to the signed-in user&apos;s history.
                </span>
                <Link href="/history">Open history</Link>
              </div>
            )}

            {historyState === "login-required" && (
              <div className="info-banner">
                <Icon name="login" size={20} />
                <span>
                  Log in to save this result to your private history.
                </span>
                <Link href="/login">Log in</Link>
              </div>
            )}

            {historyState === "failed" && (
              <div className="error-banner">
                The analysis is complete, but it was not saved to history.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
