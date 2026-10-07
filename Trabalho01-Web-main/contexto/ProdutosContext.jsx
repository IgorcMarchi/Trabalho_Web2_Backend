"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Guarda os produtos da loja.
// Na primeira vez que o site abre, a gente busca os produtos na API.
// Depois disso eles ficam salvos no localStorage, porque o administrador
// precisa poder criar, editar e excluir, e a API é só de leitura.
const ProdutosContext = createContext();

// descontos que a loja já começa tendo, só pra não nascer sem promoção
const promocoesIniciais = {
  1: 20,
  3: 15,
  5: 30,
  8: 10,
  12: 25,
  16: 40,
  18: 15,
};

// a API devolve as categorias em inglês, então já traduzimos
// na hora de converter. Assim o resto do sistema é todo em português.
const nomesDasCategorias = {
  "electronics": "Eletrônicos",
  "jewelery": "Joias",
  "men's clothing": "Roupas masculinas",
  "women's clothing": "Roupas femininas",
};

function hoje() {
  return new Date().toLocaleDateString("pt-BR");
}

// a API devolve os campos em inglês (title, price...), então aqui
// traduzimos pro formato que o nosso sistema usa
function converterDaApi(produtoDaApi) {
  const desconto = promocoesIniciais[produtoDaApi.id] || 0;

  return {
    id: produtoDaApi.id,
    nome: produtoDaApi.title,
    descricao: produtoDaApi.description,
    preco: produtoDaApi.price,
    precoPromocional:
      desconto > 0
        ? produtoDaApi.price - (produtoDaApi.price * desconto) / 100
        : null,
    imagem: produtoDaApi.image,
    categoria:
      nomesDasCategorias[produtoDaApi.category] || produtoDaApi.category,
    status: "ATIVO",
    dataCadastro: hoje(),
  };
}

export function ProdutosProvider({ children }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // só vira true quando temos dados bons. Serve pra não salvar
  // uma lista vazia por cima dos produtos quando a API dá erro.
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("produtos");

    // se já tem produtos salvos, usa eles e nem chama a API
    if (salvo) {
      setProdutos(JSON.parse(salvo));
      setCarregando(false);
      setPronto(true);
      return;
    }

    // primeira vez no site: busca na API
    async function buscarNaApi() {
      try {
        const resposta = await fetch("https://fakestoreapi.com/products");

        if (!resposta.ok) {
          throw new Error("A API respondeu com erro " + resposta.status);
        }

        const dados = await resposta.json();
        setProdutos(dados.map(converterDaApi));
        setPronto(true);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }

    buscarNaApi();
  }, []);

  // salva no localStorage toda vez que a lista muda
  useEffect(() => {
    if (pronto) {
      localStorage.setItem("produtos", JSON.stringify(produtos));
    }
  }, [produtos, pronto]);

  // a loja só mostra os produtos ativos. Os inativos continuam
  // aparecendo no painel do administrador.
  const produtosAtivos = produtos.filter((p) => p.status === "ATIVO");

  // o id vem como texto quando é da URL, por isso o Number()
  function pegarProduto(id) {
    return produtos.find((p) => p.id === Number(id));
  }

  function adicionarProduto(dados) {
    // o id novo é o maior que já existe mais um
    const maiorId = produtos.length > 0
      ? Math.max(...produtos.map((p) => p.id))
      : 0;

    setProdutos([
      ...produtos,
      { ...dados, id: maiorId + 1, dataCadastro: hoje() },
    ]);
  }

  function editarProduto(id, dados) {
    setProdutos(
      produtos.map((p) => (p.id === Number(id) ? { ...p, ...dados } : p))
    );
  }

  function excluirProduto(id) {
    setProdutos(produtos.filter((p) => p.id !== Number(id)));
  }

  // quando o administrador renomeia uma categoria, os produtos
  // daquela categoria precisam acompanhar o nome novo
  function trocarCategoria(nomeAntigo, nomeNovo) {
    setProdutos(
      produtos.map((p) =>
        p.categoria === nomeAntigo ? { ...p, categoria: nomeNovo } : p
      )
    );
  }

  // usada pelo módulo de promoções pra colocar ou tirar o preço
  // promocional de vários produtos de uma vez
  function definirPrecoPromocional(ids, calcular) {
    setProdutos(
      produtos.map((p) =>
        ids.includes(p.id) ? { ...p, precoPromocional: calcular(p) } : p
      )
    );
  }

  function alternarStatus(id) {
    setProdutos(
      produtos.map((p) =>
        p.id === Number(id)
          ? { ...p, status: p.status === "ATIVO" ? "INATIVO" : "ATIVO" }
          : p
      )
    );
  }

  return (
    <ProdutosContext.Provider
      value={{
        produtos,
        produtosAtivos,
        carregando,
        erro,
        pegarProduto,
        adicionarProduto,
        editarProduto,
        excluirProduto,
        alternarStatus,
        trocarCategoria,
        definirPrecoPromocional,
      }}
    >
      {children}
    </ProdutosContext.Provider>
  );
}

export function useProdutos() {
  return useContext(ProdutosContext);
}
