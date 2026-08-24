import React, { useState, useMemo } from 'react';
import { Terminal, Zap, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

const CATEGORIES = ['ALL', 'BATTERY', 'CPU', 'UI', 'MEMORY', 'IMAGES'];
const SEVERITIES = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export default function IssueExplorer({
  issues = [],
  aiAnalysis = [],
  onSelectIssue,
  onApplyFix,
  fixedIssueIds = [],
  isOptimized,
  isAILoading,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Category filter
      if (
        selectedCategory !== 'ALL' &&
        iss.category.toUpperCase() !== selectedCategory
      ) {
        return false;
      }
      // Severity filter
      if (
        selectedSeverity !== 'ALL' &&
        iss.severity.toUpperCase() !== selectedSeverity
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRule = iss.rule?.toLowerCase().includes(q);
        const matchFile = iss.file?.toLowerCase().includes(q);
        const matchMessage = iss.message?.toLowerCase().includes(q);
        const matchCode = iss.code?.toLowerCase().includes(q);
        if (!matchRule && !matchFile && !matchMessage && !matchCode) {
          return false;
        }
      }
      return true;
    });
  }, [issues, selectedCategory, selectedSeverity, searchQuery]);

  return (
    <div className="terminal-issues-section">
      <div className="issues-cmd-bar">
        <div className="terminal-prompt-line" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="prompt-user">RuntimeX@engine</span>
            <span className="prompt-symbol">$</span>
            <span className="prompt-cmd">scan</span>
            <span className="prompt-flag">--issues --count={filteredIssues.length}/{issues.length}</span>
          </div>

          {isAILoading && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--amber-bright)',
                background: 'rgba(255, 201, 61, 0.08)',
                border: '1px solid var(--amber-dim)',
                padding: '2px 8px',
                borderRadius: '3px',
              }}
            >
              <Loader2 size={12} className="spin-icon" />
              <span>Generating AI insights...</span>
            </div>
          )}
        </div>

        <div className="search-filter-row">
          <div className="grep-search-box">
            <span className="grep-prefix">$ grep -i</span>
            <input
              type="text"
              className="grep-input"
              placeholder="filter by rule, file, or code pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-switches-row">
            <span className="filter-group-label">CAT:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn-switch ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                --{cat.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="filter-switches-row">
            <span className="filter-group-label">SEV:</span>
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                type="button"
                className={`btn-switch sev-${sev.toLowerCase()} ${
                  selectedSeverity === sev ? 'active' : ''
                }`}
                onClick={() => setSelectedSeverity(sev)}
              >
                --{sev.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="issues-terminal-list">
        {filteredIssues.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            [✓] NO ACTIVE ANTI-PATTERNS MATCHING SPECIFIED FILTER FLAGS
          </div>
        ) : (
          filteredIssues.map((issue, idx) => {
            const isFixed = fixedIssueIds.includes(issue.id);
            const sevTag = `tag-${issue.severity.toLowerCase()}`;

            return (
              <div
                key={issue.id}
                className={`issue-terminal-card ${isFixed ? 'card-fixed' : ''}`}
                onClick={() => onSelectIssue(issue)}
              >
                <div className="issue-card-top-line">
                  <div className="issue-id-badges">
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      [#{String(idx + 1).padStart(3, '0')}]
                    </span>
                    <span className={`issue-sev-tag ${sevTag}`}>
                      [{issue.severity}]
                    </span>
                    <span className={`issue-cat-tag cat-${issue.category.toLowerCase()}`}>
                      [{issue.category.toUpperCase()}]
                    </span>
                    <span className="issue-rule-name">
                      {issue.rule}
                    </span>
                    {isFixed && (
                      <span className="issue-fixed-badge">
                        [✓ FIXED]
                      </span>
                    )}
                  </div>

                  <div className="issue-file-location">
                    file: <strong>{issue.file}</strong> : line {issue.line}
                  </div>
                </div>

                <div className="issue-msg-text">
                  &gt; {issue.message}
                </div>

                {issue.code && (
                  <div className="issue-code-box">
                    <pre className="issue-code-pre">
                      <code>{issue.code}</code>
                    </pre>
                  </div>
                )}

                <div className="issue-bottom-actions">
                  <div className="issue-impact-text">
                    [IMPACT] {issue.impact}
                  </div>

                  <div className="issue-btn-group">
                    {isFixed ? (
                      <span className="issue-fixed-badge">
                        [✓ PATCH APPLIED]
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-card-apply"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyFix && onApplyFix(issue);
                        }}
                        title="Apply AI patch to local AST and re-calculate score"
                      >
                        <Zap size={12} />
                        <span>[ $ Apply Fix ⚡ ]</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-card-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue(issue);
                      }}
                    >
                      <span>[ View AI Fix → ]</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
