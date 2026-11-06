// Plano de la mesa visto desde arriba: tantas sillas como capacidad tenga.
// Si la mesa tiene foto (foto_url), se muestra la foto en su lugar.
export default function PlanoMesa({ mesa, className = '' }) {
  if (mesa.foto_url) {
    return <img className={`plano ${className}`} src={mesa.foto_url} alt={`Foto de la ${mesa.nombre}`} />;
  }
  const esTerraza = mesa.zona === 'terraza';
  const sillas = Math.min(mesa.capacidad, 12);
  const grande = sillas > 4;
  const radioX = grande ? 44 : 32;
  const radioY = 32;
  const posiciones = Array.from({ length: sillas }, (_, i) => {
    const angulo = (2 * Math.PI * i) / sillas - Math.PI / 2;
    return { x: 80 + radioX * Math.cos(angulo), y: 50 + radioY * Math.sin(angulo) };
  });
  const anchoMesa = 26 + sillas * 6;

  return (
    <svg
      className={`plano ${className}`} viewBox="0 0 160 100" role="img"
      aria-label={`Plano de la ${mesa.nombre}: ${sillas} sillas, ${esTerraza ? 'terraza' : 'salón'}`}
    >
      <rect width="160" height="100" fill={esTerraza ? '#E3EEE2' : '#F4E6D3'} />
      {esTerraza ? (
        <g fill="#C6DDC3"><circle cx="18" cy="16" r="10" /><circle cx="146" cy="86" r="12" /><circle cx="140" cy="12" r="6" /></g>
      ) : (
        <g stroke="#EAD6BC"><line x1="0" y1="33" x2="160" y2="33" /><line x1="0" y1="66" x2="160" y2="66" /><line x1="53" y1="0" x2="53" y2="100" /><line x1="106" y1="0" x2="106" y2="100" /></g>
      )}
      <g fill="#0E3A45">
        {posiciones.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="7.5" />)}
      </g>
      {grande ? (
        <>
          <rect x={80 - anchoMesa / 2} y="34" width={anchoMesa} height="32" rx="7" fill="#C98A4B" />
          <rect x={86 - anchoMesa / 2} y="40" width={anchoMesa - 12} height="20" rx="4" fill="#D9A267" />
        </>
      ) : (
        <>
          <circle cx="80" cy="50" r="21" fill="#C98A4B" />
          <circle cx="80" cy="50" r="14" fill="#D9A267" />
        </>
      )}
    </svg>
  );
}
