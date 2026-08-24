import React from 'react';

export default function RuntimeXLogo() {
  return (
    <div className="brand-logo-wrapper">
      <div className="brand-logo-main">
        {/* Custom SVG Brand Vector with geometric letterforms and waveform X */}
        <svg
          className="brand-logo-svg"
          viewBox="0 0 540 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="RUNTIMEX Logo"
        >
          <defs>
            {/* Phosphor Glow Filters */}
            <filter id="green-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="7" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear Gradients for Letters */}
            <linearGradient id="white-silver" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#EAFFF1" />
              <stop offset="100%" stopColor="#BCECD0" />
            </linearGradient>

            <linearGradient id="neon-x" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3DFF82" />
              <stop offset="50%" stopColor="#1EFA70" />
              <stop offset="100%" stopColor="#00E55B" />
            </linearGradient>

            <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14C4AE" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3DFF82" stopOpacity="1" />
              <stop offset="100%" stopColor="#22FFE4" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* ─── R ─── */}
          <path
            d="M8 8 H32 C41 8 47 13 47 21 C47 28 42 32 35 34 L48 58 H34 L23 36 H19 V58 H8 V8 Z M19 18 V27 H31 C35 27 37 25 37 22.5 C37 20 35 18 31 18 H19 Z"
            fill="url(#white-silver)"
          />
          {/* Cyan chamfer on R */}
          <line x1="8" y1="8" x2="16" y2="8" stroke="#22FFE4" strokeWidth="2.5" filter="url(#cyan-glow)" />

          {/* ─── U ─── */}
          <path
            d="M58 8 H69 V40 C69 46 73 49 79 49 C85 49 89 46 89 40 V8 H100 V40 C100 52 91 59 79 59 C67 59 58 52 58 40 V8 Z"
            fill="url(#white-silver)"
          />
          <line x1="58" y1="8" x2="66" y2="8" stroke="#22FFE4" strokeWidth="2" />

          {/* ─── N ─── */}
          <path
            d="M112 8 H123 L142 41 V8 H153 V58 H142 L123 25 V58 H112 V8 Z"
            fill="url(#white-silver)"
          />
          <line x1="145" y1="8" x2="153" y2="8" stroke="#22FFE4" strokeWidth="2" />

          {/* ─── T ─── */}
          <path
            d="M162 8 H198 V18 H185 V58 H174 V18 H162 V8 Z"
            fill="url(#white-silver)"
          />
          <polygon points="162,8 168,8 162,14" fill="#22FFE4" />

          {/* ─── I ─── */}
          <path
            d="M207 8 H218 V58 H207 V8 Z"
            fill="url(#white-silver)"
          />

          {/* ─── M ─── */}
          <path
            d="M228 8 H241 L252 33 L263 8 H276 V58 H265 V24 L255 46 H249 L239 24 V58 H228 V8 Z"
            fill="url(#white-silver)"
          />

          {/* ─── E ─── */}
          <path
            d="M287 8 H320 V18 H298 V28 H316 V37 H298 V48 H321 V58 H287 V8 Z"
            fill="url(#white-silver)"
          />
          <polygon points="315,8 320,8 320,13" fill="#22FFE4" />

          {/* ─── X (DISTINCTIVE HERO ELEMENT) ─── */}
          {/* Main X Geometry with angled facet cutouts */}
          <g filter="url(#green-glow)">
            {/* Primary diagonal top-left to bottom-right */}
            <path
              d="M338 8 H353 L382 33 L411 8 H426 L393 36 L428 58 H412 L382 39 L351 58 H336 L371 36 Z"
              fill="url(#neon-x)"
            />

            {/* Inner tech cut lines in X */}
            <line x1="345" y1="14" x2="362" y2="28" stroke="#040D08" strokeWidth="1.5" />
            <line x1="419" y1="14" x2="402" y2="28" stroke="#040D08" strokeWidth="1.5" />
          </g>

          {/* ─── INTEGRATED TELEMETRY WAVEFORM (Speed / Profiler Pulse) ─── */}
          <path
            d="M328 36 H356 L364 24 L372 48 L380 18 L388 44 L396 36 H438"
            stroke="url(#wave-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#green-glow)"
          />
          {/* Pulse node dots */}
          <circle cx="380" cy="18" r="2.5" fill="#FFFFFF" filter="url(#cyan-glow)" />
          <circle cx="372" cy="48" r="2" fill="#22FFE4" />

          {/* ─── BLINKING TERMINAL CURSOR BLOCK ─── */}
          <rect
            className="brand-cursor-rect"
            x="448"
            y="14"
            width="14"
            height="44"
            fill="#3DFF82"
            filter="url(#green-glow)"
            rx="1"
          />

          {/* Corner tech badge accents */}
          <path d="M4 14 V4 H14" stroke="#167538" strokeWidth="1.5" fill="none" />
          <path d="M470 4 H480 V14" stroke="#167538" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Small live telemetry badge */}
        <div className="brand-telemetry-pill">
          <span className="telemetry-live-dot"></span>
          <span>SYS.PERF_PROFILER // v2.5</span>
        </div>
      </div>

      {/* High-Contrast Projector-Friendly Subtitle */}
      <div className="brand-subtitle-row">
        <span className="brand-bracket">[</span>
        <span className="brand-subtitle-text">AI-POWERED ANDROID PERFORMANCE PROFILER</span>
        <span className="brand-bracket">]</span>
      </div>
    </div>
  );
}
