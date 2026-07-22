"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

const templates = [
  {
    id: "chronological",
    name: "Chronological",
    icon: "history" as const,
    reason:
      "Best for a consistent work history, clear progression, and recent experience that closely matches the role.",
    sections: [
      ["Header", "Name, target title, contact details, portfolio"],
      ["Professional Summary", "3–4 lines connecting recent experience to the role"],
      ["Work Experience", "Reverse chronological roles with measurable achievements"],
      ["Skills", "Relevant tools, methods, and professional strengths"],
      ["Education", "Degree, institution, location, dates"],
      ["Projects and Certifications", "Selected evidence that strengthens the application"],
    ],
  },
  {
    id: "functional",
    name: "Functional",
    icon: "sparkles" as const,
    reason:
      "Best for a major career change, employment gaps, returning to work, or situations where transferable skills matter more than dates.",
    sections: [
      ["Header", "Name, target title, contact details"],
      ["Career Objective", "A concise explanation of the target direction"],
      ["Core Competencies", "Grouped skill categories with evidence"],
      ["Selected Achievements", "Results that demonstrate transferable ability"],
      ["Projects", "Relevant practical work"],
      ["Employment History", "Brief company, title, and date list"],
      ["Education and Training", "Degrees, certificates, and courses"],
    ],
  },
  {
    id: "combination",
    name: "Combination",
    icon: "template" as const,
    reason:
      "Best when both strong skills and relevant experience deserve equal attention.",
    sections: [
      ["Header", "Name, target title, contact details"],
      ["Professional Profile", "A role-specific value statement"],
      ["Key Skills", "Grouped skills with short proof points"],
      ["Professional Experience", "Recent positions and achievements"],
      ["Projects", "Role-relevant technical or professional work"],
      ["Education", "Degrees and training"],
      ["Certifications", "Relevant credentials"],
    ],
  },
  {
    id: "targeted",
    name: "Targeted",
    icon: "check" as const,
    reason:
      "Best for one specific role when the resume contains closely relevant evidence that should be prioritized.",
    sections: [
      ["Header", "Name and exact target role"],
      ["Targeted Summary", "A summary written around the employer’s main priorities"],
      ["Matched Skills", "Only the most relevant proven competencies"],
      ["Relevant Experience", "Selected achievements aligned with requirements"],
      ["Relevant Projects", "Projects that demonstrate the requested capabilities"],
      ["Education and Credentials", "Only role-relevant qualifications"],
    ],
  },
  {
    id: "academic",
    name: "Academic CV",
    icon: "file" as const,
    reason:
      "Best for research, teaching, grants, publications, conferences, and academic applications.",
    sections: [
      ["Academic Header", "Name, field, institution, academic contact details"],
      ["Research Interests", "Focused research areas"],
      ["Education", "Degrees, thesis titles, supervisors, distinctions"],
      ["Academic Appointments", "Teaching and research positions"],
      ["Publications", "Peer-reviewed work and manuscripts"],
      ["Research Experience", "Projects, laboratories, and methods"],
      ["Teaching Experience", "Courses, responsibilities, student outcomes"],
      ["Grants and Awards", "Funding and recognition"],
      ["Conferences and Service", "Presentations, reviewing, committees"],
    ],
  },
  {
    id: "creative",
    name: "Creative Portfolio",
    icon: "image" as const,
    reason:
      "Best for design, writing, media, photography, branding, and portfolio-led careers.",
    sections: [
      ["Visual Header", "Name, specialty, portfolio link, contact details"],
      ["Creative Profile", "A short statement of style and value"],
      ["Featured Work", "3–5 projects with challenge, contribution, and result"],
      ["Capabilities", "Tools, media, methods, and creative strengths"],
      ["Experience", "Clients, studios, agencies, or in-house roles"],
      ["Recognition", "Awards, exhibitions, publications, or press"],
      ["Education", "Relevant degrees and training"],
    ],
  },
];

export default function TemplateLibrary() {
  const [active, setActive] = useState(templates[0].id);

  return (
    <div className="template-library">
      <aside className="template-tabs">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className={active === template.id ? "template-tab-active" : ""}
            onClick={() => setActive(template.id)}
          >
            <Icon name={template.icon} size={19} />
            <span>
              <strong>{template.name}</strong>
              <small>{template.reason}</small>
            </span>
          </button>
        ))}
      </aside>

      <div className="template-documents">
        {templates.map((template) => (
          <article
            key={template.id}
            className={`full-template ${
              active === template.id ? "full-template-active" : ""
            }`}
          >
            <header>
              <div>
                <span className="eyebrow">Complete format</span>
                <h2>{template.name} Resume</h2>
                <p>{template.reason}</p>
              </div>
              <span className="document-icon">
                <Icon name={template.icon} size={30} />
              </span>
            </header>

            <div className="template-person">
              <div>
                <h3>YOUR FULL NAME</h3>
                <strong>Target Professional Title</strong>
              </div>
              <p>
                email@example.com · +00 000 000000 · City, Country ·
                portfolio.example
              </p>
            </div>

            <div className="template-sections">
              {template.sections.map(([title, description], index) => (
                <section key={title}>
                  <span>{index + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                    <div className="template-lines">
                      <i />
                      <i />
                      {index % 2 === 0 && <i />}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <footer>
              <Icon name="check" size={18} />
              Replace every placeholder with truthful, role-relevant evidence.
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
