"use client";

import { FormEvent, useState } from "react";

type RewriteSuggestion = {
  section: string;
  issue: string;
  suggested_rewrite: string;
};

type AnalysisResult = {
  match_score: number;
  missing_keywords: string[];
  suggestions: RewriteSuggestion[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!resume) {
      setError("Please upload a PDF or DOCX resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter the job description.");
      return;
    }

    const extension = resume.name.split(".").pop()?.toLowerCase();

    if (!extension || !["pdf", "docx"].includes(extension)) {
      setError("Only PDF and DOCX resume files are supported.");
      return;
    }

    if (resume.size > 10 * 1024 * 1024) {
      setError("Resume file must not exceed 10 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("resume", resume);
    formData.append("job_description", jobDescription.trim());

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.detail ??
            "The resume could not be analyzed. Please try again.",
        );
      }

      setResult(responseData as AnalysisResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            AI-powered career assistant
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI Resume Screener
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Upload your resume and compare it with a job description to receive
            a match score, missing keywords, and truthful improvement
            suggestions.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Analyze your resume</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload a PDF or DOCX file and provide the complete job
                description.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="resume"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Resume
                </label>

                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(event) => {
                    setResume(event.target.files?.[0] ?? null);
                    setError("");
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 file:mr-4 file:border-0 file:bg-blue-600 file:px-5 file:py-3 file:font-semibold file:text-white hover:file:bg-blue-700"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Supported formats: PDF and DOCX. Maximum size: 10 MB.
                </p>
              </div>

              <div>
                <label
                  htmlFor="job-description"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Job description
                </label>

                <textarea
                  id="job-description"
                  name="job-description"
                  rows={12}
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value);
                    setError("");
                  }}
                  placeholder="Paste the complete job description here..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isLoading ? "Analyzing resume..." : "Analyze resume"}
              </button>
            </div>
          </form>

          <section
            aria-live="polite"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {!result && !isLoading && (
              <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                  📄
                </div>

                <h2 className="text-2xl font-semibold">
                  Your analysis will appear here
                </h2>

                <p className="mt-3 max-w-md leading-7 text-slate-600">
                  Submit your resume and job description to see your match
                  score, missing keywords, and improvement suggestions.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <h2 className="mt-6 text-xl font-semibold">
                  Reviewing your resume
                </h2>

                <p className="mt-2 text-slate-600">
                  Gemini is comparing your resume with the job description.
                </p>
              </div>
            )}

            {result && !isLoading && (
              <div>
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Match score
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-6xl font-bold text-blue-600">
                      {result.match_score}
                    </span>

                    <span className="pb-2 text-xl font-semibold text-slate-500">
                      / 100
                    </span>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, result.match_score),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-7">
                  <h2 className="text-xl font-semibold">Missing keywords</h2>

                  {result.missing_keywords.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.missing_keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-emerald-700">
                      No important missing keywords were identified.
                    </p>
                  )}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-7">
                  <h2 className="text-xl font-semibold">
                    Improvement suggestions
                  </h2>

                  {result.suggestions.length > 0 ? (
                    <div className="mt-5 space-y-5">
                      {result.suggestions.map((suggestion, index) => (
                        <article
                          key={`${suggestion.section}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                            {suggestion.section}
                          </span>

                          <h3 className="mt-4 font-semibold text-slate-900">
                            Issue
                          </h3>

                          <p className="mt-1 leading-7 text-slate-600">
                            {suggestion.issue}
                          </p>

                          <h3 className="mt-4 font-semibold text-slate-900">
                            Suggested improvement
                          </h3>

                          <p className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4 leading-7 text-emerald-900">
                            {suggestion.suggested_rewrite}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">
                      No rewrite suggestions were returned.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}