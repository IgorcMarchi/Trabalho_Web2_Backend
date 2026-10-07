"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import FormProduto from "../../../../components/FormProduto";
import { useProdutos } from "../../../../contexto/ProdutosContext";
import { useCategorias } from "../../../../contexto/CategoriasContext";

// Edição de produto (rota /admin/produtos/[id])
export default function EditarProduto() {
  const params = useParams();
  const { pegarProduto, editarProduto } = useProdutos();
  const { categoriasAtivas } = useCategorias();

  const produto = pegarProduto(params.id);
  const categorias = categoriasAtivas.map((c) => c.nome);

  if (!produto) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Produto não encontrado
        </h1>
        <Link href="/admin/produtos" className="text-blue-700 dark:text-blue-400 hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Editar produto</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        ID {produto.id} - cadastrado em {produto.dataCadastro}
      </p>

      <FormProduto
        produto={produto}
        categorias={categorias}
        aoSalvar={(dados) => editarProduto(produto.id, dados)}
      />
    </div>
  );
}
