"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const stages = [
  "Reading the resume and job description",
  "Mapping proven skills to role requirements",
  "Checking missing ATS terminology",
  "Choosing the most suitable resume format",
  "Preparing truthful rewrite suggestions",
  "Saving the result to your history",
];
const tips = [
  "A good resume uses evidence, not only skill names.",
  "A chronological format is strongest when recent experience is relevant.",
  "A functional format can support a major career change.",
  "Numbers make achievements easier to understand and trust.",
  "Keep every final edit accurate and supported by your real experience.",
];

export default function AnalysisLoading({ onCancel }: { onCancel: () => void }) {
  const [stage, setStage] = useState(0);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const stageTimer = window.setInterval(() => setStage((v) => Math.min(v+1, stages.length-1)), 1900);
    const tipTimer = window.setInterval(() => setTip((v) => (v+1)%tips.length), 2800);
    return () => { clearInterval(stageTimer); clearInterval(tipTimer); };
  }, []);

  return (
    <div className="analysis-loading">
      <div className="loading-orbit">
        <span className="loading-core"><Icon name="sparkles" size={28}/></span>
        <span className="orbit-item orbit-one">CV</span>
        <span className="orbit-item orbit-two">ATS</span>
        <span className="orbit-item orbit-three">FORMAT</span>
      </div>
      <span className="eyebrow">Analysis in progress</span>
      <h2>Building your personalized report</h2>
      <p key={stages[stage]} className="fade-in-up">{stages[stage]}</p>
      <div className="progress-track"><span/></div>
      <div className="loading-tip" key={tips[tip]}>
        <Icon name="sparkles" size={18}/>
        <div><strong>Resume insight</strong><p>{tips[tip]}</p></div>
      </div>
      <button type="button" className="secondary-button" onClick={onCancel}>Cancel analysis</button>
    </div>
  );
}
