import { SetMetadata } from '@nestjs/common';

export const ROTA_PUBLICA = 'rotaPublica';

// Seguro por padrão: o AuthGuard é global e barra tudo que não tiver
// token. Só as rotas marcadas com @Publico() ficam abertas.
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);
