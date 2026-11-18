import React from 'react';

// Decorative skyline for the hero (pure SVG, no external image).
export default function CityIllustration({ className = '' }) {
  const towers = [
    { x: 40, w: 46, h: 120 }, { x: 96, w: 40, h: 170 }, { x: 146, w: 58, h: 230 },
    { x: 214, w: 44, h: 150 }, { x: 268, w: 70, h: 285 }, { x: 348, w: 50, h: 190 },
    { x: 408, w: 62, h: 135 }, { x: 480, w: 44, h: 105 },
  ];
  const base = 360;
  return (
    <svg viewBox="0 0 580 400" className={className} role="img" aria-label="Illustration of a city skyline with location pins">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbeafe" /><stop offset="1" stopColor="#f0f9ff" />
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4b84c4" /><stop offset="1" stopColor="#2b5f9e" />
        </linearGradient>
        <linearGradient id="tower2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7fb3e0" /><stop offset="1" stopColor="#4f8fcb" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#bae6fd" />
        </linearGradient>
      </defs>
      <ellipse cx="300" cy="200" rx="290" ry="190" fill="url(#sky)" opacity=".7" />
      {/* connection arcs */}
      <path d="M90 60 Q200 -10 330 40 T520 70" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 5" />
      <path d="M60 150 Q220 90 330 120" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 5" />
      {/* background towers */}
      {towers.map((t, i) => (
        <rect key={`b${i}`} x={t.x - 8} y={base - t.h * 0.8} width={t.w} height={t.h * 0.8} rx="3" fill="url(#tower2)" opacity=".55" />
      ))}
      {/* towers */}
      {towers.map((t, i) => {
        const rows = Math.floor((t.h - 20) / 22);
        const cols = Math.max(2, Math.floor(t.w / 14));
        return (
          <g key={i}>
            <rect x={t.x} y={base - t.h} width={t.w} height={t.h} rx="3" fill="url(#tower)" />
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => (
                <rect key={`${r}-${c}`} x={t.x + 6 + c * ((t.w - 12) / cols)} y={base - t.h + 12 + r * 22} width={(t.w - 12) / cols - 3} height="9" rx="1.5"
                  fill="#e0f2fe" opacity={(r * 7 + c * 3 + i) % 5 === 0 ? 0.35 : 0.85} />
              ))
            )}
          </g>
        );
      })}
      <rect x="296" y={base - 285 - 26} width="6" height="28" fill="#2b5f9e" />
      {/* greenery */}
      {[70, 130, 210, 330, 440, 505].map((x, i) => (
        <g key={i}><circle cx={x} cy={base - 8} r={14 + (i % 3) * 3} fill="#16a34a" opacity=".85" /><circle cx={x + 10} cy={base - 14} r={10} fill="#22c55e" opacity=".9" /></g>
      ))}
      {/* ground + river */}
      <rect x="0" y={base} width="580" height="14" fill="#e2e8f0" />
      <path d="M0 378 Q150 360 300 380 T580 372 V400 H0Z" fill="url(#water)" />
      {/* pins */}
      {[[326, 18, 1], [213, 150, 0.8], [112, 255, 0.75], [440, 95, 0.85], [188, 305, 0.7]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 0c-13 0-22 10-22 22 0 17 22 38 22 38s22-21 22-38c0-12-9-22-22-22z" fill="#fff" stroke="#bfdbfe" strokeWidth="2" />
          <circle cx="0" cy="22" r="9" fill="#0b8a85" />
        </g>
      ))}
    </svg>
  );
}
