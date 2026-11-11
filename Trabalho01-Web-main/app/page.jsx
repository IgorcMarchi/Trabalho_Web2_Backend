"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CardProduto from "../components/CardProduto";
import Carregando from "../components/Carregando";
import MensagemErro from "../components/MensagemErro";
import BarraBusca from "../components/BarraBusca";
import Sidebar from "../components/Sidebar";
import Paginacao from "../components/Paginacao";
import { useRequisicao } from "../hooks/useRequisicao";
import { useDebounce } from "../hooks/useDebounce";
import { listarProdutos } from "../lib/produtos";
import { listarCategorias } from "../lib/categorias";

// Monta o endereço da página inicial com os filtros escolhidos.
// Exemplo: categoria "Joias" e busca "anel" viram /?categoria=Joias&busca=anel
// Filtro que está no padrão ("todas" ou busca vazia) não entra no link,
// assim a página sem filtro continua sendo só "/".
function montarEndereco(categoria, busca) {
  const parametros = new URLSearchParams();

  if (categoria !== "todas") {
    parametros.set("categoria", categoria);
  }

  if (busca !== "") {
    parametros.set("busca", busca);
  }

  const texto = parametros.toString();
  return texto ? "/?" + texto : "/";
}

// Página inicial (rota /)
export default function Home() {
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

      {/* A parte de baixo lê os filtros da URL com o useSearchParams.
          O Next exige que quem usa ele fique dentro de um Suspense,
          que mostra o "Carregando" enquanto a URL ainda não foi lida. */}
      <Suspense fallback={<Carregando />}>
        <ProdutosDoInicio />
      </Suspense>
    </div>
  );
}

// quantos produtos por página na vitrine (3 colunas x 4 linhas)
const POR_PAGINA = 12;

// Promoções, categorias, busca e a lista de produtos da página inicial
function ProdutosDoInicio() {
  // Os filtros ficam na URL (/?categoria=...&busca=...). Assim eles
  // continuam lá quando a pessoa aperta F5, e dá pra mandar o link pra
  // outra pessoa já com o filtro aplicado.
  const parametros = useSearchParams();

  // guardam o que o usuário escolheu na sidebar e digitou na busca.
  // Começam com o que veio na URL.
  const [categoria, setCategoria] = useState(
    parametros.get("categoria") || "todas"
  );
  const [busca, setBusca] = useState(parametros.get("busca") || "");
  const [pagina, setPagina] = useState(1);

  function trocarFiltros(novaCategoria, novaBusca) {
    setCategoria(novaCategoria);
    setBusca(novaBusca);
    // filtro novo começa da primeira página
    setPagina(1);

    // troca o endereço na barra do navegador sem recarregar a página.
    // O replaceState não cria uma entrada nova no histórico, então o
    // "voltar" do navegador não passa por cada letra digitada.
    window.history.replaceState(null, "", montarEndereco(novaCategoria, novaBusca));
  }

  // Quando a URL muda por fora (por exemplo, clicar em "Início" na
  // navbar leva pra "/"), o Next não recria a página, então os filtros
  // precisam ser lidos de novo. O valor vem do window.location e não do
  // "parametros" porque o useSearchParams pode chegar alguns milissegundos
  // atrasado enquanto a pessoa digita, e aí apagaria letras da busca.
  const textoDaUrl = parametros.toString();

  useEffect(() => {
    const atual = new URLSearchParams(window.location.search);
    setCategoria(atual.get("categoria") || "todas");
    setBusca(atual.get("busca") || "");
  }, [textoDaUrl]);

  // só pergunta à API depois que a pessoa para de digitar
  const buscaAtrasada = useDebounce(busca);

  // as categorias vêm do banco; só entram as que o administrador deixou ativas
  const categoriasReq = useRequisicao(() => listarCategorias({ ativa: true }), []);
  const categorias = categoriasReq.dados ?? [];

  // produtos em promoção, pra mostrar no começo da página
  const promocoesReq = useRequisicao(
    () => listarProdutos({ emPromocao: true, limite: 4 }),
    []
  );

  // A URL guarda o NOME da categoria (fica legível no link); a API filtra
  // pelo id. Se a categoria do link não existe mais (ou foi desativada),
  // volta a mostrar todas em vez de uma lista vazia sem botão marcado.
  const categoriaEscolhida = categorias.find((c) => c.nome === categoria);
  const categoriaValida = categoriaEscolhida ? categoria : "todas";
  const esperandoCategorias = categoria !== "todas" && categoriasReq.carregando;

  // busca, categoria e página são resolvidas no banco
  const produtosReq = useRequisicao(
    () =>
      esperandoCategorias
        ? Promise.resolve(null)
        : listarProdutos({
            busca: buscaAtrasada,
            categoriaId: categoriaEscolhida?.id,
            pagina,
            limite: POR_PAGINA,
          }),
    [buscaAtrasada, categoriaEscolhida?.id, pagina, esperandoCategorias]
  );

  const resultado = produtosReq.dados;
  const promocoes = promocoesReq.dados?.itens ?? [];
  const erro = produtosReq.erro || categoriasReq.erro;

  if (erro) {
    return (
      <div className="mt-8">
        <MensagemErro
          texto={erro}
          aoTentarDeNovo={() => {
            produtosReq.recarregar();
            categoriasReq.recarregar();
            promocoesReq.recarregar();
          }}
        />
      </div>
    );
  }

  // primeira carga: ainda não tem nada para mostrar
  if (!resultado) {
    return <Carregando />;
  }

  return (
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
          categorias={categorias.map((c) => c.nome)}
          selecionada={categoriaValida}
          aoEscolher={(novaCategoria) => trocarFiltros(novaCategoria, busca)}
        />

        <div className="flex-1">
          <BarraBusca
            valor={busca}
            aoMudar={(novaBusca) => trocarFiltros(categoria, novaBusca)}
          />

          <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 mb-4">
            {resultado.meta.total} produto(s) encontrado(s)
            {produtosReq.carregando && " - atualizando..."}
          </p>

          {resultado.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {resultado.itens.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          )}

          <Paginacao meta={resultado.meta} aoMudar={setPagina} />
        </div>
      </div>
    </div>
  );
}
