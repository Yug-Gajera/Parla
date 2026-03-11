export function SpeakingFigure({ 
  className = "" 
}: { className?: string }) {
  return (
    <svg
      width="320"
      height="360"
      viewBox="0 0 320 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g style={{
        animation: "float 4s ease-in-out infinite",
        transformOrigin: "160px 180px",
      }}>
        <ellipse cx="160" cy="80" rx="32" ry="36"
          stroke="rgba(240,236,228,0.25)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.03)" />
        <path d="M132 68 Q140 52 160 50 Q180 52 188 68"
          stroke="rgba(240,236,228,0.2)" strokeWidth="2"
          strokeLinecap="round" fill="none" />
        <path d="M134 60 Q138 48 148 46"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
        <path d="M148 78 Q152 74 156 78"
          stroke="rgba(240,236,228,0.4)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M164 78 Q168 74 172 78"
          stroke="rgba(240,236,228,0.4)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M150 92 Q160 100 170 92"
          stroke="rgba(240,236,228,0.35)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M152 114 L152 128 M168 114 L168 128"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M120 128 Q110 160 112 220 L208 220 
          Q210 160 200 128 Q180 138 160 136 
          Q140 138 120 128Z"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.03)" strokeLinejoin="round" />
        <path d="M120 145 Q95 150 78 135 Q72 128 80 122 
          Q86 118 92 124 Q98 130 112 135"
          stroke="rgba(240,236,228,0.22)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <ellipse cx="78" cy="128" rx="8" ry="10"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.5"
          fill="rgba(240,236,228,0.03)"
          transform="rotate(-20 78 128)" />
        <path d="M200 145 Q225 155 238 145 Q246 138 240 130 
          Q234 122 226 128 Q218 134 208 140"
          stroke="rgba(240,236,228,0.22)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <ellipse cx="240" cy="134" rx="8" ry="10"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.5"
          fill="rgba(240,236,228,0.03)"
          transform="rotate(15 240 134)" />
        <path d="M140 220 Q136 260 132 300"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M180 220 Q184 260 188 300"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M132 300 Q122 306 114 302 Q112 298 
          118 296 Q126 295 132 300"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
        <path d="M188 300 Q198 306 206 302 Q208 298 
          202 296 Q194 295 188 300"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
      </g>

      <g style={{
        animation: "speechPulse 2s ease-in-out infinite",
        transformOrigin: "220px 92px",
      }}>
        <path d="M210 82 Q218 88 210 96"
          stroke="#10b981" strokeWidth="1.75"
          strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M220 76 Q232 88 220 100"
          stroke="#10b981" strokeWidth="1.5"
          strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M230 70 Q246 88 230 106"
          stroke="#10b981" strokeWidth="1.25"
          strokeLinecap="round" fill="none" opacity="0.3" />
      </g>

      <circle cx="60" cy="50" r="2.5"
        fill="rgba(16,185,129,0.2)" />
      <circle cx="270" cy="280" r="2"
        fill="rgba(240,236,228,0.1)" />
      <circle cx="40" cy="240" r="1.5"
        fill="rgba(16,185,129,0.15)" />
      <circle cx="290" cy="120" r="3"
        fill="rgba(240,236,228,0.08)" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes speechPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
      `}</style>
    </svg>
  );
}
