"use client";

interface RateLimitWarningProps {
  operation: string;
  current: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export function RateLimitWarning({
  operation,
  current,
  limit,
  remaining,
  resetAt,
}: RateLimitWarningProps) {
  const resetTime = new Date(resetAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const operationLabel = {
    conversation: 'conversations',
    word_lookup: 'word lookups',
    story: 'stories',
    tts: 'audio plays',
    article: 'articles',
  }[operation] || operation;

  return (
    <div
      style={{
        background: 'rgba(232,82,26,0.08)',
        border: '1px solid rgba(232,82,26,0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
      }}
    >
      <span
        style={{
          fontSize: '16px',
          flexShrink: 0,
        }}
      >
        !
      </span>
      <div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-accent)',
            margin: 0,
          }}
        >
          {remaining} {operationLabel} left today
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            margin: '2px 0 0',
          }}
        >
          Resets at {resetTime}. You have used {current} of {limit} today.
        </p>
      </div>
    </div>
  );
}
