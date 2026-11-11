"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import ListaFeedbacks from "../../../components/ListaFeedbacks";
import FormFeedback from "../../../components/FormFeedback";
import IconeCoracao from "../../../components/IconeCoracao";
import { useCarrinho } from "../../../contexto/CarrinhoContext";
import { useUsuario } from "../../../contexto/UsuarioContext";
import { useListaDesejos } from "../../../contexto/ListaDesejosContext";
import { useRequisicao } from "../../../hooks/useRequisicao";
import { buscarProduto } from "../../../lib/produtos";
import { criarAvaliacao, listarAvaliacoes } from "../../../lib/avaliacoes";
import { precoFinal, temPromocao, porcentagemDesconto } from "../../../dados/precos";

// Detalhes do produto (rota /produtos/[id])
export default function DetalheProduto() {
  // pega o id que veio na URL, ex: /produtos/3 -> params.id = "3"
  const params = useParams();
  const router = useRouter();
  const { adicionar } = useCarrinho();
  const { usuario, carregou } = useUsuario();
  const listaDesejos = useListaDesejos();

  // produto (com a média das notas) e as avaliações vêm da API
  const produtoReq = useRequisicao(() => buscarProduto(params.id), [params.id]);
  const avaliacoesReq = useRequisicao(
    () => listarAvaliacoes({ produtoId: params.id }),
    [params.id]
  );

  // esse useEffect reage a mudança: toda vez que o id da URL muda
  // ele roda de novo. O return é o cleanup, que roda quando a gente
  // sai do produto ou troca pra outro.
  useEffect(() => {
    console.log("abriu o produto " + params.id);

    return () => {
      console.log("saiu do produto " + params.id);
    };
  }, [params.id]);

  const produto = produtoReq.dados;

  // id que não existe, produto excluído ou inativo: a API responde 404
  if (produtoReq.statusErro === 404) {
    return (
      <div>
        <MensagemErro texto="Não achamos esse produto" />
        <Link
          href="/produtos"
          className="inline-block mt-4 bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Voltar para os produtos
        </Link>
      </div>
    );
  }

  if (produtoReq.erro) {
    return <MensagemErro texto={produtoReq.erro} aoTentarDeNovo={produtoReq.recarregar} />;
  }

  if (!produto) {
    return <Carregando />;
  }

  const favorito = listaDesejos.estaNaLista(produto.id);
  const promocao = temPromocao(produto);
  const esgotado = produto.estoque === 0;

  function clicarCoracao() {
    // sessão ainda sendo conferida: não manda para o login por engano
    if (!carregou) {
      return;
    }

    if (!usuario) {
      router.push("/login");
      return;
    }

    if (favorito) {
      listaDesejos.remover(produto.id);
    } else {
      listaDesejos.adicionar(produto);
    }
  }

  // a avaliação vai para a API; depois recarrega a lista e a média
  async function avaliar(feedback) {
    await criarAvaliacao(params.id, feedback);
    avaliacoesReq.recarregar();
    produtoReq.recarregar();
  }

  return (
    <div>
      <Link href="/produtos" className="text-blue-700 dark:text-blue-400 hover:underline">
        Voltar para os produtos
      </Link>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4 flex flex-wrap gap-8">
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="h-64 w-64 object-contain mx-auto bg-white rounded"
        />

        <div className="flex-1 min-w-[260px]">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">{produto.categoria}</p>
          <h1 className="text-2xl font-bold mt-1">{produto.nome}</h1>

          {promocao && (
            <div className="mt-4">
              <span className="bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded">
                -{porcentagemDesconto(produto)}% de desconto
              </span>
              <p className="text-gray-400 line-through mt-2">
                De R$ {produto.preco.toFixed(2)}
              </p>
            </div>
          )}

          <p className="text-green-700 text-3xl font-bold mt-2">
            R$ {precoFinal(produto).toFixed(2)}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {esgotado ? "Esgotado" : `${produto.estoque} unidade(s) em estoque`}
          </p>

          <p className="text-gray-600 dark:text-gray-400 mt-4">{produto.descricao}</p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => adicionar(produto)}
              disabled={esgotado}
              className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {esgotado ? "Esgotado" : "Adicionar ao carrinho"}
            </button>

            <button
              onClick={clicarCoracao}
              className={
                favorito
                  ? "flex items-center gap-2 border-2 border-red-600 text-red-600 rounded px-4 py-3 font-bold"
                  : "flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded px-4 py-3 font-bold hover:border-red-600 hover:text-red-600"
              }
            >
              <IconeCoracao cheio={favorito} />
              {favorito ? "Na lista de desejos" : "Lista de desejos"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4">Avaliações</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {avaliacoesReq.erro ? (
              <MensagemErro texto={avaliacoesReq.erro} aoTentarDeNovo={avaliacoesReq.recarregar} />
            ) : !avaliacoesReq.dados ? (
              <Carregando texto="Carregando avaliações..." />
            ) : (
              <ListaFeedbacks
                lista={avaliacoesReq.dados.itens}
                media={produto.mediaAvaliacoes}
                total={produto.totalAvaliacoes}
              />
            )}
          </div>

          <div className="w-full lg:w-96">
            <FormFeedback aoEnviar={avaliar} />
          </div>
        </div>
      </div>
    </div>
  );
}
