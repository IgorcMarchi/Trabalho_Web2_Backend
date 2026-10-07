// Desenho do coração em SVG, igual fizemos com o carrinho.
// A prop "cheio" diz se ele é pintado por dentro (produto já está
// na lista de desejos) ou se é só o contorno.
function IconeCoracao({ cheio }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export default IconeCoracao;
