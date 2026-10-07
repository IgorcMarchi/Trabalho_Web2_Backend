"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BotaoTema from "./BotaoTema";
import IconeCarrinho from "./IconeCarrinho";
import IconeCoracao from "./IconeCoracao";
import { useCarrinho } from "../contexto/CarrinhoContext";
import { useUsuario } from "../contexto/UsuarioContext";
import { useListaDesejos } from "../contexto/ListaDesejosContext";

// Menu da loja. Precisa ser "use client" porque lê o carrinho, o
// usuário logado e a lista de desejos.
function Navbar() {
  const { quantidadeTotal } = useCarrinho();
  const { usuario } = useUsuario();
  const listaDesejos = useListaDesejos();
  const caminho = usePathname();

  // o painel do administrador tem o menu lateral dele, então
  // escondemos o menu da loja quando estamos dentro do /admin
  if (caminho.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="bg-blue-700 text-white">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-2xl font-bold">
          Tec<span className="text-orange-400">Shop</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="px-3 py-2 rounded hover:bg-blue-800">
            Início
          </Link>
          <Link href="/produtos" className="px-3 py-2 rounded hover:bg-blue-800">
            Produtos
          </Link>

          {/* esse link só faz sentido pra quem está logado */}
          {usuario && (
            <Link
              href="/meus-pedidos"
              className="px-3 py-2 rounded hover:bg-blue-800"
            >
              Meus pedidos
            </Link>
          )}

          <Link href="/feedback" className="px-3 py-2 rounded hover:bg-blue-800">
            Feedback
          </Link>
          <Link href="/sobre" className="px-3 py-2 rounded hover:bg-blue-800">
            Sobre
          </Link>

          <BotaoTema />

          {/* atalho pro painel, só aparece pra quem é administrador */}
          {usuario && usuario.tipo === "ADMIN" && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded bg-gray-900 font-bold hover:bg-black"
            >
              Painel
            </Link>
          )}

          {usuario ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Olá, {usuario.nome.split(" ")[0]}</span>
              {/* o Sair leva pra tela de login, que pergunta
                  "tem certeza que deseja sair?" antes de deslogar */}
              <Link
                href="/login"
                className="px-3 py-2 rounded border border-white text-sm hover:bg-blue-800"
              >
                Sair
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 py-2 rounded hover:bg-blue-800">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="px-3 py-2 rounded border border-white hover:bg-blue-800"
              >
                Cadastrar
              </Link>
            </div>
          )}

          {/* lista de desejos, só aparece logado porque precisa de conta */}
          {usuario && (
            <Link
              href="/lista-desejos"
              title="Lista de desejos"
              className="relative bg-blue-900 hover:bg-blue-950 rounded p-2"
            >
              <IconeCoracao cheio={listaDesejos.itens.length > 0} />
              {listaDesejos.itens.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {listaDesejos.itens.length}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/carrinho"
            title="Carrinho"
            className="relative bg-orange-500 hover:bg-orange-600 rounded p-2"
          >
            <IconeCarrinho />
            {quantidadeTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {quantidadeTotal}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
