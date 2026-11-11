import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CategoriasService } from '../categorias/categorias.service';
import { ProdutosService } from '../produtos/produtos.service';
import { Promocao } from './promocao.entity';
import { TipoDesconto } from './promocao.enums';
import { PromocoesRepository } from './promocoes.repository';
import { PromocoesService } from './promocoes.service';

describe('PromocoesService', () => {
  let service: PromocoesService;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      providers: [
        PromocoesService,
        { provide: DataSource, useValue: {} },
        { provide: PromocoesRepository, useValue: {} },
        { provide: ProdutosService, useValue: {} },
        { provide: CategoriasService, useValue: {} },
      ],
    }).compile();
    service = modulo.get(PromocoesService);
  });

  it('calcula desconto em porcentagem e em valor fixo', () => {
    expect(
      service.calcularPreco(
        { preco: 109.95 },
        { tipo: TipoDesconto.PORCENTAGEM, valor: 20 },
      ),
    ).toBe(87.96);
    expect(
      service.calcularPreco(
        { preco: 50 },
        { tipo: TipoDesconto.VALOR, valor: 12.5 },
      ),
    ).toBe(37.5);
  });

  it('o preço nunca fica zero ou negativo', () => {
    expect(
      service.calcularPreco(
        { preco: 10 },
        { tipo: TipoDesconto.VALOR, valor: 30 },
      ),
    ).toBe(0.01);
  });

  it('só vale se estiver ativa e dentro do período', () => {
    const promocao = Object.assign(new Promocao(), {
      ativa: true,
      dataInicio: '2026-11-01',
      dataFim: '2026-11-30',
    });

    expect(service.estaValendo(promocao, '2026-11-15')).toBe(true);
    expect(service.estaValendo(promocao, '2026-11-30')).toBe(true);
    expect(service.estaValendo(promocao, '2026-12-01')).toBe(false);
    expect(
      service.estaValendo({ ...promocao, ativa: false }, '2026-11-15'),
    ).toBe(false);
  });

  it('vencida e ainda ativa conta como aplicada: o preço continua nos produtos', () => {
    const promocao = Object.assign(new Promocao(), {
      ativa: true,
      dataInicio: '2026-11-01',
      dataFim: '2026-11-30',
    });

    // venceu, mas o desconto só sai quando desativar ou excluir
    expect(service.foiAplicada(promocao, '2026-12-15')).toBe(true);
    // ainda não começou: nada foi gravado
    expect(service.foiAplicada(promocao, '2026-10-31')).toBe(false);
    expect(
      service.foiAplicada({ ...promocao, ativa: false }, '2026-11-15'),
    ).toBe(false);
  });
});
