import { Injectable } from '@nestjs/common';
import { arredondar } from '../comum/utils/valores';
import { precoFinal, subtotal } from '../produtos/precos';
import { ProdutosService } from '../produtos/produtos.service';
import { StatusProduto } from '../produtos/status-produto.enum';
import { agruparItens } from './agrupar-itens';
import {
  CarrinhoCalculadoDto,
  ItemCarrinhoCalculadoDto,
  ItemCarrinhoDto,
} from './dto/carrinho.dto';

// O carrinho continua no navegador (visitante também usa), mas quem
// diz o preço, o total e se dá para comprar é o servidor.
// Este cálculo não lança erro: ele devolve o problema de cada item para
// a tela mostrar. Quem barra de verdade é o POST /pedidos.
@Injectable()
export class CarrinhoService {
  constructor(private readonly produtosService: ProdutosService) {}

  async calcular(
    itensRecebidos: ItemCarrinhoDto[],
  ): Promise<CarrinhoCalculadoDto> {
    const itens = agruparItens(itensRecebidos);
    const produtos = await this.produtosService.buscarVarios(
      itens.map((i) => i.produtoId),
    );
    const porId = new Map(produtos.map((p) => [p.id, p]));

    const calculados: ItemCarrinhoCalculadoDto[] = itens.map(
      ({ produtoId, quantidade }) => {
        const produto = porId.get(produtoId);

        if (!produto || produto.status !== StatusProduto.ATIVO) {
          return {
            produtoId,
            nome: produto?.nome ?? null,
            imagem: produto?.imagem ?? null,
            preco: produto?.preco ?? null,
            precoPromocional: produto?.precoPromocional ?? null,
            precoUnitario: 0,
            quantidade,
            subtotal: 0,
            estoque: 0,
            disponivel: false,
            problema: 'Produto indisponível.',
          };
        }

        const temEstoque = quantidade <= produto.estoque;

        return {
          produtoId,
          nome: produto.nome,
          imagem: produto.imagem,
          preco: produto.preco,
          precoPromocional: produto.precoPromocional,
          precoUnitario: precoFinal(produto),
          quantidade,
          subtotal: subtotal(produto, quantidade),
          estoque: produto.estoque,
          disponivel: temEstoque,
          problema: temEstoque
            ? null
            : produto.estoque === 0
              ? 'Produto esgotado.'
              : `Só restam ${produto.estoque} unidade(s) em estoque.`,
        };
      },
    );

    const disponiveis = calculados.filter((item) => item.disponivel);

    return {
      itens: calculados,
      total: arredondar(
        disponiveis.reduce((soma, item) => soma + item.subtotal, 0),
      ),
      quantidadeTotal: calculados.reduce(
        (soma, item) => soma + item.quantidade,
        0,
      ),
      valido: disponiveis.length === calculados.length,
    };
  }
}
