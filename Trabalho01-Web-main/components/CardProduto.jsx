"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import IconeCoracao from "./IconeCoracao";
import BotaoAdicionarCarrinho from "./BotaoAdicionarCarrinho";
import { useUsuario } from "../contexto/UsuarioContext";
import { useListaDesejos } from "../contexto/ListaDesejosContext";
import { precoFinal, temPromocao, porcentagemDesconto } from "../dados/precos";

// Card de um produto. Recebe o produto por props e é reaproveitado
// na home, na lista de produtos e na lista de desejos.
function CardProduto({ produto }) {
  const { usuario, carregou } = useUsuario();
  const listaDesejos = useListaDesejos();
  const router = useRouter();

  const favorito = listaDesejos.estaNaLista(produto.id);
  const promocao = temPromocao(produto);

  function clicarCoracao() {
    // a sessão ainda está sendo conferida no servidor: espera,
    // senão quem está logado seria mandado para o login por engano
    if (!carregou) {
      return;
    }

    // quem não está logado é mandado pra tela de login
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

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col relative">
      {/* o selo só aparece se o produto tiver preço promocional */}
      {promocao && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
          -{porcentagemDesconto(produto)}%
        </span>
      )}

      <button
        onClick={clicarCoracao}
        title={favorito ? "Tirar da lista de desejos" : "Colocar na lista de desejos"}
        aria-label={favorito ? "Tirar da lista de desejos" : "Colocar na lista de desejos"}
        className={
          favorito
            ? "absolute top-2 right-2 text-red-600"
            : "absolute top-2 right-2 text-gray-400 hover:text-red-600"
        }
      >
        <IconeCoracao cheio={favorito} />
      </button>

      <Link href={`/produtos/${produto.id}`}>
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="h-40 w-full object-contain mt-6 bg-white rounded"
        />
      </Link>

      <Link href={`/produtos/${produto.id}`} className="mt-3 flex-1">
        <h3 className="text-sm font-bold hover:text-blue-700 line-clamp-2">
          {produto.nome}
        </h3>
      </Link>

      {/* se tem promoção, mostra o preço antigo riscado em cima do novo */}
      {promocao && (
        <p className="text-gray-400 text-sm line-through mt-2">
          R$ {produto.preco.toFixed(2)}
        </p>
      )}

      <p
        className={
          promocao
            ? "text-green-700 text-xl font-bold"
            : "text-green-700 text-xl font-bold mt-2"
        }
      >
        R$ {precoFinal(produto).toFixed(2)}
      </p>

      {/* Na lista de desejos pode aparecer um produto que o admin
          desativou depois: o botão mostra "Indisponível" e fica travado */}
      <BotaoAdicionarCarrinho produto={produto} className="mt-3 py-2" />
    </div>
  );
}

export default CardProduto;
