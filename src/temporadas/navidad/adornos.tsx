import * as React from 'react';

/** Arbolito con luces parpadeantes (las animaciones están en navidad.css). */
export function ArbolitoNavidad({ style }: { style?: React.CSSProperties }): React.JSX.Element {
  return (
    <svg aria-hidden viewBox="0 0 64 80" style={{ width: 28, height: 35, flexShrink: 0, ...style }}>
      {/* Tronco */}
      <rect x="28" y="66" width="8" height="12" rx="1.5" fill="#7a4a22" />
      {/* Tres pisos */}
      <path d="M32 18 L50 42 H14 Z" fill="#1f8a43" stroke="#14612f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 32 L55 58 H9 Z" fill="#23984a" stroke="#14612f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 46 L60 72 H4 Z" fill="#27a652" stroke="#14612f" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Estrella */}
      <path
        d="M32 2 L35 10 L43 10 L36.5 15 L39 23 L32 18 L25 23 L27.5 15 L21 10 L29 10 Z"
        fill="#ffd23f"
        stroke="#d99a00"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Luces */}
      <circle className="luz-navidad luz-1" cx="28" cy="38" r="2.6" fill="#ff4d5a" />
      <circle className="luz-navidad luz-2" cx="38" cy="52" r="2.6" fill="#ffd23f" />
      <circle className="luz-navidad luz-3" cx="22" cy="62" r="2.6" fill="#4db8ff" />
      <circle className="luz-navidad luz-1" cx="42" cy="66" r="2.6" fill="#ff4d5a" />
      <circle className="luz-navidad luz-2" cx="32" cy="28" r="2.2" fill="#4db8ff" />
    </svg>
  );
}

/** Corona navideña: aro verde, bayas rojas y moño. */
export function CoronaNavidad({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}): React.JSX.Element {
  const bayas = [
    [50, 14],
    [78, 28],
    [88, 56],
    [74, 82],
    [26, 82],
    [12, 56],
    [22, 28],
  ];
  return (
    <svg aria-hidden className={className} viewBox="0 0 100 100" style={{ width: 60, height: 60, pointerEvents: 'none', ...style }}>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#14612f" strokeWidth="18" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#2aa855" strokeWidth="14" strokeDasharray="7 3" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#6fd08a" strokeWidth="4" strokeDasharray="3 9" />
      {bayas.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" fill="#e0243a" stroke="#8f1020" strokeWidth="0.8" />
      ))}
      {/* Moño */}
      <path d="M50 84 C 36 74, 30 92, 38 96 C 44 98, 48 90, 50 84 Z" fill="#e0243a" stroke="#8f1020" strokeWidth="1" />
      <path d="M50 84 C 64 74, 70 92, 62 96 C 56 98, 52 90, 50 84 Z" fill="#e0243a" stroke="#8f1020" strokeWidth="1" />
      <circle cx="50" cy="85" r="4" fill="#b01a2c" stroke="#8f1020" strokeWidth="1" />
    </svg>
  );
}
