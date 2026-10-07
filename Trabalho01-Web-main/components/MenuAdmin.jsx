"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// As seções do painel. Deixei num array pra não repetir
// o mesmo <Link> nove vezes.
const secoes = [
  { endereco: "/admin", nome: "Dashboard" },
  { endereco: "/admin/produtos", nome: "Produtos" },
  { endereco: "/admin/categorias", nome: "Categorias" },
  { endereco: "/admin/pedidos", nome: "Pedidos" },
  { endereco: "/admin/avaliacoes", nome: "Avaliações" },
  { endereco: "/admin/promocoes", nome: "Promoções" },
  { endereco: "/admin/relatorios", nome: "Relatórios" },
];

function MenuAdmin() {
  // o usePathname diz qual é o endereço da página aberta agora,
  // assim dá pra deixar o item do menu marcado
  const caminhoAtual = usePathname();

  return (
    <aside className="w-full md:w-56 bg-gray-900 text-gray-300 md:min-h-screen shrink-0">
      <div className="p-4">
        <Link href="/admin" className="text-xl font-bold text-white">
          Painel <span className="text-orange-400">Admin</span>
        </Link>
      </div>

      <nav className="flex flex-row flex-wrap md:flex-col gap-1 p-2">
        {secoes.map((secao) => (
          <Link
            key={secao.endereco}
            href={secao.endereco}
            className={
              caminhoAtual === secao.endereco
                ? "px-3 py-2 rounded bg-blue-700 text-white font-bold"
                : "px-3 py-2 rounded hover:bg-gray-800"
            }
          >
            {secao.nome}
          </Link>
        ))}
      </nav>

      <div className="p-2 mt-4 border-t border-gray-700">
        <Link
          href="/"
          className="block px-3 py-2 rounded hover:bg-gray-800 text-sm"
        >
          Voltar para a loja
        </Link>
      </div>
    </aside>
  );
}

export default MenuAdmin;
