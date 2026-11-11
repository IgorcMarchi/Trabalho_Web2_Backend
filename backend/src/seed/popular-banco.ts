import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import { Avaliacao } from '../avaliacoes/avaliacao.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Papel } from '../comum/tipos/papel.enum';
import { arredondar } from '../comum/utils/valores';
import { Feedback } from '../feedback/feedback.entity';
import { Produto } from '../produtos/produto.entity';
import { StatusProduto } from '../produtos/status-produto.enum';
import { Usuario } from '../usuarios/usuario.entity';
import { RODADAS_BCRYPT } from '../usuarios/usuarios.service';
import {
  AVALIACOES_INICIAIS,
  FEEDBACKS_SITE_INICIAIS,
} from './dados/feedbacks-iniciais';
import { PRODUTOS_INICIAIS } from './dados/produtos-iniciais';

export const ESTOQUE_INICIAL = 30;
const SENHA_DE_DEMONSTRACAO = 'admin123';

export interface OpcoesSeed {
  adminNome: string;
  adminEmail?: string;
  adminSenha?: string;
  producao: boolean;
}

export interface ResumoSeed {
  admin: 'criado' | 'já existia' | 'não configurado';
  categoriasCriadas: number;
  produtosCriados: number;
  avaliacoesCriadas: number;
  feedbacksCriados: number;
}

// Popula o banco para testar a aplicação.
// Seguro para rodar várias vezes (não duplica nada):
//  - admin: só é criado se o e-mail ainda não existir;
//  - categorias: só as que ainda não existem (pelo nome);
//  - produtos, avaliações e feedbacks iniciais: só entram com a tabela vazia.
// Tudo numa transação: se algo falhar, nada fica pela metade.
export function popularBanco(
  dataSource: DataSource,
  opcoes: OpcoesSeed,
): Promise<ResumoSeed> {
  return dataSource.transaction(async (manager) => {
    const admin = await criarAdmin(manager, opcoes);
    const { categoriasPorNome, criadas } = await criarCategorias(manager);
    const { produtosPorIdOriginal, criados } = await criarProdutos(
      manager,
      categoriasPorNome,
    );

    let avaliacoesCriadas = 0;
    if ((await manager.count(Avaliacao)) === 0) {
      for (const [idOriginal, avaliacoes] of Object.entries(
        AVALIACOES_INICIAIS,
      )) {
        const produto = produtosPorIdOriginal.get(Number(idOriginal));
        if (!produto) continue;

        for (const avaliacao of avaliacoes) {
          await manager.save(
            manager.create(Avaliacao, {
              produto,
              autorNome: avaliacao.nome,
              nota: avaliacao.nota,
              comentario: avaliacao.comentario,
            }),
          );
          avaliacoesCriadas++;
        }
      }
    }

    let feedbacksCriados = 0;
    if ((await manager.count(Feedback)) === 0) {
      for (const feedback of FEEDBACKS_SITE_INICIAIS) {
        await manager.save(
          manager.create(Feedback, {
            autorNome: feedback.nome,
            nota: feedback.nota,
            comentario: feedback.comentario,
          }),
        );
        feedbacksCriados++;
      }
    }

    return {
      admin,
      categoriasCriadas: criadas,
      produtosCriados: criados,
      avaliacoesCriadas,
      feedbacksCriados,
    };
  });
}

async function criarAdmin(
  manager: EntityManager,
  opcoes: OpcoesSeed,
): Promise<ResumoSeed['admin']> {
  if (!opcoes.adminEmail || !opcoes.adminSenha) {
    return 'não configurado';
  }

  // a senha de demonstração da documentação não pode ir para produção
  if (opcoes.producao && opcoes.adminSenha === SENHA_DE_DEMONSTRACAO) {
    throw new Error(
      'Em produção, defina ADMIN_PASSWORD com uma senha forte (admin123 é só para demonstração).',
    );
  }

  const existe = await manager.findOneBy(Usuario, {
    email: opcoes.adminEmail.toLowerCase(),
  });
  if (existe) {
    return 'já existia';
  }

  // no banco vai só o hash, nunca a senha
  await manager.save(
    manager.create(Usuario, {
      nome: opcoes.adminNome,
      email: opcoes.adminEmail.toLowerCase(),
      senhaHash: await bcrypt.hash(opcoes.adminSenha, RODADAS_BCRYPT),
      papel: Papel.ADMIN,
      ativo: true,
    }),
  );
  return 'criado';
}

async function criarCategorias(manager: EntityManager) {
  const categoriasPorNome = new Map<string, Categoria>();
  let criadas = 0;

  for (const nome of new Set(PRODUTOS_INICIAIS.map((p) => p.categoria))) {
    let categoria = await manager.findOneBy(Categoria, { nome });
    if (!categoria) {
      categoria = await manager.save(
        manager.create(Categoria, { nome, ativa: true }),
      );
      criadas++;
    }
    categoriasPorNome.set(nome, categoria);
  }

  return { categoriasPorNome, criadas };
}

async function criarProdutos(
  manager: EntityManager,
  categoriasPorNome: Map<string, Categoria>,
) {
  const produtosPorIdOriginal = new Map<number, Produto>();
  // withDeleted: produto excluído pelo admin também conta como "já existe"
  const tabelaVazia =
    (await manager.count(Produto, { withDeleted: true })) === 0;
  let criados = 0;

  for (const inicial of PRODUTOS_INICIAIS) {
    let produto: Produto | null;

    if (tabelaVazia) {
      produto = await manager.save(
        manager.create(Produto, {
          nome: inicial.nome,
          descricao: inicial.descricao,
          preco: inicial.preco,
          // os mesmos descontos que o front aplicava na primeira etapa
          precoPromocional:
            inicial.descontoInicial > 0
              ? arredondar(
                  inicial.preco -
                    (inicial.preco * inicial.descontoInicial) / 100,
                )
              : null,
          imagem: inicial.imagem,
          status: StatusProduto.ATIVO,
          estoque: ESTOQUE_INICIAL,
          categoria: categoriasPorNome.get(inicial.categoria) ?? null,
        }),
      );
      criados++;
    } else {
      produto = await manager.findOne(Produto, {
        where: { nome: inicial.nome },
        withDeleted: true,
      });
    }

    if (produto) {
      produtosPorIdOriginal.set(inicial.idOriginal, produto);
    }
  }

  return { produtosPorIdOriginal, criados };
}
