import React from 'react';
import { Terminal, Zap, RotateCcw, Check } from 'lucide-react';

export default function OptimizationBanner({ isOptimized, onOptimize, onResetToInitial, isOptimizing, currentScore }) {
  return (
    <div className={`terminal-opt-panel ${isOptimized ? 'is-optimized' : ''}`}>
      <div className="opt-info-left">
        <div className="terminal-prompt-line" style={{ margin: 0 }}>
          <span className="prompt-user">RuntimeX@engine</span>
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd">optimize</span>
          <span className="prompt-flag">{isOptimized ? '--status=applied' : '--simulate'}</span>
        </div>

        <div className="opt-title-line">
          <span className="opt-title">
            {isOptimized ? 'AI Performance Patches Successfully Applied' : 'Automated AI Remediation Simulation Ready'}
          </span>
          <span className={isOptimized ? 'opt-tag-success' : 'opt-tag-sim'}>
            {isOptimized ? '[✓] SCORE: 78/100 (GOOD)' : '[!] PROJECTION: 43 → 78 (+35 PTS)'}
          </span>
        </div>

        <p className="opt-desc">
          {isOptimized
            ? '6 core anti-patterns patched locally (WakeLock release, Coroutine IO offload, Bitmap downsampling, String concatenation refactoring). Performance increased to 78.'
            : 'GenAI synthesized high-efficiency Kotlin patches for WakeLocks, Main Thread lockups, unscaled Bitmaps, and O(N) loop refactors.'}
        </p>
      </div>

      <div className="opt-action-right">
        {isOptimized ? (
          <button
            type="button"
            className="btn-opt-reset"
            onClick={onResetToInitial}
            disabled={isOptimizing}
          >
            <RotateCcw size={14} />
            <span>$ reset --baseline (43)</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-opt-exec"
            onClick={onOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <span>[ SIMULATING PATCHES... ]</span>
            ) : (
              <>
                <Zap size={14} />
                <span>[ $ Simulate Optimization ↵ ]</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
