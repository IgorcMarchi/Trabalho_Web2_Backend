"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { precoFinal } from "../dados/precos";
import { calcularCarrinho } from "../lib/carrinho";
import { useUsuario } from "./UsuarioContext";

// o mesmo limite da API (POST /carrinho/calcular e POST /pedidos)
export const MAXIMO_POR_ITEM = 99;

// Item guardado no navegador: precisa ao menos de id e quantidade válidos.
// Preço e nome não importam aqui, porque quem manda neles é o servidor.
function itemValido(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    Number.isInteger(item.id) &&
    item.id > 0 &&
    Number.isInteger(item.quantidade) &&
    item.quantidade > 0
  );
}

// Aqui fica o carrinho. Como ele precisa ser acessado em várias páginas
// (navbar, produtos, carrinho, checkout), usamos o Context pra não ter
// que ficar passando os dados de componente em componente por props.
//
// O carrinho continua no navegador (visitante também pode montar o dele),
// mas quem diz o preço e se ainda tem estoque é o servidor: toda vez que
// o conteúdo muda, perguntamos à API (POST /carrinho/calcular). E na hora
// de comprar, a API confere tudo de novo, sem confiar no navegador.
const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([]);

  // esse estado serve pra saber se já lemos o localStorage.
  // sem ele, o segundo useEffect salvaria o carrinho vazio por cima
  // do que estava guardado assim que a página abrisse.
  const [carregou, setCarregou] = useState(false);

  // situação conferida no servidor
  const [verificando, setVerificando] = useState(false);
  const [erroVerificacao, setErroVerificacao] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // lê o carrinho salvo quando a página abre.
  // tem que ser dentro do useEffect porque o localStorage só existe
  // no navegador, e o Next renderiza uma parte no servidor antes.
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");

    if (salvo) {
      // O localStorage pode ser mexido pelo F12. Se o que está lá não for
      // uma lista de itens válida, descartamos em vez de derrubar o site.
      try {
        const lido = JSON.parse(salvo);

        if (Array.isArray(lido)) {
          setItens(
            lido.filter(itemValido).map((item) => ({
              ...item,
              quantidade: Math.min(item.quantidade, MAXIMO_POR_ITEM),
            }))
          );
        } else {
          localStorage.removeItem("carrinho");
        }
      } catch {
        localStorage.removeItem("carrinho");
      }
    }

    setCarregou(true);
  }, []);

  // salva no localStorage toda vez que o carrinho muda.
  // Carrinho vazio não precisa ficar guardado, então a chave é apagada.
  useEffect(() => {
    if (carregou) {
      if (itens.length > 0) {
        localStorage.setItem("carrinho", JSON.stringify(itens));
      } else {
        localStorage.removeItem("carrinho");
      }
    }
  }, [itens, carregou]);

  // Esvazia o carrinho quando a pessoa clica em "Sair" (ajuste pedido na
  // correção da etapa 1). O "saidas" só aumenta no logout de verdade:
  // a sessão que apenas venceu (1 hora) não apaga o carrinho, então a
  // pessoa entra de novo e continua a compra de onde parou.
  const { saidas } = useUsuario();

  useEffect(() => {
    if (saidas > 0) {
      setItens([]);
    }
  }, [saidas]);

  // Só muda quando muda O QUE está no carrinho (produto ou quantidade).
  // Atualizar o preço vindo do servidor não muda a chave, então não entra
  // em loop.
  const chaveDoConteudo = itens.map((item) => `${item.id}:${item.quantidade}`).join(",");

  useEffect(() => {
    if (!carregou || itens.length === 0) {
      setErroVerificacao("");
      return;
    }

    let valeAinda = true;
    setVerificando(true);

    calcularCarrinho(itens)
      .then((resultado) => {
        if (!valeAinda) return;

        const doServidor = new Map(resultado.itens.map((i) => [i.produtoId, i]));

        // preço, estoque e disponibilidade passam a ser os do banco
        setItens((atuais) =>
          atuais.map((item) => {
            const atualizado = doServidor.get(item.id);
            if (!atualizado) return item;

            return {
              ...item,
              nome: atualizado.nome ?? item.nome,
              imagem: atualizado.imagem ?? item.imagem,
              preco: atualizado.preco ?? item.preco,
              precoPromocional: atualizado.precoPromocional,
              estoque: atualizado.estoque,
              disponivel: atualizado.disponivel,
              problema: atualizado.problema,
            };
          })
        );
        setErroVerificacao("");
      })
      .catch((e) => {
        if (valeAinda) setErroVerificacao(e.message);
      })
      .finally(() => {
        if (valeAinda) setVerificando(false);
      });

    return () => {
      valeAinda = false;
    };
  }, [chaveDoConteudo, carregou, tentativa]);

  // Devolve o que aconteceu, para o botão mostrar o aviso certo:
  // "adicionado", ou o motivo de não ter mudado nada ("estoque" ou "maximo").
  function adicionar(produto) {
    // se o produto já está no carrinho, só aumenta a quantidade
    const jaEstaNoCarrinho = itens.find((item) => item.id === produto.id);

    if (jaEstaNoCarrinho) {
      const resultado = mudarQuantidade(produto.id, jaEstaNoCarrinho.quantidade + 1);
      return resultado === "ok" ? "adicionado" : resultado;
    }

    if (produto.estoque === 0) {
      return "estoque";
    }

    // guarda só o necessário para mostrar na tela
    setItens([
      ...itens,
      {
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        categoria: produto.categoria,
        preco: produto.preco,
        precoPromocional: produto.precoPromocional,
        estoque: produto.estoque,
        quantidade: 1,
      },
    ]);
    return "adicionado";
  }

  function remover(id) {
    setItens(itens.filter((item) => item.id !== id));
  }

  function mudarQuantidade(id, novaQuantidade) {
    const item = itens.find((i) => i.id === id);

    // não deixa a quantidade ficar menor que 1, passar do estoque
    // nem passar do limite por produto que a API aceita.
    // Quando não muda, devolve o motivo (o botão de adicionar usa).
    if (!item || novaQuantidade < 1) {
      return "invalida";
    }

    if (novaQuantidade > MAXIMO_POR_ITEM) {
      return "maximo";
    }

    if (item.estoque !== undefined && novaQuantidade > item.estoque) {
      return "estoque";
    }

    setItens(itens.map((i) => (i.id === id ? { ...i, quantidade: novaQuantidade } : i)));
    return "ok";
  }

  function limpar() {
    setItens([]);
  }

  // Item esgotado ou removido da loja não entra no total.
  // Os preços já são os que vieram do servidor (precoFinal usa o promocional).
  const total = itens
    .filter((item) => item.disponivel !== false)
    .reduce((soma, item) => soma + precoFinal(item) * item.quantidade, 0);

  // quantos produtos no total (pra mostrar na navbar)
  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  // só deixa ir para o pagamento com tudo conferido e disponível
  const podeFinalizar =
    itens.length > 0 &&
    !verificando &&
    !erroVerificacao &&
    itens.every((item) => item.disponivel !== false);

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        // false enquanto o carrinho salvo ainda não foi lido do navegador
        carregou,
        adicionar,
        remover,
        mudarQuantidade,
        limpar,
        total,
        quantidadeTotal,
        verificando,
        erroVerificacao,
        podeFinalizar,
        verificarDeNovo: () => setTentativa((t) => t + 1),
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

// atalho pra usar o carrinho nas páginas sem precisar importar o useContext
export function useCarrinho() {
  return useContext(CarrinhoContext);
}
