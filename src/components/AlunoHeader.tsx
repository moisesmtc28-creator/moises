import { premiumTheme } from '../styles/PremiumTheme';

type Props = {
  nome: string;
};

export default function AlunoHeader({ nome }: Props) {
  const hora = new Date().getHours();

  const saudacao =
    hora < 12
      ? 'Bom dia'
      : hora < 18
      ? 'Boa tarde'
      : 'Boa noite';

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 28,

        borderRadius: 28,

        background:
          'linear-gradient(135deg,#7C3AED 0%, #4F46E5 45%, #0F172A 100%)',

        position: 'relative',

        overflow: 'hidden',

        boxShadow:
          '0 20px 50px rgba(124,58,237,0.30)',

        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: -20,
          bottom: -60,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />

      <small
        style={{
          color: '#E2E8F0',
          fontSize: 15,
          display: 'block',
          marginBottom: 10,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {saudacao},
      </small>

      <h1
        style={{
          color: premiumTheme.colors.text,
          margin: 0,
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1.1,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {nome} 👋
      </h1>

      <p
        style={{
          color: '#E2E8F0',
          marginTop: 14,
          fontSize: 16,
          maxWidth: 520,
          lineHeight: 1.5,
          position: 'relative',
          zIndex: 2,
        }}
      >
        Continue evoluindo. Cada treino concluído aproxima você dos seus objetivos.
      </p>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            padding: '10px 16px',
            borderRadius: 14,
            color: 'white',
            fontSize: 14,
            backdropFilter: 'blur(8px)',
          }}
        >
          🏋️ Treine forte
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            padding: '10px 16px',
            borderRadius: 14,
            color: 'white',
            fontSize: 14,
            backdropFilter: 'blur(8px)',
          }}
        >
          🔥 Mantenha consistência
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            padding: '10px 16px',
            borderRadius: 14,
            color: 'white',
            fontSize: 14,
            backdropFilter: 'blur(8px)',
          }}
        >
          ⚡ Evolução diária
        </div>
      </div>
    </div>
  );
}
