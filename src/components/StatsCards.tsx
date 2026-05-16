import PremiumCard from './PremiumCard';

const stats = [
  {
    titulo: 'Treinos',
    valor: '4',
    sub: 'essa semana',
  },
  {
    titulo: 'Séries',
    valor: '32',
    sub: 'concluídas',
  },
  {
    titulo: 'Tempo',
    valor: '4h 35m',
    sub: 'treinado',
  },
  {
    titulo: 'Sequência',
    valor: '12 dias',
    sub: 'sem faltar',
  },
];

export default function StatsCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit,minmax(180px,1fr))',
        gap: 16,
        marginBottom: 20,
      }}
    >
      {stats.map((item) => (
        <PremiumCard key={item.titulo}>
          <h3>{item.titulo}</h3>

          <h1
            style={{
              fontSize: 36,
              margin: '10px 0',
            }}
          >
            {item.valor}
          </h1>

          <small>{item.sub}</small>
        </PremiumCard>
      ))}
    </div>
  );
}