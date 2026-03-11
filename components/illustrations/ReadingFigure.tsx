export function ReadingFigure({
  className = ""
}: { className?: string }) {
  return (
    <svg
      width="240"
      height="280"
      viewBox="0 0 240 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g style={{
        animation: "float 5s ease-in-out infinite",
        transformOrigin: "120px 140px",
      }}>
        <ellipse cx="120" cy="72" rx="28" ry="30"
          stroke="rgba(240,236,228,0.22)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.03)"
          style={{ transform: "rotate(8deg)", 
          transformOrigin: "120px 72px" }} />
        <path d="M95 62 Q102 46 120 44 Q138 46 145 62"
          stroke="rgba(240,236,228,0.18)" strokeWidth="2"
          strokeLinecap="round" fill="none" />
        <path d="M108 74 Q112 78 116 74"
          stroke="rgba(240,236,228,0.4)" strokeWidth="1.75"
          strokeLinecap="round" />
        <path d="M124 74 Q128 78 132 74"
          stroke="rgba(240,236,228,0.4)" strokeWidth="1.75"
          strokeLinecap="round" />
        <path d="M113 84 Q120 89 127 84"
          stroke="rgba(240,236,228,0.3)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
        <path d="M113 100 L113 112 M127 100 L127 112"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M88 112 Q82 140 84 185 L156 185 
          Q158 140 152 112 Q136 120 120 118 
          Q104 120 88 112Z"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.75"
          fill="rgba(240,236,228,0.02)" strokeLinejoin="round" />
        <path d="M88 130 Q72 145 68 158 L104 170 
          Q108 155 96 140 Q92 134 88 130"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M152 130 Q168 145 172 158 L136 170 
          Q132 155 144 140 Q148 134 152 130"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M68 158 Q68 178 72 182 L120 175 
          L168 182 Q172 178 172 158 L120 165 Z"
          stroke="rgba(240,236,228,0.25)" strokeWidth="1.5"
          fill="rgba(240,236,228,0.04)" strokeLinejoin="round" />
        <line x1="120" y1="165" x2="120" y2="178"
          stroke="rgba(240,236,228,0.2)" strokeWidth="1.25" />
        <line x1="82" y1="168" x2="112" y2="166"
          stroke="#10b981" strokeWidth="1" opacity="0.5" />
        <line x1="82" y1="172" x2="108" y2="170"
          stroke="#10b981" strokeWidth="1" opacity="0.35" />
        <line x1="82" y1="176" x2="114" y2="174"
          stroke="#10b981" strokeWidth="1" opacity="0.25" />
        <line x1="128" y1="168" x2="158" y2="166"
          stroke="rgba(240,236,228,0.15)" strokeWidth="1" />
        <line x1="128" y1="172" x2="154" y2="170"
          stroke="rgba(240,236,228,0.12)" strokeWidth="1" />
        <line x1="128" y1="176" x2="156" y2="174"
          stroke="rgba(240,236,228,0.1)" strokeWidth="1" />
        <path d="M84 185 Q78 205 72 220 Q90 226 
          100 215 Q108 205 104 190"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
        <path d="M156 185 Q162 205 168 220 Q150 226 
          140 215 Q132 205 136 190"
          stroke="rgba(240,236,228,0.18)" strokeWidth="1.75"
          strokeLinecap="round" fill="none" />
      </g>

      <text x="36" y="100"
        fontFamily="DM Sans, sans-serif" fontSize="11"
        fill="rgba(16,185,129,0.35)"
        style={{ animation: "driftUp 6s ease-in-out infinite" }}
      >hola</text>
      <text x="188" y="130"
        fontFamily="DM Sans, sans-serif" fontSize="10"
        fill="rgba(240,236,228,0.12)"
        style={{ animation: "driftUp 8s ease-in-out infinite 2s" }}
      >libro</text>
      <text x="24" y="160"
        fontFamily="DM Sans, sans-serif" fontSize="9"
        fill="rgba(16,185,129,0.2)"
        style={{ animation: "driftUp 7s ease-in-out infinite 1s" }}
      >leer</text>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes driftUp {
          0%, 100% { transform: translateY(0px); opacity: 0.8; }
          50% { transform: translateY(-12px); opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}
