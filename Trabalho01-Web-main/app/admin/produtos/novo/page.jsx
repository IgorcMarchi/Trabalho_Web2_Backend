"use client";

import FormProduto from "../../../../components/FormProduto";
import Carregando from "../../../../components/Carregando";
import MensagemErro from "../../../../components/MensagemErro";
import { useRequisicao } from "../../../../hooks/useRequisicao";
import { criarProduto } from "../../../../lib/produtos";
import { listarCategorias } from "../../../../lib/categorias";

// Cadastro de produto (rota /admin/produtos/novo)
export default function NovoProduto() {
  // só as categorias ativas aparecem para escolher
  const { dados, erro, recarregar } = useRequisicao(
    () => listarCategorias({ ativa: true }),
    []
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Novo produto</h1>

      {erro && <MensagemErro texto={erro} aoTentarDeNovo={recarregar} />}
      {!erro && !dados && <Carregando texto="Carregando categorias..." />}
      {dados && <FormProduto categorias={dados} aoSalvar={criarProduto} />}
    </div>
  );
}
