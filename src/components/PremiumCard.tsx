import { premiumTheme } from '../styles/PremiumTheme';

export default function PremiumCard({ children, style = {} }: any) {
  return (
    <div
      style={{
        background: premiumTheme.colors.card,
        borderRadius: premiumTheme.radius.xl,
        padding: 20,
        marginBottom: 20,
        border: `1px solid ${premiumTheme.colors.border}`,
        boxShadow: premiumTheme.shadow.purple,
        color: premiumTheme.colors.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
