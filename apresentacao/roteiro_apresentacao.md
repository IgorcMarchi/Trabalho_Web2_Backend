# Roteiro de fala: TecShop, Parte 2 (Back-end)

Projeto e Desenvolvimento de Sistemas Web · Prof. B.Sc. Wellington de Souza Ferreira

Grupo: Gustavo Galafaci Conte (2576635) · Igor Carvalho Marchi (2677229) · Jefferson korte junior (2651114)

## Como usar este roteiro

- Tempo dos slides: cerca de 11 minutos (10:30), mais 2 a 3 minutos de demonstração.
- Os tempos foram estimados num ritmo de 140 palavras por minuto. Se no ensaio os slides passarem de 12 minutos, encurtem as falas dos slides 5, 7 e 9, que são as mais longas.
- As mesmas falas estão nas anotações do PowerPoint. No Modo de Exibição do Apresentador (Alt+F5) elas aparecem só na tela de quem apresenta.
- Não precisa decorar. A fala é um guia: digam com as próprias palavras, mantendo os exemplos da TecShop.
- A abertura diz "Bom dia": troquem por "Boa tarde" ou "Boa noite" conforme o horário.
- A demonstração está detalhada em `checklist_demonstracao.md`.

## Visão geral

| Slide | Tema | Tempo | Quem fala (sugestão) |
|---|---|---|---|
| 1 | Capa | 0:40 | Gustavo |
| 2 | Contexto e problema | 0:50 | Gustavo |
| 3 | Arquitetura | 0:55 | Gustavo |
| 4 | API REST | 1:00 | Gustavo |
| 5 | Camadas | 1:05 | Igor |
| 6 | Banco de dados | 1:00 | Igor |
| 7 | Validação e erros | 1:05 | Igor |
| 8 | CRUD | 1:00 | Igor |
| 9 | Autenticação e segurança | 1:05 | Jefferson |
| 10 | Integração e Swagger | 0:50 | Jefferson |
| 11 | Resultados e conclusão | 1:00 | Jefferson |
| | **Total dos slides** | **10:30** | |
| | Demonstração | 2:00 a 3:00 | Jefferson conduz, com apoio dos outros dois |

> **Divisão sugerida, não obrigatória.** Ela só reparte os blocos por assunto (contexto e API, camadas e dados, segurança e resultados). O grupo pode trocar como preferir; as falas funcionam com qualquer um falando, porque usam "a gente".

---

## Slide 1: TecShop: Desenvolvimento do Back-end

**Tempo:** cerca de 0:40 · **Quem fala (sugestão):** Gustavo

- **Ideia principal:** Apresentar o grupo e dizer o que vai ser mostrado: o back-end da TecShop e a integração com o front.
- **Ligação com o slide anterior:** Abertura. Situa a etapa 2 como continuação direta da etapa 1.
- **Exemplo da TecShop:** A mesma loja da etapa 1 (Next.js e React), agora com API em NestJS e banco SQLite.

**Fala:**

> Bom dia, professor. A gente é o grupo da TecShop: Gustavo, Igor e Jefferson.
>
> Na primeira parte do trabalho a gente entregou a loja só no front-end, com Next.js e React. Hoje a gente vai mostrar a segunda parte: o back-end que a gente fez em NestJS, com o banco SQLite, e como o front passou a conversar com essa API.
>
> A ideia é ir mostrando o que a gente usou de cada aula (rotas, camadas, banco, CRUD, erros e segurança), sempre em cima do nosso código. No final a gente mostra funcionando.

---

## Slide 2: Da aplicação visual à persistência real

**Tempo:** cerca de 0:50 · **Quem fala (sugestão):** Gustavo

- **Ideia principal:** Na etapa 1 tudo ficava no navegador. A meta da etapa 2 é uma API própria, com banco e com as decisões tomadas no servidor.
- **Ligação com o slide anterior:** Depois de dizer o que vai ser mostrado, explica de onde o grupo partiu.
- **Exemplo da TecShop:** Senhas em texto puro no localStorage e o tipo do usuário num cookie editável pelo F12, problemas que a própria documentação da etapa 1 já apontava.

