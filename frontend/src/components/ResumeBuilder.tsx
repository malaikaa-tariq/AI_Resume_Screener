"use client";

import { FormEvent, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { getDraft, getProfile, saveDraft } from "@/lib/db";
import { exportResume, printResumePdf } from "@/lib/resumeExport";
import { ResumeDraft } from "@/lib/types";

const emptyDraft: ResumeDraft = {
  id: "current",
  updatedAt: new Date().toISOString(),
  template: "Chronological",
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  skills: "",
  experience: "",
  education: "",
  projects: "",
  certifications: "",
};

const templateOptions: ResumeDraft["template"][] = [
  "Chronological",
  "Functional",
  "Combination",
  "Targeted",
  "Academic CV",
  "Creative Portfolio",
];

export default function ResumeBuilder() {
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [storedDraft, profile] = await Promise.all([getDraft(), getProfile()]);
      if (storedDraft) {
        setDraft(storedDraft);
        return;
      }
      if (profile) {
        setDraft((current) => ({
          ...current,
          fullName: profile.fullName,
          title: profile.title,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          website: profile.website,
          summary: profile.bio,
        }));
      }
    }
    void load();
  }, []);

  function update<K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
    setMessage("");
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    await saveDraft({ ...draft, updatedAt: new Date().toISOString() });
    setMessage("Resume draft saved successfully.");
  }

  const textFields: Array<[keyof ResumeDraft, string, number]> = [
    ["summary", "Professional summary", 5],
    ["skills", "Skills", 5],
    ["experience", "Experience", 8],
    ["education", "Education", 5],
    ["projects", "Projects", 6],
    ["certifications", "Certifications", 4],
  ];

  return (
    <div className="builder-layout">
      <form onSubmit={save} className="builder-form">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Resume editor</span>
            <h2>Create or update your resume</h2>
          </div>
          <button type="submit" className="primary-button small-button">
            <Icon name="save" size={18} />
            Save draft
          </button>
        </div>

        <div className="builder-fields">
          <label>
            Template
            <select
              value={draft.template}
              onChange={(event) =>
                update("template", event.target.value as ResumeDraft["template"])
              }
              className="input-control"
            >
              {templateOptions.map((template) => (
                <option key={template}>{template}</option>
              ))}
            </select>
          </label>

          <div className="two-fields">
            <label>
              Full name
              <input
                value={draft.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                className="input-control"
              />
            </label>
            <label>
              Professional title
              <input
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
                className="input-control"
              />
            </label>
          </div>

          <div className="two-fields">
            <label>
              Email
              <input
                value={draft.email}
                onChange={(event) => update("email", event.target.value)}
                className="input-control"
              />
            </label>
            <label>
              Phone
              <input
                value={draft.phone}
                onChange={(event) => update("phone", event.target.value)}
                className="input-control"
              />
            </label>
          </div>

          <div className="two-fields">
            <label>
              Location
              <input
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
                className="input-control"
              />
            </label>
            <label>
              Website / portfolio
              <input
                value={draft.website}
                onChange={(event) => update("website", event.target.value)}
                className="input-control"
              />
            </label>
          </div>

          {textFields.map(([key, label, rows]) => (
            <label key={key}>
              {label}
              <textarea
                value={draft[key] as string}
                onChange={(event) => update(key, event.target.value as never)}
                rows={rows}
                className="input-control textarea"
                placeholder={`Write your ${label.toLowerCase()} here...`}
              />
            </label>
          ))}

          {message && (
            <div className="success-banner">
              <Icon name="check" size={18} />
              {message}
            </div>
          )}
        </div>
      </form>

      <section className="builder-preview-panel">
        <div className="builder-preview-header">
          <div>
            <span className="eyebrow">Live preview</span>
            <h2>{draft.template}</h2>
          </div>

          <div className="export-menu">
            <button
              type="button"
              className="primary-button small-button"
              onClick={() => setExportOpen((value) => !value)}
            >
              <Icon name="download" size={17} />
              Download
            </button>

            {exportOpen && (
              <div className="export-popover">
                {[
                  ["PDF", "pdf"],
                  ["Word (.doc)", "doc"],
                  ["HTML", "html"],
                  ["Plain text", "txt"],
                  ["Markdown", "md"],
                  ["JSON", "json"],
                ].map(([label, format]) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => {
                      if (format === "pdf") {
                        printResumePdf(draft);
                      } else {
                        exportResume(
                          draft,
                          format as "doc" | "html" | "txt" | "md" | "json",
                        );
                      }
                      setExportOpen(false);
                    }}
                  >
                    <Icon name={format === "pdf" ? "file" : "download"} size={17} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <article
          className={`resume-preview template-${draft.template
            .toLowerCase()
            .replaceAll(" ", "-")}`}
        >
          <header>
            <h1>{draft.fullName || "YOUR NAME"}</h1>
            <strong>{draft.title || "Professional Title"}</strong>
            <p>
              {[
                draft.email || "email@example.com",
                draft.phone || "+00 000 000000",
                draft.location || "City, Country",
                draft.website || "portfolio.example",
              ].join(" · ")}
            </p>
          </header>

          {[
            ["Professional Summary", draft.summary],
            ["Skills", draft.skills],
            ["Experience", draft.experience],
            ["Education", draft.education],
            ["Projects", draft.projects],
            ["Certifications", draft.certifications],
          ].map(([title, content]) => (
            <section key={title}>
              <h2>{title}</h2>
              <div>
                {(content || `Add ${title.toLowerCase()} content.`)
                  .split("\n")
                  .map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
              </div>
            </section>
          ))}
        </article>
      </section>
    </div>
  );
}
