// A API manda datas em ISO (2026-11-11T15:23:00.000Z) e dias em
// AAAA-MM-DD. Na tela a loja mostra no formato brasileiro (11/11/2026).

export function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// "2026-11-11" -> "11/11/2026" (sem passar por Date, para não mudar de dia
// por causa do fuso horário)
export function diaParaBr(dia) {
  const [ano, mes, numero] = dia.split("-");
  return `${numero}/${mes}/${ano}`;
}

// hoje no formato do <input type="date"> (2026-11-11), no fuso do navegador
export function dataDeHoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
