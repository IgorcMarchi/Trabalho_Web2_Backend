// Mostra as avaliações. Recebe a lista por props, então serve
// tanto pras avaliações de um produto quanto pras do site.

// transforma a nota em estrelinhas, ex: 4 vira ★★★★☆
function estrelas(nota) {
  return "★".repeat(nota) + "☆".repeat(5 - nota);
}

function ListaFeedbacks({ lista }) {
  if (lista.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        Ainda não tem nenhuma avaliação. Seja o primeiro!
      </p>
    );
  }

  // calcula a média das notas
  const soma = lista.reduce((total, f) => total + f.nota, 0);
  const media = soma / lista.length;

  return (
    <div>
      <p className="mb-4">
        <span className="text-orange-500 text-xl">
          {estrelas(Math.round(media))}
        </span>{" "}
        <span className="font-bold">{media.toFixed(1)}</span>{" "}
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          ({lista.length} {lista.length === 1 ? "avaliação" : "avaliações"})
        </span>
      </p>

      <div className="flex flex-col gap-3">
        {lista.map((feedback, indice) => (
          <div
            key={indice}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{feedback.nome}</span>
              <span className="text-orange-500">{estrelas(feedback.nota)}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{feedback.comentario}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListaFeedbacks;
