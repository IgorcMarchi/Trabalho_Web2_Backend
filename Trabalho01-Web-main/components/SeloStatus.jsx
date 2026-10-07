// Selo colorido do status do pedido. Recebe o status por props.
// Cada status tem a sua cor, pra bater o olho e entender.
// Os selos têm fundo claro e letra escura, e ficam iguais nos dois
// temas. Como o fundo é do próprio selo, continua legível no escuro.
const cores = {
  "AGUARDANDO PAGAMENTO": "bg-yellow-100 text-yellow-800",
  "PAGAMENTO APROVADO": "bg-blue-100 text-blue-800",
  "EM PREPARAÇÃO": "bg-indigo-100 text-indigo-800",
  ENVIADO: "bg-cyan-100 text-cyan-800",
  ENTREGUE: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
  PENDENTE: "bg-yellow-100 text-yellow-800",
  APROVADO: "bg-green-100 text-green-800",
};

function SeloStatus({ status }) {
  const cor = cores[status] || "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300";

  return (
    <span className={`text-xs font-bold px-2 py-1 rounded ${cor}`}>
      {status}
    </span>
  );
}

export default SeloStatus;
