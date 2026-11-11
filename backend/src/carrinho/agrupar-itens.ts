interface ItemQuantidade {
  produtoId: number;
  quantidade: number;
}

// Se o mesmo produto vier duas vezes, soma as quantidades numa linha só
export function agruparItens<T extends ItemQuantidade>(
  itens: T[],
): ItemQuantidade[] {
  const porProduto = new Map<number, number>();

  for (const item of itens) {
    porProduto.set(
      item.produtoId,
      (porProduto.get(item.produtoId) ?? 0) + item.quantidade,
    );
  }

  return [...porProduto.entries()].map(([produtoId, quantidade]) => ({
    produtoId,
    quantidade,
  }));
}
