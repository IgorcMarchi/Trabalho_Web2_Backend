// Gráfico de barras feito só com CSS, sem biblioteca nenhuma.
// A ideia é simples: a maior barra tem 100% de largura e as outras
// têm a largura proporcional a ela.
//
// props:
//   dados   -> lista de { rotulo, valor }
//   prefixo -> texto antes do número, ex: "R$ "
//   cor     -> classe de cor da barra
function GraficoBarras({ dados, prefixo, cor }) {
  if (dados.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">Ainda não há dados.</p>;
  }

  // o Math.max com 1 no final evita dividir por zero
  const maiorValor = Math.max(...dados.map((d) => d.valor), 1);

  const corDaBarra = cor || "bg-blue-700";

  return (
    <div className="flex flex-col gap-3">
      {dados.map((item) => (
        <div key={item.rotulo}>
          <div className="flex justify-between text-sm mb-1 gap-3">
            <span className="line-clamp-1">{item.rotulo}</span>
            <span className="font-bold shrink-0">
              {prefixo}
              {item.valor.toFixed(prefixo === "R$ " ? 2 : 0)}
            </span>
          </div>

          <div className="bg-gray-200 dark:bg-gray-600 rounded h-4 overflow-hidden">
            <div
              className={`h-4 rounded ${corDaBarra}`}
              style={{ width: (item.valor / maiorValor) * 100 + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default GraficoBarras;
