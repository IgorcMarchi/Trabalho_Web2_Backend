"use client";

import { useState } from "react";
import CardProduto from "../../components/CardProduto";
import Carregando from "../../components/Carregando";
import MensagemErro from "../../components/MensagemErro";
import BarraBusca from "../../components/BarraBusca";
import Paginacao from "../../components/Paginacao";
import { useRequisicao } from "../../hooks/useRequisicao";
import { useDebounce } from "../../hooks/useDebounce";
import { listarProdutos } from "../../lib/produtos";

// Lista de produtos (rota /produtos)
export default function Produtos() {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  // a API filtra pelo nome no banco; o debounce evita uma requisição por letra
  const buscaAtrasada = useDebounce(busca);

  const { dados, carregando, erro, recarregar } = useRequisicao(
    () => listarProdutos({ busca: buscaAtrasada, pagina, limite: 12 }),
    [buscaAtrasada, pagina]
  );

  function mudarBusca(texto) {
    setBusca(texto);
    setPagina(1);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Produtos</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Nosso catálogo completo.
      </p>

      {erro && <MensagemErro texto={erro} aoTentarDeNovo={recarregar} />}

      {!erro && !dados && <Carregando />}

      {!erro && dados && (
        <div>
          <BarraBusca valor={busca} aoMudar={mudarBusca} />

          <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 mb-4">
            {dados.meta.total} produto(s) encontrado(s)
            {carregando && " - atualizando..."}
          </p>

          {dados.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dados.itens.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          )}

          <Paginacao meta={dados.meta} aoMudar={setPagina} />
        </div>
      )}
    </div>
  );
}