**Fala:**

> Pra lembrar de onde a gente saiu: na etapa 1 a loja já estava completa visualmente, com catálogo, carrinho, checkout e o painel do admin. Só que os produtos vinham uma vez da Fake Store API, e todo o resto ficava no localStorage: usuários, pedidos, promoções.
>
> A gente mesmo já tinha apontado os problemas na documentação da etapa 1. As senhas ficavam em texto puro no navegador, o tipo do usuário ficava num cookie que dava pra editar no F12, e se você abrisse a loja em outro computador começava tudo do zero.
>
> Então a meta desta etapa foi essa: uma API própria, que atende a loja, guarda os dados num banco de verdade e protege as operações no servidor.

---

## Slide 3: Como a TecShop passou a funcionar?

**Tempo:** cerca de 0:55 · **Quem fala (sugestão):** Gustavo

- **Ideia principal:** O caminho de uma requisição: navegador, /api do Next, esteira da API (middleware, guards, pipe), controller, service, repository e SQLite. Na volta, interceptor e filtro.
- **Ligação com o slide anterior:** O slide 2 mostrou o problema; este mostra o desenho da solução.
- **Exemplo da TecShop:** O token fica num cookie httpOnly e o Route Handler do Next envia como Bearer: o JavaScript da página nunca enxerga o token.

**Fala:**

> Esse é o desenho de como a TecShop funciona agora. O navegador não fala direto com a API: as telas chamam o /api do próprio Next. Lá, um Route Handler pega o token, que fica num cookie httpOnly, e repassa pra API como Bearer. Assim o JavaScript da página nunca enxerga o token.
>
> Dentro da API, toda requisição passa pela esteira que o senhor mostrou na aula de middlewares: o middleware registra o log, os guards conferem o token e o papel, o ValidationPipe confere o formato do DTO, e só aí chega no controller, que chama o service, que usa o repository pra falar com o SQLite pelo TypeORM.
>
> Na volta, o interceptor embrulha o sucesso e o filtro padroniza o erro. Então o controller só cuida do caso feliz.

---

## Slide 4: A comunicação entre front-end e back-end

**Tempo:** cerca de 1:00 · **Quem fala (sugestão):** Gustavo

- **Ideia principal:** Convenções REST: recurso no plural, método como verbo, dados por @Param, @Query e @Body, e o status certo em cada resposta.
- **Ligação com o slide anterior:** Depois do desenho geral, mostra a "porta de entrada": as rotas que o front chama.
- **Exemplo da TecShop:** /produtos e /produtos/:id cobrem cinco endpoints; 409 quando falta estoque; 422 quando o admin tenta pular uma etapa do status do pedido.

**Fala:**

> Agora, como o front conversa com essa API. A gente seguiu as convenções REST: o recurso no plural e o método como verbo. Em produtos, por exemplo, são só duas rotas, /produtos e /produtos/:id, e cinco endpoints. Quem diz a ação é o método.
>
> No total são 37 endpoints em 11 recursos; esse número a gente tirou do próprio documento OpenAPI da API.
>
> Os dados chegam de três jeitos: o @Param identifica o recurso, o @Query filtra e pagina a lista, e o @Body traz o JSON. No pedido, por exemplo, cada item do corpo leva só produtoId e quantidade. E cada resposta volta com o status certo: 201 quando cria, 204 quando exclui, 401 sem login, 403 sem permissão, 409 quando falta estoque, e 422 quando uma regra é quebrada, tipo pular uma etapa do status do pedido.

*Passagem (sugestão): no fim deste slide, Igor assume.*

---

## Slide 5: Controller traduz, Service decide, Repository guarda

**Tempo:** cerca de 1:05 · **Quem fala (sugestão):** Igor

- **Ideia principal:** Cada camada com um papel só. A regra de negócio mora no service; o controller só traduz o HTTP e o repository só grava e busca.
- **Ligação com o slide anterior:** O slide 4 mostrou as rotas (o controller); este mostra o que acontece atrás delas.
- **Exemplo da TecShop:** POST /pedidos: controller de uma linha, service com transação e preço do banco, repository com UPDATE condicional de estoque.

