import { premiumTheme } from '../styles/PremiumTheme';

export default function AlunoHeader({ nome }: { nome: string }) {
  return (
    <div
      style={{
        marginBottom: 25,
      }}
    >
      <h1
        style={{
          color: premiumTheme.colors.text,
          margin: 0,
          fontSize: 34,
          fontWeight: 800,
        }}
      >
        Olá, {nome} 👋
      </h1>

      <p
        style={{
          color: premiumTheme.colors.textSoft,
          marginTop: 8,
          fontSize: 16,
        }}
      >
        Foque, persista e evolua.
      </p>
    </div>
  );
}
