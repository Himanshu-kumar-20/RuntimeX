import React, { useState, useEffect } from 'react';
import { Terminal, Check, Loader2 } from 'lucide-react';

const LOG_STEPS = [
  { text: 'Cloning remote GitHub repository buffer...' },
  { text: 'Parsing AndroidManifest.xml and Gradle build hierarchy...' },
  { text: 'Running 5-pillar AST static scan (WakeLocks, Loops, UI Jank, Leaks, Bitmaps)...' },
  { text: 'Computing score metrics and compiling diagnostic AST buffer...' },
];

export default function LoadingAnalysis() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < LOG_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.round(((currentStep + 1) / LOG_STEPS.length) * 100);

  return (
    <div className="terminal-loading-feed">
      <div className="terminal-prompt-line">
        <span className="prompt-user">RuntimeX@engine</span>
        <span className="prompt-symbol">$</span>
        <span className="prompt-cmd">./analyze</span>
        <span className="prompt-flag">--fast-pipeline</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
        {LOG_STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={idx} className="loading-log-entry">
              {isDone && <span className="log-icon-done">[✓]</span>}
              {isCurrent && <span className="log-icon-active">[⟳]</span>}
              {!isDone && !isCurrent && <span className="log-icon-pending">[ ]</span>}

              <span
                className={
                  isDone ? 'log-text-done' : isCurrent ? 'log-text-active' : 'log-text-pending'
                }
              >
                {step.text}
              </span>

              {isCurrent && <span className="log-tag-active">PROCESSING</span>}
            </div>
          );
        })}
      </div>

      <div className="terminal-progress-bar-wrap">
        <div
          className="terminal-progress-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
        STATUS: {progressPercent}% COMPLETE
      </div>
    </div>
  );
}
