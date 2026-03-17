import React from 'react';

type Variant = 'gold' | 'success' | 'warning' | 'error' | 'neutral';
type Size = 'sm' | 'md' | 'lg';

interface IconContainerProps {
  icon: React.ElementType;
  variant: Variant;
  size?: Size;
  className?: string;
  iconClassName?: string;
  strokeWidth?: number;
}

const variants: Record<Variant, { bg: string, border: string, color: string }> = {
  gold: { bg: 'rgba(232,82,26,0.15)', border: 'rgba(232,82,26,0.22)', color: '#E8521A' },
  success: { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' },
  warning: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', color: '#fb923c' },
  error: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', color: '#f87171' },
  neutral: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', color: '#9a9590' },
};

const sizes: Record<Size, { container: number, icon: number, radius: number }> = {
  sm: { container: 32, icon: 14, radius: 8 },
  md: { container: 40, icon: 18, radius: 10 },
  lg: { container: 48, icon: 22, radius: 12 },
};

export function IconContainer({ icon: Icon, variant, size = 'md', className = '', iconClassName = '', strokeWidth = 1.5 }: IconContainerProps) {
  const v = variants[variant];
  const s = sizes[size];

  return (
    <div 
      className={`flex items-center justify-center transition-all ${className}`}
      style={{
        width: `${s.container}px`,
        height: `${s.container}px`,
        borderRadius: `${s.radius}px`,
        backgroundColor: v.bg,
        border: `1px solid ${v.border}`,
      }}
    >
      <Icon 
        size={s.icon} 
        strokeWidth={strokeWidth} 
        color={v.color} 
        className={`transition-all ${iconClassName}`} 
      />
    </div>
  );
}
