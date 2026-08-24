import React from 'react';
import { Terminal, Zap, RotateCcw } from 'lucide-react';

export default function Navbar({ backendConnected, onReset, onRunDemo, isAnalyzing }) {
  return (
    <header className="terminal-titlebar">
      <div className="titlebar-left">
        <div className="traffic-dots">
          <span className="traffic-dot dot-red"></span>
          <span className="traffic-dot dot-yellow"></span>
          <span className="traffic-dot dot-green"></span>
        </div>
        <div className="titlebar-path">
          <Terminal size={13} style={{ color: 'var(--green-bright)' }} />
          <span className="path-host">RuntimeX@engine</span>
          <span>:</span>
          <span>~/analysis</span>
        </div>
      </div>

      <div className="titlebar-right">
        <div className={`status-badge ${backendConnected ? 'online' : 'offline'}`}>
          <span className="status-blink-dot"></span>
          <span>{backendConnected ? '[✓] ENGINE READY' : '[✖] BACKEND OFFLINE'}</span>
        </div>

        <button
          type="button"
          className="btn-terminal-nav"
          onClick={onRunDemo}
          disabled={isAnalyzing}
          title="Run built-in Android performance demo"
        >
          <Zap size={12} style={{ color: 'var(--amber-bright)' }} />
          <span>$ demo --run</span>
        </button>

        {onReset && (
          <button
            type="button"
            className="btn-terminal-nav"
            onClick={onReset}
            title="Reset Terminal Workspace"
          >
            <RotateCcw size={12} />
            <span>$ clear</span>
          </button>
        )}
      </div>
    </header>
  );
}
