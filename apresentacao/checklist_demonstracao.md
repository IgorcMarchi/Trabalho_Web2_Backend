# Checklist da demonstração: TecShop, Parte 2 (Back-end)

A demonstração dura de 2 a 3 minutos e entra logo depois do slide 11 ("Agora a gente mostra funcionando.").

| O quê | Endereço |
|---|---|
| Loja (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |

Os comandos abaixo são para o PowerShell e partem da raiz do repositório (a pasta que tem `backend/` e `Trabalho01-Web-main/`).

## 1. Preparação (na véspera)

- [ ] Node.js 20 ou superior instalado: `node -v`
- [ ] Dependências instaladas nos dois projetos:

  ```powershell
  cd backend
  npm install
  cd ..\Trabalho01-Web-main
  npm install
  cd ..
  ```

- [ ] Arquivos de ambiente criados a partir dos exemplos:

  ```powershell
  Copy-Item backend\.env.example backend\.env
  Copy-Item Trabalho01-Web-main\.env.example Trabalho01-Web-main\.env.local
  ```

  No Git Bash, Linux ou macOS: `cp backend/.env.example backend/.env` e `cp Trabalho01-Web-main/.env.example Trabalho01-Web-main/.env.local`.

- [ ] Segredo do JWT gerado (no mínimo 32 caracteres, senão a API não sobe):

  ```powershell
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- [ ] O **mesmo** valor colado em `JWT_SECRET=` no `backend/.env` e no `Trabalho01-Web-main/.env.local`.
- [ ] Conferido no `backend/.env`: `NODE_ENV=development` e `JWT_EXPIRES_IN=1h`. Em development o Swagger fica ligado e o seed aceita a senha de demonstração.
- [ ] Conferido no `Trabalho01-Web-main/.env.local`: `API_URL=http://localhost:3001`.
- [ ] Banco populado (pode rodar de novo sem duplicar nada):

  ```powershell
  cd backend
  npm run seed
  cd ..
  ```

  Cria `backend/dados/tecshop.sqlite` com o admin, 4 categorias, 20 produtos e algumas avaliações e feedbacks.

- [ ] Com a API e a loja rodando (seção 2), conta da cliente criada em http://localhost:3000/cadastro:
  - Nome: `Ana Souza` · E-mail: `ana@email.com` · Senha: `senha123` (mínimo de 6 caracteres)
  - Se o e-mail já existir (409), usem outro e anotem aqui: ______________________
- [ ] Testes rodados uma vez, para o plano B estar garantido:

  ```powershell
  cd backend
  npm test
  npm run test:e2e
  cd ..
  ```

  Esperado: no resumo do Jest, `26 passed, 26 total` nos unitários e `57 passed, 57 total` nos de integração.

- [ ] Sequência da seção 3 ensaiada inteira, com cronômetro.

## 2. No dia, 10 minutos antes

- [ ] **Terminal 1, API:**

  ```powershell
  cd backend
  npm run start:dev
  ```

  Esperado: `API rodando em http://localhost:3001` e `Documentação (Swagger UI) em http://localhost:3001/docs`.

- [ ] **Terminal 2, loja:**

  ```powershell
  cd Trabalho01-Web-main
  npm run dev
  ```

  Esperado: o Next mostra `Ready` e o endereço http://localhost:3000.

- [ ] Páginas "aquecidas": em modo dev o Next compila cada página no primeiro acesso. Abram uma vez a home, `/produtos`, `/carrinho`, `/checkout`, `/meus-pedidos`, `/admin`, `/admin/produtos` e `/admin/pedidos`.
- [ ] Janelas abertas (zoom do navegador entre 110% e 125% para o projetor):

  | Janela | Endereço | Conta |
  |---|---|---|
  | Normal | http://localhost:3000 | Ana (cliente), já logada |
  | Anônima (InPrivate) | http://localhost:3000/admin | `admin@tecshop.com` / `admin123`, já logado |
  | Aba extra | http://localhost:3001/docs | o Swagger usa o próprio Authorize, não o cookie |

  A janela anônima tem cookies separados: assim a cliente e o admin ficam logados ao mesmo tempo.

- [ ] Terminal da API visível (ou lado a lado com o navegador), para mostrar as linhas `[HTTP] ...` do middleware.
- [ ] Carrinho da Ana vazio.
- [ ] Nenhum `.env` aberto e nada com o segredo na tela. Notificações do sistema desligadas.

## 3. Sequência da demonstração (2 a 3 minutos)

### Passo 1: produtos vindos da API (0:00 a 0:15), janela normal

- **Fazer:** atualizar a home (F5) e abrir "Produtos".
- **Falar:** "Esses produtos vêm do SQLite, pela API. Olhem o terminal: cada chamada vira uma linha de log."
- **Esperado:** a lista de produtos e, no terminal da API, uma linha `[HTTP] GET /produtos 200 - ...ms`.

### Passo 2: pedido da cliente (0:15 a 0:55), janela normal

- **Fazer:** "Adicionar ao carrinho" em um produto, abrir o carrinho, "Finalizar compra", preencher:
  - Telefone `(45) 99999-0000` · CEP `85892-000` · Endereço `Rua das Flores, 100` · Cidade `Santa Helena` · Pagamento `PIX`
  - e clicar em "Confirmar pedido".
- **Falar:** "O front manda só o produto e a quantidade. O preço e o total quem calcula é o service, com o preço do banco, dentro de uma transação."
- **Esperado:** a tela mostra "Pedido #N realizado!" e o terminal mostra `[HTTP] POST /pedidos 201`.
- **Fazer:** abrir "Meus pedidos".
- **Esperado:** o pedido #N aparece com o status inicial, aguardando pagamento.

### Passo 3: cliente tentando abrir o painel (0:55 a 1:05), janela normal

- **Fazer:** ir para http://localhost:3000/admin.
- **Falar:** "A Ana está logada, mas o papel dela é CLIENTE. E mesmo que alguém burlasse a tela, a API responde 403; já, já a gente mostra no Swagger."
- **Esperado:** a tela "Acesso negado".

### Passo 4: admin no painel (1:05 a 1:50), janela anônima

- **Fazer:** "Produtos", digitar `Jacket` na busca.
- **Falar:** "A busca e a paginação são feitas pela API, no banco."
- **Esperado:** a lista filtra pelo nome.
- **Fazer:** "Editar" no produto que a Ana comprou, mudar o "Estoque" ou o "Preço (R$)" e "Salvar".
- **Falar:** "Isso é um PATCH: só o campo que mudou vai para a API."
- **Esperado:** o valor novo aparece no painel e, no terminal, `[HTTP] PATCH /produtos/<id> 200`.
- **Fazer:** "Pedidos", abrir o pedido #N da Ana e clicar em "Avançar para: PAGAMENTO APROVADO".
- **Falar:** "O status anda uma etapa por vez. Se tentasse pular uma etapa, a API responderia 422."
- **Esperado:** o selo muda para PAGAMENTO APROVADO. Na janela normal, F5 em "Meus pedidos" mostra o status novo.

### Passo 5: Swagger (1:50 a 2:40), aba do Swagger

- **Fazer:** mostrar rapidamente os grupos (Autenticação, Produtos, Pedidos...).
- **Fazer:** Autenticação, `POST /auth/login`, "Try it out", corpo `{ "email": "ana@email.com", "senha": "senha123" }`, "Execute".
- **Esperado:** 200 com o token em `dados.token`.
- **Fazer:** copiar só o token, clicar em "Authorize" (cadeado no topo), colar, "Authorize" e "Close". O Swagger acrescenta o `Bearer` sozinho.
- **Fazer:** Produtos, `POST /produtos`, "Try it out", "Execute" (com o exemplo que já vem preenchido).
- **Esperado:** 403 com `"mensagem": "Acesso permitido apenas para: ADMIN."`
- **Fazer:** Produtos, `GET /produtos/{id}`, "Try it out", id `999`, "Execute".
- **Esperado:** 404 com `"mensagem": "Produto 999 não encontrado."`
- **Falar:** "Todo erro volta no mesmo formato: sucesso false, status, mensagem, caminho e horário."

**Se sobrar tempo (opcionais):**

- No "Authorize", clicar em "Logout" e executar `GET /pedidos/meus`: 401 por falta de token.
- No painel, "Excluir" um produto que não vai ser usado no resto da demonstração e confirmar: ele some da loja, mas continua no banco com `excluido_em` preenchido (soft delete).

## 4. Respostas esperadas (cola rápida)

Mensagens reais da API, tiradas das respostas usadas nos slides.

| Situação | Status | Mensagem |
|---|---|---|
| Login certo | 200 | token em `dados.token` |
| Senha errada | 401 | "E-mail ou senha inválidos." |
| Rota protegida sem token | 401 | "Token de acesso ausente. Faça login e envie o cabeçalho `Authorization: Bearer <token>`." |
| Cliente em rota de ADMIN | 403 | "Acesso permitido apenas para: ADMIN." |
| Produto que não existe | 404 | "Produto 999 não encontrado." |
| Pedido de outra pessoa | 404 | "Pedido 1 não encontrado." |
| Cadastro mandando `papel` | 400 | "Dados inválidos." com "property papel should not exist" em `detalhes` |
| Produto com preço negativo | 400 | "Dados inválidos." com "preco deve ser maior que zero" em `detalhes` |
| Estoque insuficiente | 409 | "Estoque insuficiente para ..." com `"codigo": "SEM_ESTOQUE"` |
| Pular etapa do status | 422 | "Transição de status inválida: ... O próximo status é ..." |

## 5. Plano B

| Problema | O que fazer |
|---|---|
| A API não sobe com "JWT_SECRET ausente ou curto demais" | Preencher `JWT_SECRET` no `backend/.env` (seção 1) e subir de novo. |
| A API não sobe com "JWT_EXPIRES_IN precisa da unidade" | Usar `JWT_EXPIRES_IN=1h` no `backend/.env`. |
| Porta 3000 ou 3001 ocupada (`EADDRINUSE`) | Ver quem está usando: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -State Listen).OwningProcess`. Se for um `node` esquecido de um ensaio, fechar o terminal dele ou usar `Stop-Process -Id <número>`. |
| Login funciona, mas as páginas privadas voltam para o login | O `JWT_SECRET` do `.env.local` está diferente do `backend/.env`. O terminal do Next avisa: "Assinatura do token não confere". Igualar os dois e reiniciar o `npm run dev`. |
| "Sua sessão expirou" no meio da demonstração | O token dura 1 hora. Entrar de novo; no Swagger, repetir o login e o Authorize. |
| O banco ficou bagunçado depois dos ensaios | Parar a API (Ctrl+C), apagar `backend/dados/tecshop.sqlite`, rodar `npm run seed`, subir a API e recriar a conta da Ana. Isso apaga só o banco local de desenvolvimento. |
| A loja não sobe, mas a API sim | Fazer a demonstração toda pelo Swagger: login, Authorize, `GET /produtos`, `POST /pedidos` com o exemplo pronto (201), 403 e 404. |
| Nada sobe e não dá tempo de consertar | Mostrar o PDF e as capturas reais em `apresentacao/capturas/` e rodar `npm run test:e2e` dentro de `backend`. Os testes de integração sobem a API sozinhos, com um banco temporário e sem usar o `.env`. Esperado: 57 passando. |

Capturas disponíveis em `apresentacao/capturas/`:

| Arquivo | Mostra |
|---|---|
| `loja-home.png` | loja com os produtos vindos da API |
| `pedido-realizado.png` | "Pedido #1 realizado!" depois do checkout |
| `meus-pedidos.png` | histórico da cliente |
| `acesso-negado.png` | cliente tentando abrir o painel |
| `admin-dashboard.png` | painel do admin |
| `admin-produtos.png` | CRUD de produtos com busca e filtros |
| `admin-pedido.png` | detalhe do pedido com o botão de avançar o status |
| `swagger.png` | Swagger UI em /docs |

## 6. Cuidados

- Não mostrar `backend/.env`, `Trabalho01-Web-main/.env.local` nem o segredo do JWT na tela.
- Não usar `NODE_ENV=production` na demonstração: o Swagger desliga e o seed recusa a senha `admin123`.
- `admin123` é só a senha de demonstração do ambiente local.
- Se o último ensaio foi há mais de uma hora, entrar de novo nas duas janelas antes de começar (o token vence em 1 hora).
- Os arquivos `.env`, `.env.local` e o banco `.sqlite` já estão no `.gitignore`: não precisam (nem devem) ir para o Git.
