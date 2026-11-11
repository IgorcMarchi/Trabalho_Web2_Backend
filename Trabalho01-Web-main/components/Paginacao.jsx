// Botões de página. Recebe o "meta" que a API devolve nas listas
// ({ pagina, paginas, total }) e a função que troca de página.
// Com uma página só, não mostra nada. Mas se a página atual ficou vazia
// (ex.: o admin excluiu o único item da última página), os botões
// continuam lá, senão não haveria como voltar.
function Paginacao({ meta, aoMudar }) {
  if (!meta || (meta.paginas <= 1 && meta.pagina <= 1)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => aoMudar(meta.pagina - 1)}
        disabled={meta.pagina <= 1}
        className="border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      <span className="text-sm text-gray-600 dark:text-gray-400">
        Página {meta.pagina} de {meta.paginas}
      </span>

      <button
        onClick={() => aoMudar(meta.pagina + 1)}
        disabled={meta.pagina >= meta.paginas}
        className="border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Próxima
      </button>
    </div>
  );
}

export default Paginacao;
