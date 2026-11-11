import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AcessoAdmin } from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto';
import { Usuario } from './usuario.entity';
import { UsuariosService } from './usuarios.service';

// Controller fino: traduz HTTP e chama o service. Nenhuma regra aqui.
@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Listar usuários [ADMIN]',
    description:
      'Lista paginada, mais recentes primeiro. Usada no dashboard e nos relatórios (clientes cadastrados). A senha nunca aparece.',
  })
  @ApiSucesso(Usuario, { paginada: true })
  @ApiErros(400)
  listar(@Query() filtros: ListarUsuariosDto) {
    return this.usuariosService.listar(filtros);
  }

  @Patch(':id')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Ativar ou desativar uma conta [ADMIN]',
    description:
      'Conta desativada não consegue fazer login. O administrador não pode desativar a si mesmo (422).',
  })
  @ApiParam({ name: 'id', example: 2 })
  @ApiSucesso(Usuario)
  @ApiErros(400, 404, {
    status: 422,
    mensagem: 'Você não pode desativar a própria conta.',
  })
  alterarAtivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarUsuarioDto,
    @UsuarioAtual() usuario: UsuarioToken,
  ) {
    return this.usuariosService.alterarAtivo(id, dto.ativo, usuario);
  }
}
