"use client";

import { usePathname } from "next/navigation";

// Rodapé que aparece em todas as páginas da loja
function Rodape() {
  const caminho = usePathname();

  // o painel do administrador não usa o rodapé da loja
  if (caminho.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-gray-800 text-gray-300 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm">
        <p className="font-bold text-white">TecShop</p>
        <p className="mt-1">
          Santa Helena - PR - (45) 4002-8922 - contato@tecshop.com
        </p>
        <p className="mt-2 text-xs">
          Trabalho 01 - Projeto e Desenvolvimento de Sistemas Web
        </p>
      </div>
    </footer>
  );
}

export default Rodape;
