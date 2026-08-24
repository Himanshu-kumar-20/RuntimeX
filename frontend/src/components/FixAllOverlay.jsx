import React, { useState, useEffect } from 'react';
import { Terminal, Check, Zap, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

const FIX_STEPS = [
  { label: 'Analyzing active AST anti-patterns...', code: 'ANALYZING' },
  { label: 'Generating AI patch sets & refactoring rules...', code: 'GENERATING' },
  { label: 'Applying local AST fixes (0 files pushed to remote GitHub)...', code: 'APPLYING' },
  { label: 'Re-analyzing repository heuristics...', code: 'REANALYZING' },
  { label: 'Batch Optimization Complete!', code: 'COMPLETE' },
];

export default function FixAllOverlay({
  initialScore,
  summaryData,
  onFinish,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(initialScore || 0);

  // Step progression animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < FIX_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setIsDone(true);
          return prev;
        }
      });
    }, 650);

    return () => clearInterval(timer);
  }, []);

  // Score counter animation once done
  useEffect(() => {
    if (!isDone || !summaryData) return;
    const start = initialScore || 0;
    const end = summaryData.new_score || 78;
    const diff = end - start;
    if (diff <= 0) {
      setAnimatedScore(end);
      return;
    }
    const steps = 24;
    let step = 0;
    const scoreTimer = setInterval(() => {
      step++;
      setAnimatedScore(Math.round(start + (diff * step) / steps));
      if (step >= steps) clearInterval(scoreTimer);
    }, 30);
    return () => clearInterval(scoreTimer);
  }, [isDone, initialScore, summaryData]);

  const scoreDelta = summaryData ? summaryData.new_score - (initialScore || 0) : 0;

  return (
    <div className="terminal-reanalyze-backdrop">
      <div className="terminal-reanalyze-card fix-all-overlay-card">
        <div className="terminal-prompt-line" style={{ margin: 0 }}>
          <span className="prompt-user">RuntimeX@engine</span>
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd">fix-all</span>
          <span className="prompt-flag">--safe-auto-patch --inplace-only</span>
        </div>

        {!isDone ? (
          /* Live Progress Sequence */
          <div className="fix-all-steps-wrap">
            <div style={{ fontSize: '13px', color: 'var(--amber-bright)', fontWeight: 700, margin: '6px 0' }}>
              [⚡] EXECUTING AUTOMATED BATCH REMEDIATION
            </div>

            <div className="fix-all-steps-list">
              {FIX_STEPS.map((step, idx) => {
                const isStepDone = idx < currentStep;
                const isStepActive = idx === currentStep;

                return (
                  <div key={idx} className="fix-step-item">
                    <span className="fix-step-icon">
                      {isStepDone ? (
                        <span style={{ color: 'var(--green-bright)', fontWeight: 800 }}>[✓]</span>
                      ) : isStepActive ? (
                        <span style={{ color: 'var(--amber-bright)', fontWeight: 800 }}>[⟳]</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>[ ]</span>
                      )}
                    </span>
                    <span
                      className={`fix-step-label ${
                        isStepDone ? 'step-done' : isStepActive ? 'step-active' : 'step-pending'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Final Summary View */
          <div className="fix-all-summary-wrap">
            <div style={{ fontSize: '14px', color: 'var(--green-bright)', fontWeight: 800 }}>
              [✓] AUTOMATED BATCH OPTIMIZATION COMPLETE
            </div>

            {/* Score Comparison Display */}
            <div className="reanalyze-score-delta-box">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>BASELINE</div>
                <div className="score-col-old">{initialScore}</div>
              </div>

              <div style={{ fontSize: '22px', color: 'var(--green-muted)' }}>➔</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--green-bright)' }}>OPTIMIZED</div>
                <div className="score-col-new">{animatedScore}</div>
              </div>
            </div>

            {/* Final Metrics Summary Grid */}
            <div className="fix-summary-stats-grid">
              <div className="summary-stat-chip chip-fixed">
                <span className="stat-num">{summaryData?.fixed_count ?? 0}</span>
                <span className="stat-label">ISSUES FIXED</span>
              </div>

              <div className="summary-stat-chip chip-remaining">
                <span className="stat-num">{summaryData?.remaining_count ?? 0}</span>
                <span className="stat-label">REMAINING</span>
              </div>

              {summaryData?.needs_review_count > 0 && (
                <div className="summary-stat-chip chip-review">
                  <span className="stat-num">{summaryData.needs_review_count}</span>
                  <span className="stat-label">NEEDS REVIEW</span>
                </div>
              )}

              {scoreDelta > 0 && (
                <div className="summary-stat-chip chip-delta">
                  <span className="stat-num">+{scoreDelta}</span>
                  <span className="stat-label">PTS GAINED</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
              [✓] Fixes applied to local AST workspace only (0 commits pushed to remote GitHub).
              {summaryData?.needs_review_count > 0 && ' Architectural issues marked [NEEDS REVIEW].'}
            </div>

            <button
              type="button"
              className="btn-opt-exec"
              style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
              onClick={onFinish}
            >
              <Zap size={14} />
              <span>[ View Updated Workspace ↵ ]</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
