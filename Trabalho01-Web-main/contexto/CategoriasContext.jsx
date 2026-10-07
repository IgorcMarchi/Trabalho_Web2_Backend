"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useProdutos } from "./ProdutosContext";

// Guarda as categorias da loja.
// Na primeira vez, monta a lista a partir das categorias que os
// produtos já têm. Depois o administrador gerencia pelo painel.
const CategoriasContext = createContext();

export function CategoriasProvider({ children }) {
  const { produtos, trocarCategoria } = useProdutos();

  const [categorias, setCategorias] = useState([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("categorias");

    if (salvo) {
      setCategorias(JSON.parse(salvo));
      setPronto(true);
    }
  }, []);

  // se ainda não existe lista salva, monta a partir dos produtos
  useEffect(() => {
    if (pronto || produtos.length === 0) {
      return;
    }

    const nomes = [...new Set(produtos.map((p) => p.categoria))];

    setCategorias(
      nomes.map((nome, indice) => ({
        id: indice + 1,
        nome: nome,
        ativa: true,
      }))
    );

    setPronto(true);
  }, [produtos, pronto]);

  useEffect(() => {
    if (pronto) {
      localStorage.setItem("categorias", JSON.stringify(categorias));
    }
  }, [categorias, pronto]);

  // a loja só mostra categoria ativa
  const categoriasAtivas = categorias.filter((c) => c.ativa);

  // quantos produtos tem em uma categoria
  function contarProdutos(nome) {
    return produtos.filter((p) => p.categoria === nome).length;
  }

  function adicionarCategoria(nome) {
    const jaExiste = categorias.find(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    );

    if (jaExiste) {
      return { ok: false, erro: "Já existe uma categoria com esse nome" };
    }

    const maiorId =
      categorias.length > 0 ? Math.max(...categorias.map((c) => c.id)) : 0;

    setCategorias([...categorias, { id: maiorId + 1, nome: nome, ativa: true }]);

    return { ok: true };
  }

  function editarCategoria(id, nomeNovo) {
    const categoria = categorias.find((c) => c.id === id);

    if (!categoria) {
      return { ok: false, erro: "Categoria não encontrada" };
    }

    const jaExiste = categorias.find(
      (c) => c.id !== id && c.nome.toLowerCase() === nomeNovo.toLowerCase()
    );

    if (jaExiste) {
      return { ok: false, erro: "Já existe uma categoria com esse nome" };
    }

    // muda o nome na categoria e também nos produtos dela
    setCategorias(
      categorias.map((c) => (c.id === id ? { ...c, nome: nomeNovo } : c))
    );
    trocarCategoria(categoria.nome, nomeNovo);

    return { ok: true };
  }

  function excluirCategoria(id) {
    const categoria = categorias.find((c) => c.id === id);

    // não deixa excluir categoria que ainda tem produto,
    // senão os produtos ficariam órfãos
    if (contarProdutos(categoria.nome) > 0) {
      return {
        ok: false,
        erro: "Essa categoria ainda tem produtos. Mova ou exclua os produtos primeiro.",
      };
    }

    setCategorias(categorias.filter((c) => c.id !== id));

    return { ok: true };
  }

  function alternarAtivaCategoria(id) {
    setCategorias(
      categorias.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c))
    );
  }

  return (
    <CategoriasContext.Provider
      value={{
        categorias,
        categoriasAtivas,
        contarProdutos,
        adicionarCategoria,
        editarCategoria,
        excluirCategoria,
        alternarAtivaCategoria,
      }}
    >
      {children}
    </CategoriasContext.Provider>
  );
}

export function useCategorias() {
  return useContext(CategoriasContext);
}
