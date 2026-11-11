"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import FormProduto from "../../../../components/FormProduto";
import Carregando from "../../../../components/Carregando";
import MensagemErro from "../../../../components/MensagemErro";
import { useRequisicao } from "../../../../hooks/useRequisicao";
import { atualizarProduto, buscarProduto } from "../../../../lib/produtos";
import { listarCategorias } from "../../../../lib/categorias";

// Edição de produto (rota /admin/produtos/[id])
export default function EditarProduto() {
  const params = useParams();

  // com token de ADMIN, a API devolve até produto inativo
  const produtoReq = useRequisicao(() => buscarProduto(params.id), [params.id]);
  const categoriasReq = useRequisicao(() => listarCategorias(), []);

  // 404 = não existe; 400 = o id da URL nem é número
  if (produtoReq.statusErro === 404 || produtoReq.statusErro === 400) {
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

  const erro = produtoReq.erro || categoriasReq.erro;
  if (erro) {
    return (
      <MensagemErro
        texto={erro}
        aoTentarDeNovo={() => {
          produtoReq.recarregar();
          categoriasReq.recarregar();
        }}
      />
    );
  }

  const produto = produtoReq.dados;
  if (!produto || !categoriasReq.dados) {
    return <Carregando texto="Carregando produto..." />;
  }

  // categorias ativas + a atual do produto (mesmo que tenha sido desativada)
  const categorias = categoriasReq.dados.filter(
    (c) => c.ativa || c.id === produto.categoriaId
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Editar produto</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        ID {produto.id} - cadastrado em {produto.dataCadastro}
      </p>

      <FormProduto
        produto={produto}
        categorias={categorias}
        aoSalvar={(dados) => atualizarProduto(produto.id, dados)}
      />
    </div>
  );
}
