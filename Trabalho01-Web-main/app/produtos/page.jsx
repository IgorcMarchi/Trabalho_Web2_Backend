"use client";

import { useState } from "react";
import CardProduto from "../../components/CardProduto";
import Carregando from "../../components/Carregando";
import MensagemErro from "../../components/MensagemErro";
import BarraBusca from "../../components/BarraBusca";
import { useProdutos } from "../../contexto/ProdutosContext";

// Lista de produtos (rota /produtos)
export default function Produtos() {
  const { produtosAtivos, carregando, erro } = useProdutos();
  const [busca, setBusca] = useState("");

  // filtra pelo que foi digitado na busca
  const produtosFiltrados = produtosAtivos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Produtos</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Nosso catálogo completo.
      </p>

      {carregando && <Carregando />}

      {erro && <MensagemErro texto={erro} />}

      {!carregando && !erro && (
        <div>
          <BarraBusca valor={busca} aoMudar={setBusca} />

          <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 mb-4">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </p>

          {produtosFiltrados.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {produtosFiltrados.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
