import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiNoContentResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginaMetaDto } from '../dto/paginacao.dto';
import { RespostaErroDto } from '../dto/resposta-erro.dto';

// Decorators só de documentação (Swagger). Eles descrevem no OpenAPI o
// mesmo envelope que o RespostaInterceptor e o TodosErrosFilter montam,
// para a documentação mostrar exatamente o que a API devolve.

interface ErroDocumentado {
  status: number;
  mensagem?: string;
  descricao?: string;
  codigo?: string;
}

const ERROS_PADRAO: Record<number, { descricao: string; mensagem: string }> = {
  400: {
    descricao: 'Dados inválidos (corpo, parâmetro ou query fora do formato)',
    mensagem: 'Dados inválidos.',
  },
  401: {
    descricao: 'Token ausente, inválido ou expirado',
    mensagem:
      'Token de acesso ausente. Faça login e envie o cabeçalho Authorization: Bearer <token>.',
  },
  403: {
    descricao: 'Autenticado, mas sem permissão para esta operação',
    mensagem: 'Acesso permitido apenas para: ADMIN.',
  },
  404: {
    descricao: 'Registro inexistente',
    mensagem: 'Registro não encontrado.',
  },
  409: {
    descricao: 'Conflito com o estado atual do recurso',
    mensagem: 'Registro duplicado.',
  },
  422: {
    descricao: 'Regra de negócio violada',
    mensagem: 'Regra de negócio violada.',
  },
  500: {
    descricao: 'Falha inesperada no servidor (o detalhe vai só para o log)',
    mensagem: 'Erro interno do servidor.',
  },
};

// Ex.: @ApiErros(400, 404, { status: 409, mensagem: 'Este e-mail já está cadastrado.' })
export function ApiErros(...erros: (number | ErroDocumentado)[]) {
  const decorators = erros.map((erro) => {
    const opcoes = typeof erro === 'number' ? { status: erro } : erro;
    const padrao = ERROS_PADRAO[opcoes.status];
    const mensagem = opcoes.mensagem ?? padrao.mensagem;

    return ApiResponse({
      status: opcoes.status,
      description: opcoes.descricao ?? padrao.descricao,
      schema: {
        allOf: [{ $ref: getSchemaPath(RespostaErroDto) }],
        example: {
          sucesso: false,
          erro: {
            status: opcoes.status,
            mensagem,
            ...(opcoes.codigo ? { codigo: opcoes.codigo } : {}),
            ...(opcoes.status === 400
              ? { detalhes: ['campo deve seguir o formato descrito no DTO'] }
              : {}),
          },
          caminho: '/recurso',
          timestamp: '2026-11-11T12:00:00.000Z',
        },
      },
    });
  });

  return applyDecorators(ApiExtraModels(RespostaErroDto), ...decorators);
}

interface OpcoesSucesso {
  status?: number;
  descricao?: string;
  lista?: boolean;
  paginada?: boolean;
}

// Resposta de sucesso no envelope { sucesso: true, dados }
export function ApiSucesso(modelo: Type<unknown>, opcoes: OpcoesSucesso = {}) {
  const referencia = { $ref: getSchemaPath(modelo) };

  let dados: object = referencia;
  if (opcoes.paginada) {
    dados = {
      type: 'object',
      properties: {
        itens: { type: 'array', items: referencia },
        meta: { $ref: getSchemaPath(PaginaMetaDto) },
      },
    };
  } else if (opcoes.lista) {
    dados = { type: 'array', items: referencia };
  }

  return applyDecorators(
    ApiExtraModels(modelo, PaginaMetaDto),
    ApiResponse({
      status: opcoes.status ?? 200,
      description: opcoes.descricao ?? 'Operação realizada com sucesso',
      schema: {
        type: 'object',
        properties: { sucesso: { type: 'boolean', example: true }, dados },
      },
    }),
  );
}

// DELETE bem-sucedido: 204 e corpo vazio
export function ApiSemConteudo(descricao = 'Removido com sucesso (sem corpo)') {
  return ApiNoContentResponse({ description: descricao });
}
