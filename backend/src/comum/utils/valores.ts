// Dinheiro sempre com 2 casas. Evita 19.990000000000002 no total.
export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Data de hoje no fuso do servidor, no formato 2026-11-11.
// É o mesmo formato do <input type="date"> e das datas das promoções,
// então dá para comparar como texto (<= e >=).
export function hojeLocal(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
