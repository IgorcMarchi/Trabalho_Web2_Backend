// Mensagem de carregamento. Por padrão fala dos produtos (que é o caso
// mais comum), mas dá pra trocar o texto por props, como a RotaProtegida
// faz enquanto confere se a pessoa está logada.
function Carregando({ texto = "Carregando produtos..." }) {
  return (
    <p className="text-center text-gray-500 dark:text-gray-400 py-10">{texto}</p>
  );
}

export default Carregando;
