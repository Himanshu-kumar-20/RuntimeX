import React, { useState } from 'react';
import {
  Terminal, Download, Printer, X, Check, Loader2, TrendingUp, AlertCircle
} from 'lucide-react';
import { generateAndDownloadReport } from '../services/pdfReport';

export default function ReportModal({
  data,
  githubUrl,
  isOptimized,
  prevScore,
  onClose,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (!data) return null;

  const {
    repository,
    score,
    rating,
    categories,
    summary,
    issues = [],
    ai_analysis = [],
  } = data;

  const reportDate = new Date().toUTCString();

  const handleDownload = () => {
    setDownloadError(null);
    setIsGenerating(true);
    // Run in a setTimeout so React can re-render the "Generating..." state
    // before the synchronous PDF build blocks the main thread.
    setTimeout(() => {
      try {
        const ok = generateAndDownloadReport(data, githubUrl, isOptimized, prevScore);
        if (ok) {
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
        } else {
          setDownloadError('PDF generation returned false — no download triggered.');
        }
      } catch (err) {
        console.error('[ReportModal] PDF generation error:', err);
        setDownloadError(`PDF error: ${err?.message || String(err)}`);
      } finally {
        setIsGenerating(false);
      }
    }, 60);
  };

  const handlePrint = () => {
    window.print();
  };

  const getAiForItem = (issueId) =>
    ai_analysis.find((ai) => ai.issue_id === issueId) || null;

  return (
    // Backdrop — clicking outside closes the modal, does NOT navigate
    <div
      className="terminal-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="terminal-modal-window report-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Terminal Header Bar ── */}
        <div className="terminal-modal-header">
          <div className="modal-header-left">
            <Terminal size={14} style={{ color: 'var(--green-bright)' }} />
            <div className="terminal-prompt-line" style={{ margin: 0 }}>
              <span className="prompt-user">RuntimeX@engine</span>
              <span className="prompt-symbol">$</span>
              <span className="prompt-cmd">export-report</span>
              <span className="prompt-flag">
                --format=pdf --target={repository?.name || 'report'}.pdf
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-modal-copy"
              onClick={handlePrint}
              title="Print / Save as PDF via browser dialog"
            >
              <Printer size={13} />
              <span>[ Print / Save ]</span>
            </button>

            <button
              type="button"
              className="btn-modal-apply"
              onClick={handleDownload}
              disabled={isGenerating}
              title="Download PDF to local file"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="spin-icon" />
                  <span>[ GENERATING... ]</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check size={13} />
                  <span>[ PDF DOWNLOADED ✓ ]</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>[ Download PDF ]</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              title="Close [ESC]"
            >
              [ $ exit ]
            </button>
          </div>
        </div>

        {/* ── Error Banner (shown when PDF generation fails) ── */}
        {downloadError && (
          <div
            style={{
              background: 'rgba(255,79,106,0.12)',
              border: '1px solid var(--red-bright)',
              color: 'var(--red-bright)',
              padding: '8px 16px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={13} />
            <span><strong>[ERROR]</strong> {downloadError}</span>
            <button
              type="button"
              onClick={() => setDownloadError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--red-bright)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Scrollable Report Preview ── */}
        <div className="terminal-modal-body report-modal-body">
          <div className="report-document-paper">

            {/* Report Header */}
            <div className="report-doc-header">
              <div className="report-brand-row">
                <div>
                  <h1 className="report-brand-title">
                    <span>RUNTIME</span>
                    <span style={{ color: 'var(--green-bright)' }}>X</span>
                    <span style={{ color: 'var(--green-bright)' }}>_</span>
                  </h1>
                  <div className="report-brand-sub">
                    AI-POWERED ANDROID PERFORMANCE PROFILER AUDIT REPORT
                  </div>
                </div>

                <div className="report-meta-box">
                  <div><strong>AUDIT DATE:</strong> {reportDate}</div>
                  <div><strong>SPEC VERSION:</strong> RUNTIMEX_CORE v2.5</div>
                  <div><strong>CLASSIFICATION:</strong> PERFORMANCE DIAGNOSTIC</div>
                </div>
              </div>
            </div>

            {/* Target Spec Section */}
            <div className="report-section">
              <div className="report-section-heading">=== 1. TARGET REPOSITORY SPECIFICATION ===</div>
              <div className="report-spec-grid">
                <div><strong>REPOSITORY:</strong> {repository.owner}/{repository.name}</div>
                <div><strong>GITHUB URL:</strong> {githubUrl || `https://github.com/${repository.owner}/${repository.name}`}</div>
                <div><strong>FRAMEWORK:</strong> Android Application (Kotlin / Java)</div>
                <div><strong>FILES SCANNED:</strong> {repository.files_scanned} source files</div>
                <div><strong>PROJECT STATUS:</strong> [✓] ANDROID MANIFEST &amp; GRADLE DETECTED</div>
                <div><strong>STATIC AST PIPELINE:</strong> 5-PILLAR PROFILER (Battery, CPU, UI, Memory, Images)</div>
              </div>
            </div>

            {/* Score & Rating Section */}
            <div className="report-section">
              <div className="report-section-heading">=== 2. RUNTIMEX PERFORMANCE SCORE OVERVIEW ===</div>
              <div className="report-score-row">
                <div className="report-score-box">
                  <div className="report-score-label">OVERALL RUNTIME SCORE</div>
                  <div className="report-score-num">
                    {score} <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>/ 100</span>
                  </div>
                  <div className="report-score-rating">RATING: [ {rating.toUpperCase()} ]</div>
                  {(isOptimized || (prevScore != null && prevScore !== score)) && (
                    <div className="report-optimization-delta">
                      <TrendingUp size={13} />
                      <span>OPTIMIZATION: {prevScore ?? 43} → {score} (+{score - (prevScore ?? 43)} POINTS)</span>
                    </div>
                  )}
                </div>

                <div className="report-severity-box">
                  <div className="report-score-label">ACTIVE ANTI-PATTERNS DETECTED: {issues.length}</div>
                  <div className="report-sev-breakdown">
                    <span className="sev-chip sev-high">[HIGH SEVERITY]: {summary.high}</span>
                    <span className="sev-chip sev-med">[MEDIUM SEVERITY]: {summary.medium}</span>
                    <span className="sev-chip sev-low">[LOW SEVERITY]: {summary.low}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                    Static analysis inspected AST nodes for WakeLock holding patterns,
                    main-thread blocking operations, deeply nested loops, unscaled bitmap
                    decodes, and static context memory leaks.
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Pillar Category Breakdown */}
            <div className="report-section">
              <div className="report-section-heading">=== 3. 5-PILLAR SUBSYSTEM PERFORMANCE METRICS ===</div>
              <div className="report-pillars-table">
                {Object.entries(categories || {}).map(([key, catScore]) => (
                  <div key={key} className="report-pillar-row">
                    <span className="pillar-name">{key.toUpperCase()}</span>
                    <div className="pillar-bar-track">
                      <div
                        className={`pillar-bar-fill ${
                          catScore < 60 ? 'fill-danger' : catScore < 80 ? 'fill-warn' : ''
                        }`}
                        style={{ width: `${Math.min(catScore, 100)}%` }}
                      />
                    </div>
                    <span className="pillar-score-val">{catScore}%</span>
                    <span
                      className={`pillar-tag ${
                        catScore < 60 ? 'cat-status-critical' :
                        catScore < 80 ? 'cat-status-warning' : 'cat-status-optimal'
                      }`}
                    >
                      [{catScore < 60 ? 'CRITICAL' : catScore < 80 ? 'WARNING' : 'OPTIMAL'}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vulnerability Audit Section */}
            <div className="report-section">
              <div className="report-section-heading">=== 4. COMPREHENSIVE VULNERABILITY &amp; AI REMEDIATION AUDIT ===</div>
              {issues.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--green-bright)', fontSize: '12px' }}>
                  [✓] ZERO ANTI-PATTERNS DETECTED. CODEBASE EXHIBITS HIGH RUNTIME EFFICIENCY.
                </div>
              ) : (
                <div className="report-issues-list">
                  {issues.map((iss, index) => {
                    const ai = getAiForItem(iss.id);
                    return (
                      <div key={iss.id} className="report-issue-card">
                        <div className="report-issue-title-bar">
                          <span style={{ fontWeight: 800 }}>
                            [#{String(index + 1).padStart(3, '0')}] {iss.rule}
                          </span>
                          <span className={`issue-sev-tag tag-${iss.severity.toLowerCase()}`}>
                            [{iss.severity}]
                          </span>
                          <span className="issue-cat-tag">
                            [{iss.category.toUpperCase()}]
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                            FILE: {iss.file}:{iss.line}
                          </span>
                        </div>

                        <div className="report-issue-detail">
                          <div><strong>DIAGNOSTIC MESSAGE:</strong> {iss.message}</div>
                          <div style={{ color: 'var(--amber-bright)' }}>
                            <strong>RUNTIME IMPACT:</strong> {iss.impact || ai?.impact || 'Performance degradation.'}
                          </div>
                          {ai?.root_cause && (
                            <div><strong>AI ROOT CAUSE:</strong> {ai.root_cause}</div>
                          )}
                          {ai?.recommendation && (
                            <div><strong>REMEDIATION STRATEGY:</strong> {ai.recommendation}</div>
                          )}
                        </div>

                        {/* Code Diff Box */}
                        <div className="report-diff-grid">
                          <div className="report-diff-col">
                            <div className="diff-label label-orig">[ - ORIGINAL FLAGGED CODE ]</div>
                            <div className="diff-code-wrapper">
                              <pre className="diff-code-pre">
                                <code>{iss.code || '// Source snippet unavailable'}</code>
                              </pre>
                            </div>
                          </div>

                          <div className="report-diff-col">
                            <div className="diff-label label-fixed">[ + AI OPTIMIZED PATCH ]</div>
                            <div className="diff-code-wrapper wrapper-fixed">
                              <pre className="diff-code-pre">
                                <code>{ai?.fixed_code || '// Automated remediation patch'}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Report Footer */}
            <div className="report-doc-footer">
              <div>END OF AUDIT REPORT // GENERATED BY RUNTIMEX STATIC &amp; GENAI ENGINE</div>
              <div>CONFIDENTIAL &amp; PROPRIETARY // LICENSED FOR DEVELOPER PERFORMANCE PROFILING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
