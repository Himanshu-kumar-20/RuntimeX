import React, { useEffect, useState } from 'react';
import { TrendingUp, FileText, Zap, Download, Check, Loader2, AlertCircle } from 'lucide-react';
import { generateAndDownloadReport } from '../services/pdfReport';

export default function ScoreOverview({
  data,
  prevScore,
  onOpenReport,   // opens the preview modal (optional)
  onFixAll,
  isFixingAll,
  githubUrl,
  isOptimized,
}) {
  if (!data) return null;

  const { score, rating, repository, summary } = data;

  const [displayScore, setDisplayScore] = useState(prevScore ?? score);
  const [reportState, setReportState] = useState('idle'); // 'idle' | 'generating' | 'done' | 'error'
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    const start = prevScore ?? score;
    const end = score;
    if (start === end) { setDisplayScore(end); return; }
    const steps = 28;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayScore(Math.round(start + ((end - start) * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, 26);
    return () => clearInterval(timer);
  }, [score]);

  let ratingClass = 'rating-poor';
  let scoreClass = 'score-danger';
  if (score >= 80)      { ratingClass = 'rating-excellent'; scoreClass = ''; }
  else if (score >= 70) { ratingClass = 'rating-good';      scoreClass = ''; }
  else if (score >= 50) { ratingClass = 'rating-warning';   scoreClass = 'score-warn'; }

  const scoreDelta = prevScore != null && prevScore !== score ? score - prevScore : 0;
  const hasFixableIssues = data.issues && data.issues.length > 0;

  // Generate PDF entirely from already-loaded dashboard state.
  // - No backend calls. No re-analysis. No Gemini.
  // - Uses requestIdleCallback (or setTimeout) so the spinner renders first.
  // - Hard 12s timeout guard to avoid any hang.
  const handleGenerateReport = () => {
    setReportError(null);
    setReportState('generating');

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setReportError('PDF generation timed out after 12 seconds. Try again.');
      setReportState('error');
      setTimeout(() => setReportState('idle'), 6000);
    }, 12000);

    const run = () => {
      if (timedOut) return;
      try {
        const ok = generateAndDownloadReport(data, githubUrl, isOptimized, prevScore);
        clearTimeout(timeoutId);
        if (ok) {
          setReportState('done');
          setTimeout(() => setReportState('idle'), 4000);
        } else {
          setReportError('PDF generation returned no output.');
          setReportState('error');
          setTimeout(() => setReportState('idle'), 6000);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('[ScoreOverview] PDF error:', err);
        setReportError(err?.message || String(err));
        setReportState('error');
        setTimeout(() => setReportState('idle'), 6000);
      }
    };

    // requestIdleCallback lets React paint "Generating..." before the PDF build
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 200 });
    } else {
      setTimeout(run, 60);
    }
  };

  // Clicking the button fires direct download; clicking the label/icon opens the preview modal
  const handleReportButtonClick = () => {
    handleGenerateReport();
  };

  const reportBtnLabel = {
    idle: '[ Generate Report ]',
    generating: '[ Generating... ]',
    done: '[ Report Downloaded ✓ ]',
    error: '[ PDF Error — Retry? ]',
  }[reportState];

  const ReportBtnIcon = {
    idle: FileText,
    generating: Loader2,
    done: Check,
    error: AlertCircle,
  }[reportState];

  const reportBtnStyle = {
    borderColor: reportState === 'error' ? 'var(--red-dim)' : 'var(--cyan-dim)',
    color: reportState === 'error' ? 'var(--red-bright)' : reportState === 'done' ? 'var(--green-bright)' : 'var(--cyan-bright)',
    background: reportState === 'error' ? 'rgba(255,79,106,0.08)' : reportState === 'done' ? 'rgba(61,255,130,0.08)' : 'rgba(34,255,228,0.08)',
    padding: '4px 12px',
    fontWeight: 700,
  };

  return (
    <div className="score-overview-terminal">
      <div className="overview-meta-col">
        <div className="terminal-prompt-line" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="prompt-user">RuntimeX@engine</span>
            <span className="prompt-symbol">$</span>
            <span className="prompt-cmd">runtime-score</span>
            <span className="prompt-flag">--summary</span>
          </div>

          {/* Generate Report Button — inline PDF, no navigation */}
          <button
            type="button"
            className="btn-terminal-nav"
            onClick={handleReportButtonClick}
            disabled={reportState === 'generating'}
            style={reportBtnStyle}
            title={reportState === 'error' ? reportError : 'Generate & download PDF audit report'}
          >
            <ReportBtnIcon
              size={13}
              style={{ color: 'inherit' }}
              className={reportState === 'generating' ? 'spin-icon' : ''}
            />
            <span>{reportBtnLabel}</span>
          </button>
        </div>

        {/* Error message row (only when error) */}
        {reportState === 'error' && reportError && (
          <div style={{
            fontSize: '10px',
            color: 'var(--red-bright)',
            padding: '4px 0 0 2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <AlertCircle size={10} />
            <span>{reportError}</span>
          </div>
        )}

        <div className="repo-spec-table">
          <span className="spec-key">repository:</span>
          <span className="spec-val-highlight">{repository.owner}/{repository.name}</span>

          <span className="spec-key">project type:</span>
          <span className="spec-val">Android Application (Kotlin / Java)</span>

          <span className="spec-key">files scanned:</span>
          <span className="spec-val">{repository.files_scanned} source files</span>

          <span className="spec-key">anti-patterns:</span>
          <span className="spec-val">{data.issues.length} active violations</span>
        </div>

        <div className="severity-counts-row">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            SEVERITY BREAKDOWN:
          </span>
          <div className="sev-chip sev-high">[HIGH] {summary.high}</div>
          <div className="sev-chip sev-med">[MEDIUM] {summary.medium}</div>
          <div className="sev-chip sev-low">[LOW] {summary.low}</div>
        </div>
      </div>

      <div className="overview-meter-col">
        <span className="crt-meter-label">RUNTIME PERFORMANCE SCORE</span>

        <div className={`crt-meter-score-huge ${scoreClass}`}>
          {displayScore}
        </div>

        <span className="crt-meter-max">/ 100 MAXIMUM</span>

        <div className={`crt-rating-badge ${ratingClass}`}>
          {rating.toUpperCase()}
        </div>

        {scoreDelta > 0 && (
          <div className="score-delta-tag">
            <TrendingUp size={12} />
            <span>+{scoreDelta} PTS FROM PATCH</span>
          </div>
        )}

        {/* Fix All Issues Action Button */}
        {onFixAll && hasFixableIssues && (
          <button
            type="button"
            className="btn-fix-all-primary"
            onClick={onFixAll}
            disabled={isFixingAll}
            title="Automatically generate AI patch sets and fix all safe issues locally"
          >
            <Zap size={14} style={{ color: '#000', fill: '#000' }} />
            <span>[ ⚡ FIX ALL ISSUES ]</span>
          </button>
        )}

        {/* Optional: open the full report preview modal */}
        {onOpenReport && (
          <button
            type="button"
            className="btn-terminal-nav"
            onClick={onOpenReport}
            style={{
              marginTop: '8px',
              fontSize: '10px',
              padding: '3px 10px',
              opacity: 0.7,
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Preview full audit report before downloading"
          >
            <span>[ Preview Report ]</span>
          </button>
        )}
      </div>
    </div>
  );
}
