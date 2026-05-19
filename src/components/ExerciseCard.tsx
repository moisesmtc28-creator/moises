import PremiumCard from './PremiumCard';
import { premiumTheme } from '../styles/PremiumTheme';

type ExerciseCardProps = {
  exercicio: any;
  aberto: boolean;
  modo?: 'professor' | 'aluno';
  onToggle: () => void;
  children: React.ReactNode;
};

export default function ExerciseCard({
  exercicio,
  aberto,
  modo = 'aluno',
  onToggle,
  children,
}: ExerciseCardProps) {
  const isProfessor = modo === 'professor';

  return (
    <PremiumCard
      style={{
        background: aberto ? '#182235' : premiumTheme.colors.card,
        transition: '0.3s',
        cursor: 'pointer',
        border: aberto
          ? '1px solid rgba(168, 85, 247, 0.45)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              color: 'white',
              fontSize: 21,
              lineHeight: 1.25,
            }}
          >
            {isProfessor
              ? '📝 '
              : exercicio.finalizado
              ? '✅ '
              : '🏋️ '}
            {exercicio.nome || 'Exercício sem nome'}
          </h2>

          <small
            style={{
              color: '#94A3B8',
              display: 'block',
              marginTop: 6,
            }}
          >
            {exercicio.series || '0'} séries •{' '}
            {exercicio.repeticoes || '0'} reps
          </small>

          {isProfessor ? (
            <small
              style={{
                color: '#A855F7',
                display: 'block',
                marginTop: 6,
              }}
            >
              Modo professor: criação e edição do exercício
            </small>
          ) : (
            <small
              style={{
                color: exercicio.finalizado ? '#22C55E' : '#CBD5E1',
                display: 'block',
                marginTop: 6,
              }}
            >
              {exercicio.finalizado
                ? 'Exercício finalizado'
                : 'Modo aluno: execução do treino'}
            </small>
          )}
        </div>

        <div
          style={{
            minWidth: 34,
            height: 34,
            borderRadius: 12,
            background: aberto
              ? 'rgba(168,85,247,0.18)'
              : 'rgba(255,255,255,0.06)',
            color: '#A855F7',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          {aberto ? '−' : '+'}
        </div>
      </div>

      {aberto && (
        <div
          style={{
            marginTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 18,
          }}
        >
          {children}
        </div>
      )}
    </PremiumCard>
  );
}
