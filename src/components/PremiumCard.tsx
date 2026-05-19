import type { ReactNode, CSSProperties } from 'react';
import { premiumTheme } from '../styles/PremiumTheme';

type PremiumCardProps = {
  children: ReactNode;
  style?: CSSProperties;
};

export default function PremiumCard({
  children,
  style = {},
}: PremiumCardProps) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(30,41,59,0.96), rgba(15,23,42,0.98))',
        borderRadius: premiumTheme.radius.xl,
        padding: 20,
        marginBottom: 20,
        border: `1px solid ${premiumTheme.colors.border}`,
        boxShadow:
          '0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        color: premiumTheme.colors.text,
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)',
        }}
      />

      {children}
    </div>
  );
}
