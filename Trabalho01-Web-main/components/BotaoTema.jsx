"use client";

import { useTema } from "../contexto/TemaContext";

// Botão que troca entre o modo claro e o escuro.
// Mostra o sol quando está escuro (pra voltar pro claro) e a lua
// quando está claro. Os dois desenhos são SVG escritos aqui mesmo.
function BotaoTema() {
  const { escuro, alternarTema } = useTema();

  return (
    <button
      onClick={alternarTema}
      title={escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
      className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10"
    >
      {escuro ? (
        // sol
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // lua
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default BotaoTema;
