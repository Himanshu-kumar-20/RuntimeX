import React, { useState, useEffect } from 'react';
import { Terminal, TrendingUp, Check } from 'lucide-react';

export default function ReanalyzeOverlay({ prevScore, newScore }) {
  const [phase, setPhase] = useState('scanning'); // scanning | result
  const [displayScore, setDisplayScore] = useState(prevScore || 0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('result'), 1100);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'result' || newScore == null) return;
    const start = prevScore || 0;
    const end = newScore;
    const diff = end - start;
    if (diff === 0) return;
    const steps = 20;
    const stepMs = 30;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const current = Math.round(start + (diff * step) / steps);
      setDisplayScore(current);
      if (step >= steps) clearInterval(timer);
    }, stepMs);
    return () => clearInterval(timer);
  }, [phase, prevScore, newScore]);

  const scoreDelta = newScore != null && prevScore != null ? newScore - prevScore : 0;

  return (
    <div className="terminal-reanalyze-backdrop">
      <div className="terminal-reanalyze-card">
        <div className="terminal-prompt-line" style={{ margin: 0 }}>
          <span className="prompt-user">RuntimeX@engine</span>
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd">./apply-patch</span>
          <span className="prompt-flag">--reanalyze --inplace</span>
        </div>

        {phase === 'scanning' ? (
          <>
            <div style={{ fontSize: '13px', color: 'var(--amber-bright)', margin: '8px 0' }}>
              [⟳] INJECTING PERFORMANCE PATCH &amp; RE-CALCULATING AST HEURISTICS...
            </div>
            <div style={{ fontSize: '11px', color: 'var(--green-muted)' }}>
              &gt; Evaluating AST memory allocations, WakeLock lifecycles, and thread queues...
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: 'var(--green-bright)', margin: '4px 0', fontWeight: 700 }}>
              [✓] PATCH APPLIED SUCCESSFULLY
            </div>

            <div className="reanalyze-score-delta-box">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--green-muted)' }}>BASELINE</div>
                <div className="score-col-old">{prevScore}</div>
              </div>

              <div style={{ fontSize: '20px', color: 'var(--green-muted)' }}>➔</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--green-bright)' }}>UPDATED</div>
                <div className="score-col-new">{displayScore}</div>
              </div>
            </div>

            {scoreDelta > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--green-bright)',
                  fontWeight: 700,
                }}
              >
                + {scoreDelta} POINTS GAINED
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
