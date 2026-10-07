// Menu lateral com as categorias. Recebe por props a lista de
// categorias, qual está selecionada e a função pra trocar.
// Os nomes já vêm em português do cadastro de categorias.
function Sidebar({ categorias, selecionada, aoEscolher }) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="font-bold text-blue-800 dark:text-blue-300 mb-3">Categorias</h2>

        <div className="flex flex-row flex-wrap md:flex-col gap-2">
          <button
            onClick={() => aoEscolher("todas")}
            className={
              selecionada === "todas"
                ? "text-left px-3 py-2 rounded bg-blue-700 text-white font-bold"
                : "text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            Todas
          </button>

          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => aoEscolher(categoria)}
              className={
                selecionada === categoria
                  ? "text-left px-3 py-2 rounded bg-blue-700 text-white font-bold"
                  : "text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            >
              {categoria}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
