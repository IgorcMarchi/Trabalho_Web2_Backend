// Campo de busca. Recebe o texto e a função de mudar por props,
// por isso dá pra usar a mesma barra na home e na página de produtos.
function BarraBusca({ valor, aoMudar }) {
  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      placeholder="Buscar produto..."
      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800"
    />
  );
}

export default BarraBusca;
