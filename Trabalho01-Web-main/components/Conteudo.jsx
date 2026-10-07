"use client";

import { usePathname } from "next/navigation";

// Segura o conteúdo das páginas.
// Na loja, limita a largura e centraliza. No painel do administrador
// deixa usar a tela toda, porque lá tem o menu lateral.
function Conteudo({ children }) {
  const caminho = usePathname();

  if (caminho.startsWith("/admin")) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">{children}</main>
  );
}

export default Conteudo;
