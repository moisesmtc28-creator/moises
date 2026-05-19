import PremiumCard from './PremiumCard';

type StatItem = {
  titulo: string;
  valor: string | number;
  sub: string;
  icon?: string;
};

type StatsCardsProps = {
  stats?: StatItem[];
};

const statsPadrao: StatItem[] = [
  { titulo: 'Treinos', valor: '4', sub: 'essa semana', icon: '🏋️' },
  { titulo: 'Séries', valor: '32', sub: 'concluídas', icon: '✅' },
  { titulo: 'Tempo', valor: '4h 35m', sub: 'treinado', icon: '⏱️' },
  { titulo: 'Sequência', valor: '12 dias', sub: 'sem faltar', icon: '🔥' },
];

export default function StatsCards({ stats = statsPadrao }: StatsCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}
    >
      {stats.map((item) => (
        <PremiumCard
          key={item.titulo}
          style={{
            minHeight: 130,
            background:
              'linear-gradient(135deg, rgba(30,41,59,0.96), rgba(15,23,42,0.96))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: '#CBD5E1', fontSize: 14, fontWeight: 600 }}>
                {item.titulo}
              </h3>

              <h1 style={{ fontSize: 32, margin: '10px 0 4px', color: '#FFFFFF', lineHeight: 1 }}>
                {item.valor}
              </h1>

              <small style={{ color: '#94A3B8' }}>{item.sub}</small>
            </div>

            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'rgba(168,85,247,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              {item.icon || '📊'}
            </div>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
