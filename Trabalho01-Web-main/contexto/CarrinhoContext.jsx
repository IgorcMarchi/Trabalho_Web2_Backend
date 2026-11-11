"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { precoFinal } from "../dados/precos";
import { calcularCarrinho } from "../lib/carrinho";
import { useUsuario } from "./UsuarioContext";

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
      setItens(JSON.parse(salvo));
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

  // esvazia o carrinho quando a pessoa sai da conta.
  // O useRef guarda quem estava logado no render anterior: só limpamos
  // quando tinha alguém e agora não tem mais (logout). Assim o carrinho
  // de quem ainda não entrou na conta não é apagado quando a página abre.
  const { usuario } = useUsuario();
  const usuarioAnterior = useRef(null);

  useEffect(() => {
    if (usuarioAnterior.current && !usuario) {
      setItens([]);
    }

    usuarioAnterior.current = usuario;
  }, [usuario]);

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

  function adicionar(produto) {
    // se o produto já está no carrinho, só aumenta a quantidade
    const jaEstaNoCarrinho = itens.find((item) => item.id === produto.id);

    if (jaEstaNoCarrinho) {
      mudarQuantidade(produto.id, jaEstaNoCarrinho.quantidade + 1);
      return;
    }

    if (produto.estoque === 0) {
      return;
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
  }

  function remover(id) {
    setItens(itens.filter((item) => item.id !== id));
  }

  function mudarQuantidade(id, novaQuantidade) {
    const item = itens.find((i) => i.id === id);

    // não deixa a quantidade ficar menor que 1 nem passar do estoque
    if (!item || novaQuantidade < 1) {
      return;
    }

    if (item.estoque !== undefined && novaQuantidade > item.estoque) {
      return;
    }

    setItens(itens.map((i) => (i.id === id ? { ...i, quantidade: novaQuantidade } : i)));
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
