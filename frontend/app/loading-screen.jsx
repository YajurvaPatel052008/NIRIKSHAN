"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import BrandLogo from "../components/brand-logo";

const DURATION = 3500;

export default function LoadingScreen({ children }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, Math.round((elapsed / DURATION) * 100)));
    }, 40);
    const closeTimer = window.setTimeout(() => {
      setProgress(100);
      setVisible(false);
    }, DURATION);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  const status = progress < 35
    ? "Initializing secure workspace"
    : progress < 70
      ? "Loading compliance intelligence"
      : "Preparing enforcement dashboard";

  return (
    <>
      <div className={`niriksha-splash ${visible ? "is-visible" : "is-hidden"}`} aria-hidden={!visible}>
        <div className="niriksha-splash-grid" />
        <div className="niriksha-splash-content">
          <div className="niriksha-splash-mark">
            <BrandLogo className="h-16 w-24" />
            <span className="niriksha-eye-scan" />
          </div>
          <p className="niriksha-splash-eyebrow">Government enforcement platform</p>
          <h1>NIRIKSHAN</h1>
          <p className="niriksha-splash-subtitle">Legal Metrology Compliance Intelligence</p>
          <div className="niriksha-loader">
            <div className="niriksha-loader-track">
              <div className="niriksha-loader-progress" style={{ width: `${progress}%` }} />
            </div>
            <div className="niriksha-loader-meta">
              <span>{status}</span>
              <strong>{progress}%</strong>
            </div>
          </div>
          <p className="niriksha-splash-footer">AI-assisted. Officer-led. Evidence-based.</p>
        </div>
      </div>
      <div className={visible ? "niriksha-app-hidden" : "niriksha-app-ready"}>{children}</div>
    </>
  );
}
