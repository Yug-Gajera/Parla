export function TinySittingFigure() {
  return (
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
      <ellipse cx="30" cy="16" rx="10" ry="11"
        stroke="rgba(240,236,228,0.15)" strokeWidth="1.25"
        fill="rgba(240,236,228,0.02)" />
      <path d="M25 15 Q27 12 29 15"
        stroke="rgba(240,236,228,0.3)" strokeWidth="1.25"
        strokeLinecap="round" />
      <path d="M31 15 Q33 12 35 15"
        stroke="rgba(240,236,228,0.3)" strokeWidth="1.25"
        strokeLinecap="round" />
      <path d="M20 27 Q18 40 19 52 L41 52 
        Q42 40 40 27 Q35 31 30 30 Q25 31 20 27Z"
        stroke="rgba(240,236,228,0.14)" strokeWidth="1.25"
        fill="rgba(240,236,228,0.02)" strokeLinejoin="round" />
      <path d="M24 52 Q22 60 20 65"
        stroke="rgba(240,236,228,0.14)" strokeWidth="1.25"
        strokeLinecap="round" />
      <path d="M36 52 Q38 60 40 65"
        stroke="rgba(240,236,228,0.14)" strokeWidth="1.25"
        strokeLinecap="round" />
      <path d="M20 33 Q12 36 8 32"
        stroke="rgba(240,236,228,0.14)" strokeWidth="1.25"
        strokeLinecap="round" />
      <path d="M40 33 Q48 36 52 32"
        stroke="rgba(240,236,228,0.14)" strokeWidth="1.25"
        strokeLinecap="round" />
    </svg>
  );
}

export function DoodleStar({ 
  color = "rgba(16,185,129,0.3)",
  size = 32
}: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} 
      viewBox="0 0 32 32" fill="none">
      {[0, 45, 90, 135].map((angle) => (
        <line
          key={angle}
          x1="16" y1="4" x2="16" y2="28"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "16px 16px"
          }}
        />
      ))}
      <circle cx="16" cy="16" r="3"
        fill={color} opacity="0.5" />
    </svg>
  );
}

export function DoodleArrow({
  direction = "right"
}: { direction?: "right" | "down" }) {
  const rotate = direction === "down" 
    ? "rotate(90deg)" : "none";
  return (
    <svg width="48" height="24" viewBox="0 0 48 24"
      fill="none" style={{ transform: rotate }}>
      <path
        d="M2 12 Q16 8 32 12 Q24 6 30 12 Q24 18 32 12"
        stroke="rgba(16,185,129,0.35)"
        strokeWidth="1.5" strokeLinecap="round"
        fill="none" />
      <path d="M36 8 L44 12 L36 16"
        stroke="rgba(16,185,129,0.35)"
        strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function DoodleSpeechBubble({
  text = "¡Hola!"
}: { text?: string }) {
  return (
    <svg width="80" height="50" 
      viewBox="0 0 80 50" fill="none">
      <path
        d="M4 4 Q4 2 6 2 L74 2 Q76 2 76 4 
        L76 34 Q76 36 74 36 L44 36 L36 46 
        L32 36 L6 36 Q4 36 4 34 Z"
        stroke="rgba(16,185,129,0.25)"
        strokeWidth="1.5"
        fill="rgba(16,185,129,0.05)"
        strokeLinejoin="round" />
      <text x="40" y="23" textAnchor="middle"
        fontFamily="DM Sans, sans-serif"
        fontSize="11" fontWeight="500"
        fill="rgba(16,185,129,0.6)"
      >{text}</text>
    </svg>
  );
}