**Fala:**

> Aqui é a arquitetura: o controller traduz, o service decide, o repository guarda. O melhor exemplo é quando a cliente finaliza a compra.
>
> No checkout, o front manda os dados de entrega e, de cada item, só o produto e a quantidade. Nunca o preço. O controller tem uma linha: chama o service com o DTO e o usuário que veio do token. Quem decide é o service: ele abre uma transação, confere se cada produto existe e está ativo, baixa o estoque e calcula o total com o preço do banco. O dono do pedido vem do token, não do corpo.
>
> O repository só grava. E um detalhe que a gente achou importante: a baixa de estoque é um UPDATE com "estoque >= quantidade" na própria condição. Então duas compras ao mesmo tempo não levam a última unidade, e se faltar estoque a transação inteira volta.

---

## Slide 6: Onde ficam os dados da TecShop?

**Tempo:** cerca de 1:00 · **Quem fala (sugestão):** Igor

- **Ideia principal:** Modelo ER com 8 entidades e a tabela N:N da lista de desejos, num arquivo SQLite mapeado pelo TypeORM, com seed que pode rodar de novo sem duplicar.
- **Ligação com o slide anterior:** O repository "guarda": aqui aparece onde e como ele guarda.
- **Exemplo da TecShop:** O item do pedido guarda nome e preço da hora da compra; o produto usa soft delete (excluido_em) para não quebrar o histórico.

**Fala:**

> E onde ficam esses dados? Num arquivo SQLite, mapeado pelo TypeORM. A gente fez o que a aula pede: modelou antes de codar.
>
> São oito entidades (usuários, categorias, produtos, pedidos, itens do pedido, promoções, avaliações e feedbacks), mais a tabela da lista de desejos, que é o N:N entre usuário e produto. No 1:N a chave estrangeira fica no lado N: o produto tem categoria_id, o pedido tem usuario_id, e o item tem pedido_id e produto_id.
>
> O item do pedido guarda um retrato do nome e do preço, então o histórico não muda se o produto mudar depois. O produto usa soft delete: some da loja, mas os pedidos antigos continuam apontando pra ele. E pra começar com dados tem o seed: cria o admin, as 4 categorias e os 20 produtos, e pode rodar de novo sem duplicar.

---

## Slide 7: Como evitamos dados inválidos e erros confusos?

**Tempo:** cerca de 1:05 · **Quem fala (sugestão):** Igor

- **Ideia principal:** DTO com class-validator e ValidationPipe global na entrada; formato único para sucesso e erro; log sem corpo, senha ou token.
- **Ligação com o slide anterior:** Com os dados no banco, a pergunta passa a ser como impedir que entre dado errado.
- **Exemplo da TecShop:** POST /produtos com preço -5 volta 400 com "preco deve ser maior que zero"; falta de estoque volta 409 com o código SEM_ESTOQUE.

**Fala:**

> Com os dados no banco, a pergunta passa a ser: como impedir que entre dado errado? Todo body e toda query têm um DTO com class-validator, e o ValidationPipe global usa whitelist e forbidNonWhitelisted. Então campo que não está no DTO é recusado.
>
> Olhando as duas requisições: no GET /produtos/1, o pipe transforma o "1" em número, o service busca, e o interceptor embrulha com sucesso true. No POST com preço -5, o pipe barra antes de chegar no controller, e o filtro devolve o erro no mesmo formato, com o motivo em "detalhes".
>
> Essas linhas de log embaixo são reais, do nosso terminal; o middleware registra método, rota, status e tempo, mas nunca o corpo nem o token. Pra regra de negócio a gente criou a SemEstoqueException, que volta 409 com o código SEM_ESTOQUE. E erro inesperado vira 500 genérico, com o detalhe só no log.

---

## Slide 8: Criar, consultar, atualizar e excluir

**Tempo:** cerca de 1:00 · **Quem fala (sugestão):** Igor

- **Ideia principal:** CRUD completo de produtos: lista paginada no banco, PATCH parcial, 404 quando não existe, soft delete e transação no pedido.
- **Ligação com o slide anterior:** Junta os dois slides anteriores: validação na entrada e banco por trás.
- **Exemplo da TecShop:** Painel de produtos (captura real): busca e filtros feitos pela API com findAndCount, no máximo 50 por página.

