import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function AIUnavailableBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="ai-unavailable-banner">
      <div className="ai-banner-left">
        <AlertTriangle size={15} className="ai-banner-icon" />
        <span className="ai-banner-title">[WARN: AI STREAM UNREACHABLE]</span>
        <span className="ai-banner-sub">
          Switched to high-precision deterministic AST rule engine.
        </span>
        <button
          className="ai-banner-expand-btn"
          onClick={() => setExpanded((v) => !v)}
          title="Toggle Details"
        >
          {expanded ? '[- details]' : '[+ details]'}
        </button>
        <button
          className="ai-banner-dismiss"
          onClick={() => setDismissed(true)}
          title="Dismiss Alert"
        >
          [x]
        </button>
      </div>

      {expanded && (
        <div className="ai-banner-details">
          <p>
            &gt; Remote connection to Google Gemini API could not be established or quota limit reached.
            RuntimeX has engaged its built-in rule analyzer. All code diagnostics, impact warnings,
            and remediation code patches are computed locally and remain fully available.
          </p>
          <ul>
            <li>[✓] Full static AST scan complete</li>
            <li>[✓] Performance score calculated</li>
            <li>[✓] Local deterministic fix generation active</li>
            <li>[!] Live GenAI reasoning offline</li>
          </ul>
        </div>
      )}
    </div>
  );
}
