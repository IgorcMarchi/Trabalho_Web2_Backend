"use client";

import FormProduto from "../../../../components/FormProduto";
import { useProdutos } from "../../../../contexto/ProdutosContext";
import { useCategorias } from "../../../../contexto/CategoriasContext";

// Cadastro de produto (rota /admin/produtos/novo)
export default function NovoProduto() {
  const { adicionarProduto } = useProdutos();
  const { categoriasAtivas } = useCategorias();

  const categorias = categoriasAtivas.map((c) => c.nome);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Novo produto</h1>

      <FormProduto categorias={categorias} aoSalvar={adicionarProduto} />
    </div>
  );
}