**Fala:**

> Juntando validação e banco, chega o CRUD. O exemplo é o painel de produtos: essa captura é real, e tudo que aparece vem do banco. A busca e os filtros de categoria e status são feitos pela API, com findAndCount e no máximo 50 itens por página.
>
> Criar é POST com o DTO validado. Consultar um produto que não existe dá 404, porque o repository devolve null e o service transforma isso em 404. Atualizar é PATCH com PartialType, então só o campo que veio muda. E excluir é soft delete: o produto some da loja, mas o histórico fica.
>
> E quando várias escritas dependem uma da outra, como no pedido, tem transação: ou salva tudo, ou nada. Que é a frase da aula: validar na entrada, conferir antes de mudar e salvar tudo ou nada.

*Passagem (sugestão): no fim deste slide, Jefferson assume.*

---

## Slide 9: Quem está acessando e o que pode fazer?

**Tempo:** cerca de 1:05 · **Quem fala (sugestão):** Jefferson

- **Ideia principal:** As três perguntas: quem é você (401), o que você pode (403) e se o recurso é seu (404, conferido no service).
- **Ligação com o slide anterior:** Depois de barrar dado errado, o próximo passo é barrar acesso indevido.
- **Exemplo da TecShop:** Cliente tentando cadastrar produto leva 403; pedido de outra pessoa dá 404; cadastro mandando papel ADMIN dá 400.

**Fala:**

> Agora a parte que a gente considera a mais importante: segurança. A gente seguiu as três perguntas da aula.
>
> Quem é você? No cadastro, a senha vira hash com bcrypt, custo 10, e essa coluna nem aparece nas consultas. No login, a API compara o hash e devolve um JWT de uma hora, só com id, e-mail e papel.
>
> O que você pode? O AuthGuard é global, então toda rota exige token, menos as marcadas como públicas; sem token é 401. O PapeisGuard confere o papel: cliente tentando cadastrar produto leva 403.
>
> E este recurso é seu? Isso o guard não sabe, quem confere é o service: se uma cliente pede o pedido de outra pessoa, recebe 404, pra nem confirmar que ele existe. E ninguém vira admin no cadastro: o DTO nem tem o campo papel, então mandar papel ADMIN dá 400. Essas respostas da direita são reais, da nossa API.

---

## Slide 10: Front-end e back-end trabalhando juntos

**Tempo:** cerca de 0:50 · **Quem fala (sugestão):** Jefferson

- **Ideia principal:** O front trocou o localStorage pela API sem refazer as telas; o Swagger entra como recurso complementar, não como requisito.
- **Ligação com o slide anterior:** Com a API pronta e protegida, mostra como o front passou a usar ela.
- **Exemplo da TecShop:** lib/api.js confere res.ok, desembrulha o envelope e valida com Zod; o proxy.js agora confere a assinatura do JWT; Swagger em /docs.

**Fala:**

> Do lado do front, a gente trocou o localStorage pela API sem refazer as telas. Toda chamada passa por um cliente HTTP só, o lib/api.js, que confere o res.ok, desembrulha o envelope e valida a resposta com Zod. As chamadas vão pro /api do Next, que coloca o token. E o proxy.js, que na etapa 1 só olhava se o cookie existia, agora confere a assinatura do JWT.
>
> Como recurso a mais, a gente documentou a API no Swagger, em /docs. Dá pra ver os endpoints, os DTOs, clicar em Authorize com o token e testar cada rota no Try it out. Não era requisito, mas ajudou bastante na hora de testar.

---

## Slide 11: O que conseguimos entregar?

**Tempo:** cerca de 1:00 · **Quem fala (sugestão):** Jefferson

- **Ideia principal:** Todos os requisitos da etapa implementados (a gestão de usuários ainda não tem tela, só Swagger), com testes passando e próximos passos claros.
- **Ligação com o slide anterior:** Fecha juntando tudo e chama a demonstração.
- **Exemplo da TecShop:** 26/26 testes unitários, 57/57 de integração (com os 19 cenários da tabela de testes), build e lint sem erros.

