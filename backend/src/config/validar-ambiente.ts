// Confere o .env quando a API sobe. Melhor falhar na hora, com uma
// mensagem clara, do que descobrir no primeiro login que falta o segredo.
export function validarAmbiente(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const segredo = config.JWT_SECRET;

  if (typeof segredo !== 'string' || segredo.length < 32) {
    throw new Error(
      'JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). ' +
        'Copie o .env.example para .env e gere um segredo com: ' +
        `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`,
    );
  }

  // Só o número ("3600") o JWT lê como MILISSEGUNDOS: o token venceria em
  // 3,6 segundos e ninguém conseguiria usar o site. Exigimos a unidade.
  const validade = config.JWT_EXPIRES_IN;
  if (typeof validade === 'string' && /^\d+$/.test(validade.trim())) {
    throw new Error(
      'JWT_EXPIRES_IN precisa da unidade (ex.: 1h, 30m ou 3600s). ' +
        'Só o número é lido como milissegundos.',
    );
  }

  const porta = Number(config.PORT ?? 3001);
  if (!Number.isInteger(porta) || porta <= 0) {
    throw new Error('PORT precisa ser um número inteiro positivo.');
  }

  return { ...config, PORT: porta };
}
