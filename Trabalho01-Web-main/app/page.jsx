"use client";

import { useState } from "react";
import Link from "next/link";
import CardProduto from "../components/CardProduto";
import Carregando from "../components/Carregando";
import MensagemErro from "../components/MensagemErro";
import BarraBusca from "../components/BarraBusca";
import Sidebar from "../components/Sidebar";
import { useProdutos } from "../contexto/ProdutosContext";
import { useCategorias } from "../contexto/CategoriasContext";
import { temPromocao } from "../dados/precos";

// Página inicial (rota /)
export default function Home() {
  // os produtos vêm do contexto, que busca na API na primeira vez
  // e depois guarda no localStorage
  const { produtosAtivos, carregando, erro } = useProdutos();
  const { categoriasAtivas } = useCategorias();

  // guardam o que o usuário escolheu na sidebar e digitou na busca
  const [categoria, setCategoria] = useState("todas");
  const [busca, setBusca] = useState("");

  // as categorias vêm do cadastro feito no painel.
  // só entram as que o administrador deixou ativas.
  const categorias = categoriasAtivas.map((c) => c.nome);

  // produtos em promoção, pra mostrar no começo da página
  const promocoes = produtosAtivos.filter(temPromocao).slice(0, 4);

  // aplica o filtro da categoria e depois o da busca
  const produtosFiltrados = produtosAtivos
    .filter((p) => categoria === "todas" || p.categoria === categoria)
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div className="bg-blue-800 text-white rounded-lg p-10 text-center">
        <h1 className="text-4xl font-bold mb-3">Bem-vindo à TecShop</h1>
        <p className="mb-6">
          Produtos de várias categorias com preço bom e entrega para todo o
          Brasil.
        </p>
        <Link
          href="/produtos"
          className="bg-orange-500 rounded px-6 py-3 font-bold hover:bg-orange-600"
        >
          Ver todos os produtos
        </Link>
      </div>

      {carregando && <Carregando />}

      {erro && (
        <div className="mt-8">
          <MensagemErro texto={erro} />
        </div>
      )}

      {!carregando && !erro && (
        <div>
          {promocoes.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4">
                Promoções
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {promocoes.map((produto) => (
                  <CardProduto key={produto.id} produto={produto} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 mt-10">
            <Sidebar
              categorias={categorias}
              selecionada={categoria}
              aoEscolher={setCategoria}
            />

            <div className="flex-1">
              <BarraBusca valor={busca} aoMudar={setBusca} />

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 mb-4">
                {produtosFiltrados.length} produto(s) encontrado(s)
              </p>

              {produtosFiltrados.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtosFiltrados.map((produto) => (
                    <CardProduto key={produto.id} produto={produto} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
