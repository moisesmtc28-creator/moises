import PremiumCard from './PremiumCard';
import { premiumTheme } from '../styles/PremiumTheme';

export default function ExerciseCard({
  exercicio,
  aberto,
  onToggle,
  children,
}: any) {
  return (
    <PremiumCard
      style={{
        background: aberto ? '#182235' : premiumTheme.colors.card,
        transition: '0.3s',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: 'white',
              fontSize: 22,
            }}
          >
            {exercicio.finalizado ? '✅ ' : '🏋️ '}
            {exercicio.nome}
          </h2>

          <small
            style={{
              color: '#94A3B8',
            }}
          >
            {exercicio.series} séries • {exercicio.repeticoes} reps
          </small>
        </div>

        <div
          style={{
            color: '#A855F7',
            fontSize: 24,
          }}
        >
          {aberto ? '−' : '+'}
        </div>
      </div>

      {aberto && (
        <div
          style={{
            marginTop: 20,
          }}
        >
          {children}
        </div>
      )}
    </PremiumCard>
  );
}
