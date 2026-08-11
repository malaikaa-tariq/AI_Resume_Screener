"use client";

import { FormEvent, useState } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type StudySession = {
  day: number;
  title: string;
  objective: string;
  duration_minutes: number;
  activities: string[];
  source_chunk_ids: string[];
};


type StudyPlan = {
  topic: string;
  overview: string;
  total_days: number;
  minutes_per_day: number;
  sessions: StudySession[];
};


async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: string;
    };

    return body.detail || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}


export default function StudyCompanionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(45);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  async function uploadAndStore() {
    if (!file) {
      setError("Select a PDF or TXT study document first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    setReady(false);
    setPlan(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${API_URL}/api/v1/study/documents/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(await readApiError(uploadResponse));
      }

      const uploadResult = (await uploadResponse.json()) as {
        text: string;
        document?: { filename?: string };
      };
      const documentSource =
        uploadResult.document?.filename || file.name;

      const processResponse = await fetch(
        `${API_URL}/api/v1/study/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: uploadResult.text,
            source: documentSource,
          }),
        },
      );

      if (!processResponse.ok) {
        throw new Error(await readApiError(processResponse));
      }

      const processResult = (await processResponse.json()) as {
        chunks_created: number;
        vectors_stored: number;
      };

      setSource(documentSource);
      setReady(true);
      setMessage(
        `${documentSource} is ready: ${processResult.chunks_created} chunks and ${processResult.vectors_stored} vectors stored.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The document could not be processed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ready) {
      setError("Upload and process your study document first.");
      return;
    }

    if (!topic.trim()) {
      setError("Enter a topic for your study plan.");
      return;
    }

    setGenerating(true);
    setError("");
    setPlan(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/study/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          days,
          minutes_per_day: minutes,
          top_k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setPlan((await response.json()) as StudyPlan);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The study plan could not be generated.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main>
      <Navbar />

      <section className="content-section">
        <div className="section-intro">
          <span className="eyebrow">AI Study Companion</span>
          <h2>Turn your own notes into a focused study plan.</h2>
          <p>
            Upload a PDF or TXT document, store its embeddings in Qdrant,
            and generate a plan grounded only in the most relevant sections.
          </p>
        </div>

        <div className="workspace-grid" style={{ marginTop: "2rem" }}>
          <section className="form-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Step 1</span>
                <h2>Prepare your notes</h2>
              </div>
            </div>

            <div className="form-stack">
              <label>
                <span className="field-row">
                  <strong>Study document</strong>
                  <small>PDF or TXT</small>
                </span>
                <input
                  className="input-control"
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setReady(false);
                    setPlan(null);
                  }}
                />
              </label>

              <button
                type="button"
                className="primary-button analyze-button"
                disabled={!file || uploading}
                onClick={() => void uploadAndStore()}
              >
                {uploading
                  ? "Creating embeddings..."
                  : "Upload and store notes"}
              </button>

              {message && <div className="success-banner">{message}</div>}
              {error && <div className="error-banner">{error}</div>}
            </div>

            <form className="form-stack" onSubmit={createPlan}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Step 2</span>
                  <h2>Plan your study time</h2>
                </div>
              </div>

              <label>
                <span className="field-row">
                  <strong>Topic</strong>
                  <small>Based on {source || "your notes"}</small>
                </span>
                <input
                  className="input-control"
                  value={topic}
                  placeholder="e.g. Supervised learning"
                  onChange={(event) => setTopic(event.target.value)}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1rem",
                }}
              >
                <label>
                  <strong>Days</strong>
                  <input
                    className="input-control"
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  />
                </label>

                <label>
                  <strong>Minutes per day</strong>
                  <input
                    className="input-control"
                    type="number"
                    min={15}
                    max={480}
                    value={minutes}
                    onChange={(event) => setMinutes(Number(event.target.value))}
                  />
                </label>
              </div>

              <button
                className="primary-button analyze-button"
                disabled={!ready || generating}
                type="submit"
              >
                {generating ? "Generating your plan..." : "Generate study plan"}
              </button>
            </form>
          </section>

          <section className="results-panel">
            {!plan ? (
              <div className="empty-results">
                <span aria-hidden="true">✓</span>
                <h2>Your study plan will appear here</h2>
                <p>
                  The plan will use semantic retrieval, so each session stays
                  connected to content from your uploaded document.
                </p>
              </div>
            ) : (
              <div>
                <div className="result-header">
                  <div>
                    <span className="eyebrow">Generated plan</span>
                    <h2>{plan.topic}</h2>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                      {plan.overview}
                    </p>
                  </div>
                  <strong>{plan.total_days} days</strong>
                </div>

                <div className="form-stack">
                  {plan.sessions.map((session) => (
                    <article
                      key={`${session.day}-${session.title}`}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "18px",
                        background: "var(--surface-soft)",
                        padding: "1.2rem",
                      }}
                    >
                      <div className="field-row">
                        <span className="eyebrow">Day {session.day}</span>
                        <strong>{session.duration_minutes} min</strong>
                      </div>
                      <h3>{session.title}</h3>
                      <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>
                        {session.objective}
                      </p>
                      <ul style={{ lineHeight: 1.8 }}>
                        {session.activities.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>
                      <small style={{ color: "var(--muted)" }}>
                        Sources: {session.source_chunk_ids.join(", ")}
                      </small>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}