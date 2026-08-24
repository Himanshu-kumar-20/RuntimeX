import React, { useState } from 'react';
import { Terminal, Copy, Check, Zap, Loader2 } from 'lucide-react';

export default function IssueModal({
  issue,
  aiAnalysis,
  onClose,
  onApplyFix,
  isApplyingFix,
  isFixed,
  isAILoading,
}) {
  const [copied, setCopied] = useState(false);

  if (!issue) return null;

  const handleCopyCode = () => {
    if (aiAnalysis?.fixed_code) {
      navigator.clipboard.writeText(aiAnalysis.fixed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confidencePercent = aiAnalysis
    ? Math.round((aiAnalysis.confidence || 0.95) * 100)
    : 95;

  return (
    <div className="terminal-modal-backdrop" onClick={onClose}>
      <div
        className="terminal-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Window Header */}
        <div className="terminal-modal-header">
          <div className="modal-header-left">
            <Terminal size={14} style={{ color: 'var(--green-bright)' }} />
            <div className="terminal-prompt-line" style={{ margin: 0 }}>
              <span className="prompt-user">RuntimeX@engine</span>
              <span className="prompt-symbol">$</span>
              <span className="prompt-cmd">diagnose</span>
              <span className="prompt-flag">--issue={issue.id}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            title="Close Panel [ESC]"
          >
            [ $ exit ]
          </button>
        </div>

        {/* Modal Body */}
        <div className="terminal-modal-body">
          {/* Metadata banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              borderRadius: '3px',
            }}
          >
            <span className="issue-rule-name">RULE: {issue.rule}</span>
            <span>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              FILE: {issue.file}:{issue.line}
            </span>
            <span>|</span>
            <span style={{ color: 'var(--cyan-bright)' }}>
              CONFIDENCE: {confidencePercent}%
            </span>
            {isAILoading && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--amber-bright)',
                  marginLeft: 'auto',
                }}
              >
                <Loader2 size={12} className="spin-icon" />
                <span>[ Refining with Gemini... ]</span>
              </span>
            )}
            {isFixed && (
              <span className="issue-fixed-badge" style={{ marginLeft: 'auto' }}>
                [✓ PATCH ACTIVE]
              </span>
            )}
          </div>

          {/* Root Cause */}
          <div className="diag-section">
            <span className="diag-section-title">=== ROOT CAUSE ANALYSIS ===</span>
            <p className="diag-text">
              {aiAnalysis?.root_cause ||
                'Static AST inspection detected inefficient execution pattern in Android source file.'}
            </p>
          </div>

          {/* Runtime Impact */}
          <div className="diag-section">
            <span className="diag-section-title">=== RUNTIME IMPACT ===</span>
            <p className="diag-text impact-warn">
              &gt; {aiAnalysis?.impact || issue.impact || 'Degraded runtime performance.'}
            </p>
          </div>

          {/* Recommendation */}
          <div className="diag-section">
            <span className="diag-section-title">=== AI REMEDIATION STRATEGY ===</span>
            <p className="diag-text">
              {aiAnalysis?.recommendation ||
                'Refactor the flagged block to follow asynchronous non-blocking Android best practices.'}
            </p>
          </div>

          {/* Before vs After Diff */}
          <div className="diag-section">
            <span className="diag-section-title">
              === CODE PATCH DIFF (ORIGINAL vs OPTIMIZED) ===
            </span>

            <div className="diff-grid-terminal">
              {/* Original */}
              <div className="diff-col">
                <span className="diff-label label-orig">[ - ORIGINAL FLAGGED AST ]</span>
                <div className="diff-code-wrapper">
                  <pre className="diff-code-pre">
                    <code>{issue.code}</code>
                  </pre>
                </div>
              </div>

              {/* Fixed */}
              <div className="diff-col">
                <span className="diff-label label-fixed">[ + AI OPTIMIZED PATCH ]</span>
                <div className="diff-code-wrapper wrapper-fixed">
                  <pre className="diff-code-pre">
                    <code>{aiAnalysis?.fixed_code || '// Local patch suggestion'}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="terminal-modal-footer">
          <button
            type="button"
            className="btn-modal-copy"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: 'var(--green-bright)' }} />
                <span>[✓] Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>[ $ copy-patch ]</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-modal-apply"
            onClick={() => onApplyFix && onApplyFix(issue)}
            disabled={isApplyingFix || isFixed}
          >
            {isApplyingFix ? (
              <span>[ APPLYING PATCH... ]</span>
            ) : isFixed ? (
              <span>[✓ PATCH APPLIED — SCORE UPDATED]</span>
            ) : (
              <>
                <Zap size={14} />
                <span>[ $ Apply Patch & Re-analyze ↵ ]</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
