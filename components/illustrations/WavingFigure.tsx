export function WavingFigure({
  className = ""
}: { className?: string }) {
  return (
    <svg
      width="200"
      height="300"
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g style={{
        animation: "breathe 3s ease-in-out infinite",
        transformOrigin: "100px 150px",
      }}>
        <ellipse cx="100" cy="72" rx="30" ry="32"
          stroke="rgba(240,236,228,0.25)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.03)" />
        <path d="M72 65 Q78 48 100 46 Q122 48 128 65"
          stroke="rgba(240,236,228,0.2)" strokeWidth="2.25"
          strokeLinecap="round" fill="none" />
        <path d="M74 58 Q72 50 78 46"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M126 58 Q128 50 122 46"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M87 70 Q92 66 97 70"
          stroke="rgba(240,236,228,0.45)" strokeWidth="2"
          strokeLinecap="round" />
        <path d="M103 70 Q108 66 113 70"
          stroke="rgba(240,236,228,0.45)" strokeWidth="2"
          strokeLinecap="round" />
        <circle cx="90" cy="69" r="1.5"
          fill="rgba(16,185,129,0.6)" />
        <circle cx="106" cy="69" r="1.5"
          fill="rgba(16,185,129,0.6)" />
        <path d="M88 84 Q100 94 112 84"
          stroke="rgba(240,236,228,0.4)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <ellipse cx="82" cy="82" rx="7" ry="5"
          fill="rgba(16,185,129,0.08)" />
        <ellipse cx="118" cy="82" rx="7" ry="5"
          fill="rgba(16,185,129,0.08)" />
        <path d="M92 102 L92 116 M108 102 L108 116"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M68 116 Q60 148 62 210 L138 210 
          Q140 148 132 116 Q116 126 100 124 
          Q84 126 68 116Z"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.02)" strokeLinejoin="round" />
        <path d="M68 130 Q52 148 50 168 Q50 176 56 178 
          Q62 180 66 172 Q68 162 76 148 
          Q74 138 68 130"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M82 210 Q78 244 76 272"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.75"
          strokeLinecap="round" />
        <path d="M118 210 Q122 244 124 272"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.75"
          strokeLinecap="round" />
        <path d="M76 272 Q64 278 60 274 Q60 269 
          66 268 Q72 268 76 272"
          stroke="rgba(240,236,228,0.16)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
        <path d="M124 272 Q136 278 140 274 Q140 269 
          134 268 Q128 268 124 272"
          stroke="rgba(240,236,228,0.16)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
      </g>

      <g style={{
        animation: "wave 1.8s ease-in-out infinite",
        transformOrigin: "132px 130px",
      }}>
        <path d="M132 130 Q152 115 164 100 Q170 92 
          166 86 Q160 80 154 86 Q150 92 148 98 
          Q144 108 136 120"
          stroke="rgba(240,236,228,0.22)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <ellipse cx="164" cy="88" rx="10" ry="12"
          stroke="rgba(240,236,228,0.22)" strokeWidth="1.5"
          fill="rgba(240,236,228,0.03)"
          transform="rotate(-30 164 88)" />
        <path d="M158 82 Q162 76 166 80"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1"
          strokeLinecap="round" />
        <path d="M163 80 Q167 74 170 78"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1"
          strokeLinecap="round" />
      </g>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.015); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(14deg); }
          75% { transform: rotate(-8deg); }
        }
      `}</style>
    </svg>
  );
}
