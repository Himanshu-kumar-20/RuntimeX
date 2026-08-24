import React, { useState } from 'react';
import { Terminal, ArrowRight, ShieldAlert, Zap, GitBranch } from 'lucide-react';
import RuntimeXLogo from './RuntimeXLogo';

export default function HeroInput({ onAnalyze, isAnalyzing, error }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url.trim());
  };

  const handleDemoSelect = () => {
    setUrl('https://github.com/demo-owner/RuntimeXDemoApp');
    onAnalyze('https://github.com/demo-owner/RuntimeXDemoApp');
  };

  return (
    <section className="terminal-hero">
      {/* Custom Vector Brand Wordmark with Waveform X */}
      <RuntimeXLogo />

      <div className="hero-sys-info">
        <span className="sys-info-item">
          <span className="sys-check">[✓]</span> KOTLIN/JAVA AST PARSER READY
        </span>
        <span className="sys-info-item">
          <span className="sys-check">[✓]</span> 5-PILLAR STATIC RULESET LOADED
        </span>
        <span className="sys-info-item">
          <span className="sys-check">[✓]</span> GENAI REMEDIATION ACTIVE
        </span>
      </div>

      <div className="terminal-prompt-line">
        <span className="prompt-user">RuntimeX@engine</span>
        <span className="prompt-symbol">$</span>
        <span className="prompt-cmd">analyze</span>
        <span className="prompt-flag">--repo</span>
      </div>

      <form onSubmit={handleSubmit} className="cli-input-form">
        <div className="cli-input-wrapper">
          <span className="cli-prefix">&gt;</span>
          <input
            type="text"
            className="cli-text-input"
            placeholder="https://github.com/android/architecture-samples"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            className="btn-terminal-exec"
            disabled={isAnalyzing || !url.trim()}
          >
            {isAnalyzing ? (
              <span>[ PROFILING... ]</span>
            ) : (
              <>
                <span>[ Analyze Repository ↵ ]</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="terminal-error-box">
          <ShieldAlert size={16} />
          <div>
            <strong>[ERROR]</strong> {error}
          </div>
        </div>
      )}

      <div className="terminal-presets">
        <span className="presets-label">Command Presets:</span>
        <button
          type="button"
          className="btn-preset preset-demo"
          onClick={handleDemoSelect}
          disabled={isAnalyzing}
        >
          <Zap size={13} />
          <span>$ demo --android [4 Core Issues | Score: 43]</span>
        </button>
        <button
          type="button"
          className="btn-preset"
          onClick={() => {
            const sample = 'https://github.com/android/architecture-samples';
            setUrl(sample);
            onAnalyze(sample);
          }}
          disabled={isAnalyzing}
        >
          <GitBranch size={13} />
          <span>$ analyze --repo=android/architecture-samples</span>
        </button>
      </div>
    </section>
  );
}
