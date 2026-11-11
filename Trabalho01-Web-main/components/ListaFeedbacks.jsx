// Mostra as avaliações. Recebe a lista por props, então serve
// tanto pras avaliações de um produto quanto pras do site.

// transforma a nota em estrelinhas, ex: 4 vira ★★★★☆
function estrelas(nota) {
  return "★".repeat(nota) + "☆".repeat(5 - nota);
}

// media e total são opcionais: quando a API já calculou (média de TODAS
// as avaliações do produto, não só das que vieram na página), usamos eles.
function ListaFeedbacks({ lista, media, total }) {
  if (lista.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        Ainda não tem nenhuma avaliação. Seja o primeiro!
      </p>
    );
  }

  // senão, calcula a média das notas da lista
  const soma = lista.reduce((acumulado, f) => acumulado + f.nota, 0);
  const mediaFinal = media ?? soma / lista.length;
  const quantidade = total ?? lista.length;

  // a API manda no máximo 50 de cada vez: com mais do que isso, a lista
  // mostra as mais recentes (e, sem a média da API, a média é só delas)
  const mostraSoParte = quantidade > lista.length;

  return (
    <div>
      <p className={mostraSoParte ? "mb-1" : "mb-4"}>
        <span className="text-orange-500 text-xl">
          {estrelas(Math.round(mediaFinal))}
        </span>{" "}
        <span className="font-bold">{mediaFinal.toFixed(1)}</span>{" "}
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          ({quantidade} {quantidade === 1 ? "avaliação" : "avaliações"})
        </span>
      </p>

      {mostraSoParte && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Mostrando as {lista.length} mais recentes
          {media === undefined && " (a média acima é dessas avaliações)"}.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {lista.map((feedback, indice) => (
          <div
            key={feedback.id ?? indice}
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
