"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { deleteHistory, listHistory } from "@/lib/db";
import { HistoryRecord } from "@/lib/types";

export default function HistoryManager() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const nextRecords = await listHistory();
    setRecords(nextRecords);
    setSelected((current) => {
      if (!current) return nextRecords[0] ?? null;
      return (
        nextRecords.find((record) => record.id === current.id) ??
        nextRecords[0] ??
        null
      );
    });
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function remove(record: HistoryRecord) {
    if (!window.confirm(`Delete the saved analysis for ${record.resumeName}?`)) {
      return;
    }
    await deleteHistory(record.id);
    await refresh();
  }

  function downloadOriginal(record: HistoryRecord) {
    const url = URL.createObjectURL(record.resumeBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = record.resumeName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="empty-state">
        <Icon name="history" size={34} />
        <h2>Loading your analysis history</h2>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="history" size={38} />
        <h2>No saved analyses yet</h2>
        <p>
          Complete an analysis and it will appear here with the original file
          and result.
        </p>
      </div>
    );
  }

  return (
    <div className="history-layout">
      <aside className="history-list">
        {records.map((record) => (
          <article
            key={record.id}
            className={selected?.id === record.id ? "history-card-active" : ""}
          >
            <button
              type="button"
              className="history-select"
              onClick={() => setSelected(record)}
            >
              <span className="file-type-icon">
                <Icon name="file" size={22} />
              </span>
              <span>
                <strong>{record.resumeName}</strong>
                <small>{new Date(record.createdAt).toLocaleString()}</small>
                <em>Match: {record.result.match_score}%</em>
              </span>
            </button>

            <button
              type="button"
              className="history-delete"
              onClick={() => void remove(record)}
              aria-label={`Delete ${record.resumeName}`}
            >
              <Icon name="trash" size={18} />
            </button>
          </article>
        ))}
      </aside>

      {selected && (
        <section className="history-detail">
          <div className="history-detail-header">
            <div>
              <span className="eyebrow">Saved analysis</span>
              <h2>{selected.resumeName}</h2>
              <p>{new Date(selected.createdAt).toLocaleString()}</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => downloadOriginal(selected)}
            >
              <Icon name="download" size={17} />
              Download original
            </button>
          </div>

          <div className="history-summary">
            <div>
              <strong>{selected.result.match_score}%</strong>
              <span>Match score</span>
            </div>
            <div>
              <strong>{selected.result.missing_keywords.length}</strong>
              <span>Missing keywords</span>
            </div>
            <div>
              <strong>{selected.result.template_recommendation.template_type}</strong>
              <span>Recommended format</span>
            </div>
          </div>

          <section className="history-section">
            <h3>Why this template?</h3>
            <p>{selected.result.template_recommendation.reason}</p>
          </section>

          <section className="history-section">
            <h3>Missing keywords</h3>
            <div className="keyword-list">
              {selected.result.missing_keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
          </section>

          <section className="history-section">
            <h3>Suggestions</h3>
            <div className="suggestion-list">
              {selected.result.suggestions.map((suggestion) => (
                <article key={suggestion.section + suggestion.issue}>
                  <div className="suggestion-top">
                    <span>{suggestion.section}</span>
                  </div>
                  <p>{suggestion.issue}</p>
                  <div className="rewrite-box">
                    <p>{suggestion.suggested_rewrite}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
