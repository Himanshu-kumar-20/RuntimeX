import React from 'react';

const CATEGORY_LABELS = {
  battery: 'BATTERY',
  cpu: 'CPU',
  ui: 'UI / JANK',
  memory: 'MEMORY',
  images: 'IMAGES',
};

export default function CategoryScores({ categories, issues = [] }) {
  if (!categories) return null;

  const getCategoryIssueCount = (catKey) =>
    issues.filter((iss) => iss.category.toLowerCase() === catKey.toLowerCase()).length;

  return (
    <div className="category-terminal-panel">
      <div className="terminal-prompt-line">
        <span className="prompt-user">RuntimeX@engine</span>
        <span className="prompt-symbol">$</span>
        <span className="prompt-cmd">sys-diag</span>
        <span className="prompt-flag">--pillars=5</span>
      </div>

      <div className="category-meters-list">
        {Object.entries(categories).map(([key, score]) => {
          const catKey = key.toLowerCase();
          const catLabel = CATEGORY_LABELS[catKey] || key.toUpperCase();
          const issueCount = getCategoryIssueCount(key);

          let statusTag = 'OPTIMAL';
          let statusClass = 'cat-status-optimal';
          let barClass = `fill-cat-${catKey}`;
          let scoreColor = 'var(--green-bright)';

          if (score < 60) {
            statusTag = 'CRITICAL';
            statusClass = 'cat-status-critical';
            barClass = 'fill-danger';
            scoreColor = 'var(--red-bright)';
          } else if (score < 80) {
            statusTag = 'WARNING';
            statusClass = 'cat-status-warning';
            barClass = 'fill-warn';
            scoreColor = 'var(--amber-bright)';
          } else {
            if (catKey === 'cpu' || catKey === 'ui') scoreColor = 'var(--cyan-bright)';
            else if (catKey === 'memory') scoreColor = 'var(--purple-bright)';
            else if (catKey === 'images') scoreColor = 'var(--magenta-bright)';
          }

          return (
            <div key={key} className={`category-meter-row cat-row-${catKey}`}>
              <span className="cat-name">{catLabel}</span>

              <div className="cat-bar-container">
                <div
                  className={`cat-bar-fill ${barClass}`}
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>

              <span className="cat-score-val" style={{ color: scoreColor }}>
                {score}%
              </span>

              <span className={`cat-status-tag ${statusClass}`}>
                [{statusTag}]
              </span>

              <span className="cat-issue-count">
                {issueCount} {issueCount === 1 ? 'violation' : 'violations'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