**Fala:**

> Fechando: tudo que esta etapa pedia está implementado. API REST, camadas, SQLite com TypeORM, CRUD, validação e erros, bcrypt e JWT, guards e a integração com o front. A única coisa sem tela é a de usuários: hoje o admin desativa uma conta pelo Swagger.
>
> Pra comprovar, a gente tem 26 testes unitários dos services e 57 testes de integração, que sobem a API com um banco temporário e incluem os 19 cenários da tabela de testes. Tudo passando, e o build e o lint sem erros.
>
> Como próximos passos: refresh token, ligar as promoções automaticamente pela data, colocar helmet e limite de tentativas no login, e o upload de imagem, que hoje é só por URL.
>
> Resumindo: a TecShop saiu de dados presos no navegador pra uma API própria, com persistência e controle de acesso no servidor. Agora a gente mostra funcionando.

---

## Demonstração (2 a 3 minutos)

Logo depois do slide 11 ("Agora a gente mostra funcionando."), sigam o `checklist_demonstracao.md`. Resumo da sequência:

1. Loja aberta: os produtos vêm da API (mostrar a linha do log no terminal da API).
2. Cliente faz um pedido e vê "Pedido #N realizado!" e depois "Meus pedidos".
3. Cliente tenta abrir o painel: "Acesso negado".
4. Admin edita um produto e avança o status do pedido da cliente.
5. Swagger: login, Authorize, 403 com token de cliente e 404 de produto que não existe.

Frase para fechar: "Era isso. A TecShop agora tem uma API própria, com os dados no banco e o controle de acesso no servidor. Obrigado, professor, ficamos à disposição para perguntas."

## Perguntas que podem aparecer

### Por que SQLite e não PostgreSQL?

Porque o requisito do nosso trabalho pede SQLite. O banco fica num arquivo (`backend/dados/tecshop.sqlite`), não precisa de servidor de banco, e o TypeORM faz o mapeamento das entidades para as tabelas.

### Por que o pedido de outra pessoa dá 404 e não 403?

Para não confirmar que aquele pedido existe. O guard só sabe o papel de quem chama; quem confere o dono é o service, e ele responde como se o pedido não existisse.

### O que impede duas compras de levarem a última unidade?

A baixa de estoque é um UPDATE com `estoque >= quantidade` na própria condição. Se nenhuma linha muda, o service lança a SemEstoqueException (409) e a transação desfaz o pedido inteiro.

### E se alguém mandar o preço junto no pedido?

O DTO de cada item só tem `produtoId` e `quantidade`. Com `forbidNonWhitelisted`, um campo a mais é recusado com 400. E o total é sempre calculado com o preço do banco.

### Por que soft delete no produto?

Porque os pedidos antigos apontam para ele. O produto ganha `excluido_em` e some da loja, mas o histórico continua. O item do pedido ainda guarda o nome e o preço da hora da compra.

### Onde fica o token no navegador?

Num cookie httpOnly, que o JavaScript da página não consegue ler. O Route Handler do Next lê o cookie e manda para a API como `Authorization: Bearer`.

### E quando o token vence?

O token dura 1 hora. Depois disso a API responde 401 e o front avisa que a sessão expirou e pede para entrar de novo.

### Como a senha é guardada?

Só o hash do bcrypt, com custo 10, na coluna `senha_hash`, que tem `select: false`: ela não vem em nenhuma consulta, só o login pede explicitamente.

### O Swagger era obrigatório?

Não. Foi um recurso a mais: documenta os 37 endpoints e ajudou a testar com Authorize e Try it out.

### Como vocês testaram?

26 testes unitários dos services, com dependências falsas (`jest.fn`), sem subir o servidor; e 57 testes de integração que sobem a API com um banco temporário, incluindo os 19 cenários da tabela de testes.

### O que ficou de fora?

A tela de gestão de usuários: hoje o admin lista e desativa contas pelo Swagger. Também ficaram como próximos passos o refresh token, as promoções ligadas pela data, helmet com limite de tentativas no login e o upload de imagem.
