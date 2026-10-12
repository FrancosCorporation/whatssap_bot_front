# MELHORIAS — whatssap_bot_front

> **Diagnóstico original: 2026-10-02 · Atualizado: 2026-10-11** · Stack atual: React 18 + Vite 8 + Axios + React Router 7
> Branch `master` · base do diagnóstico `3f137f5` · Dockerfile, Compose, CI e SECURITY.md adicionados
>
> **Estado atual:** os itens do diagnóstico inicial foram implementados, com `TEST-01` adiado por instrução. Não foram adicionados nem executados testes nesta rodada. A auditoria de acompanhamento e os ajustes feitos em 2026-10-11 estão na §11.
> Os critérios abaixo registram o diagnóstico e as decisões de execução.

> **Nota de contexto:** as §§1–9 preservam o diagnóstico histórico da árvore em 2026-10-02. Referências a CRA, mocks, `localStorage`, Node 16 e outros defeitos descrevem aquele ponto de partida, não o código atual. Para o estado vigente, consulte as §§10–11, o [README](./README.md) e [SECURITY.md](./SECURITY.md).

---

## 0. Como usar este documento

1. O diagnóstico foi executado na ordem **P0 → P1 → P2 → P3**, respeitando as ondas da §8.
2. A lista da §10 registra o estado dos critérios após a implementação.
3. O login e o cadastro usam a API real; a URL é configurada por `VITE_API_URL` e a sessão fica no cookie `httpOnly`.
4. **Idioma:** português.

---

## 1. Diagnóstico inicial (histórico — 2026-10-02)

Front React do bot de WhatsApp: login, signup, recuperação de senha, dashboard e layout. O código de
UI é completo (526 linhas de Dashboard, páginas de auth).

**O que estava bem no baseline (não reaja):**

| Item | Evidência |
|---|---|
| Estilo das chamadas **centralizado** (axios com interceptor) | `src/services/api.js:4-25` |
| Interceptor adiciona `Authorization` automaticamente | `api.js:14-22` |
| `timeout` de 10 s configurado | `api.js:7` |
| Rotas com React Router 6 (layout + páginas) | `src/routes/Router.js` |
| `GENERATE_SOURCEMAP=false` no build (não publica fonte) | `Dockerfile:8` |
| Multi-stage no Dockerfile | `Dockerfile:1-12` |
| Logout limpa o token | `api.js:75` (`localStorage.removeItem('token')`) |

**O que está quebrado:**

1. **Login é SIMULADO** (`api.js:33-48`) — nenhuma integração real com o backend.
2. **`baseURL` é placeholder** (`api.js:5`: `'https://sua-api.com'`) — hardcoded, não configurável.
3. **Token em `localStorage`** (`api.js:15`, `Login.jsx:28`) — legível por qualquer XSS. O backend
   **já** envia cookie `httpOnly` (ver `whatssap_bot_api_back_end/userController.js:49-53`), o que o
   front **ignora** — o trabalho do back é desperdiçado.
4. **Node 16 EOL no build** (`Dockerfile:2`) e `npm ci || npm install` (ignora lockfile).

---

## 2. Tabela de prioridades inicial (histórica; estado atual na §10)

| ID | Título | Sev | Arquivo | Depende de |
|---|---|---|---|---|
| BUG-01 | Login **simulado** — front não integra com o backend | **P0** | `src/services/api.js:33-48` | BUG-02 |
| BUG-02 | `baseURL` hardcoded placeholder (`https://sua-api.com`) | **P0** | `src/services/api.js:5` | — |
| SEC-01 | Token JWT em `localStorage` (ignora o cookie `httpOnly` do back) | **P1** | `api.js:15`, `Login.jsx:28` | BUG-01 |
| SEC-02 | Node 16 EOL no build do Docker | **P1** | `Dockerfile:2` | — |
| SEC-03 | `npm ci \|\| npm install` (lockfile não é respeitado) | **P1** | `Dockerfile:5` | — |
| SEC-04 | `REACT_APP_*` aceito como `ARG` genérico (vaza env no bundle) | **P2** | `Dockerfile:7` | — |
| BUG-03 | Sem tratamento de `401`/expiração no interceptor | **P1** | `api.js:14-25` | BUG-01 |
| BUG-04 | Sem estado global de auth (cada página lê o `localStorage`) | **P2** | páginas | SEC-01 |
| BUG-05 | Sem loading/erro padronizado nas chamadas | **P2** | páginas | — |
| BUG-06 | `GENERATE_SOURCEMAP=false` só no Docker (dev publica fonte) | **P3** | `Dockerfile:8` | — |
| IMP-01 | Sem `.env.example` (`REACT_APP_API_URL`) | **P1** | *(ausente)* | BUG-02 |
| IMP-02 | Sem validação de formulário (e-mail/senha) | **P2** | `Login.jsx`, `Signup.jsx` | — |
| IMP-03 | Sem `helmet`/CSP no nginx de serve | **P2** | `Dockerfile` (serve) | SEC-04 |
| TEST-01 | Zero testes | **P1** | *(ausente)* | BUG-01 |
| DEVOPS-01 | Sem CI | **P2** | *(ausente)* | — |
| DEVOPS-02 | Sem `.dockerignore` | **P2** | *(ausente)* | — |
| DEVOPS-03 | CRA (`react-scripts`) — árvore antiga, CVEs | **P2** | `package.json` | — |
| DOC-01 | README não avisa que o login é simulado | **P1** | `README.md` | BUG-01 |
| DOC-02 | Falta `SECURITY.md` | **P3** | *(ausente)* | — |

**Placar: 2 P0 · 6 P1 · 8 P2 · 2 P3 = 18 itens.**

---

## 3. Bugs e defeitos funcionais do baseline (histórico)

### BUG-01 · Login **simulado** — front não integra com o backend · [P0]

- **Arquivo:** `src/services/api.js:33-48`
- **Evidência:**
  ```javascript
  export const login = async (email, password) => {
    try {
      // Para fins de demonstração, estou simulando uma resposta bem-sucedida
      // Em produção, descomente o código abaixo e use sua API real
      // const response = await api.post('/auth/login', { email, password });
      // return response.data;
      // Simulação de resposta (remova em produção):
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { token: 'token-simulado-para-testes', user: { id: 1, name: 'Usuário Teste', email } };
  ```
  A chamada real está **comentada** e o retorno é **hardcoded** — qualquer e-mail/senha "autentica".
- **Impacto:** **o front não funciona como produto.** Qualquer credencial entra; nenhum dado real é
  carregado; o dashboard mostra o "Usuário Teste". E como o token é o literal
  `'token-simulado-para-testes'`, mesmo que houvesse back, ele **rejeitaria** — o front mandaria um
  token inválido em todo request. É o item que **define o estado do projeto**.
- **Mudança:** (1) descomentar a chamada real e **remover** a simulação; (2) ajustar o endpoint ao do
  backend (`/login` — ver `whatssap_bot_api_back_end/userController.js:29` e as rotas); (3) tratar o
  retorno do back (`{ token, user }`); (4) **não** deixar caminho de mock acessível em produção
  (se quiser manter para demo, `if (import.meta.env.DEV)` explícito).
- **Aceite:** login com credencial inválida → mensagem de erro; com válida → entra no dashboard e as
  chamadas usam o token real.
- **Verificação:**
  ```bash
  # com o back rodando:
  curl -s -X POST http://localhost:3005/login -H 'Content-Type: application/json' \
    -d '{"email":"nao@existe.com","password":"x"}'   # 401 (o front deve refletir)
  grep -n 'token-simulado' src/ && echo 'FALHA: ainda simulado' || echo OK
  ```

### BUG-02 · `baseURL` hardcoded placeholder · [P0]

- **Arquivo:** `src/services/api.js:5`
- **Evidência:** `baseURL: 'https://sua-api.com', // Substitua pela URL da sua API` — literal.
- **Impacto:** todas as chamadas vão para um domínio que **não existe** (nem é do projeto). O front
  não funciona em nenhum ambiente sem editar o código e **rebuildar**. E o CORS do backend está
  configurado para `http://localhost:3000` (`whatssap_bot_api_back_end/src/server.js:29`) — ou seja,
  nem localmente casa.
- **Mudança:** (1) ler de env do CRA: `baseURL: process.env.REACT_APP_API_URL`;
  (2) **validar** no boot: se ausente, falhar claro (não silenciar para o placeholder); (3) criar
  `.env.example` com `REACT_APP_API_URL=http://localhost:3005` (`IMP-01`); (4) alinhar a origem
  esperada com o CORS do back.
- **Aceite:** com `.env` apontando para o back, o front conversa com a API.
- **Verificação:**
  ```bash
  grep -n 'sua-api.com' src/services/api.js && echo FALHA || echo OK
  grep -n 'REACT_APP_API_URL' src/services/api.js   # deve existir
  ```

### BUG-03 · Sem tratamento de `401`/expiração no interceptor · [P1]

- **Arquivo:** `src/services/api.js:14-25` (só o interceptor de **request**)
- **Evidência:** não há `api.interceptors.response`.
- **Impacto:** o token expira (2 h, `userController.js:53`) ou o back devolve `401` — e o front
  **não reage**: o usuário recebe erro genérico na página em vez de ser levado ao login. Experiência
  quebrada e estado inconsistente (fica "logado" no `localStorage` com token morto).
- **Mudança:** (1) interceptor de response: em `401`, limpar o token e redirecionar para `/login`;
  (2) em `429`, mostrar mensagem de limite; (3) em erro de rede, mensagem clara.
- **Aceite:** token expirado → usuário é levado ao login com aviso.
- **Verificação:** (manual/teste) forçar `401` e ver o redirect.

### BUG-04 · Sem estado global de auth · [P2]

- **Arquivo:** páginas (`Dashboard.jsx`, `Login.jsx`) — cada uma lê `localStorage`
- **Evidência:** `Login.jsx:28,30` grava no `localStorage`; `api.js:15` lê. Não há Context/Redux.
- **Impacto:** lógica de auth espalhada; inconsistência (uma página acha logado, outra não); dificulta
  migrar para cookie `httpOnly` (`SEC-01`).
- **Mudança:** um `AuthContext` (React Context) com `user`, `login`, `logout`; as páginas consomem o
  contexto. Facilita `SEC-01` (troca de storage por cookie).
- **Aceite:** login/logout refletem em todas as páginas sem reload manual.
- **Verificação:** (manual) login e conferir que o menu muda em todas as rotas.

### BUG-05 · Sem loading/erro padronizado · [P2]

- **Arquivo:** páginas (login/signup/dashboard)
- **Evidência:** cada página trata o próprio `try/catch` de forma diferente.
- **Impacto:** em falha, o usuário vê tela parada ou erro cru; sem indicador de carregamento consistente.
- **Mudança:** componente de feedback (loading/erro/sucesso) + hook único de chamada; padronizar.
- **Aceite:** toda chamada mostra loading e erro legível.
- **Verificação:** (manual) derrubar o back e usar o login → mensagem clara.

### BUG-06 · `GENERATE_SOURCEMAP=false` só no Docker · [P3]

- **Arquivo:** `Dockerfile:8`
- **Evidência:** a flag está na linha `ENV GENERATE_SOURCEMAP=false` do build, mas **não** num `.env`
  local.
- **Impacto:** build local (fora do Docker) publica **source maps** — expõe o código-fonte no deploy
  se alguém subir o `build/` local.
- **Mudança:** mover a flag para `.env`/`.env.production` (ou `package.json` script `build`).
- **Aceite:** build local também sem source map.
- **Verificação:**
  ```bash
  npm run build && ls build/static/js/*.map 2>/dev/null && echo 'FALHA: source map publicado' || echo OK
  ```

---

## 4. Segurança no baseline (histórico)

### SEC-01 · Token em `localStorage` (ignora o cookie `httpOnly` do back) · [P1]

- **Arquivo:** `src/services/api.js:15` e `src/pages/Login.jsx:28`
- **Evidência:** `localStorage.setItem('token', response.data.token)` e
  `const token = localStorage.getItem('token')` — e o interceptor monta `Authorization: Bearer`.
  Enquanto isso, o **backend já envia cookie `httpOnly`** com `sameSite: 'Strict'`
  (`whatssap_bot_api_back_end/src/controllers/userController.js:49-53`).
- **Impacto:** (a) o token em `localStorage` é **legível por qualquer JavaScript** na página — um XSS
  rouba a sessão; (b) **duplica** e conflita com o cookie `httpOnly` (que é o mecanismo seguro); (c)
  como o `httpOnly` existe, o trabalho do back é **desperdiçado**.
- **Mudança:** (1) **usar o cookie** — `withCredentials: true` no axios e **não** guardar o token;
  (2) o interceptor de request deixa de montar `Authorization` (o cookie vai automaticamente);
  (3) o back já aceita cookie (`authMiddleware.js:5`: `req.cookies.token` — **excelente**);
  (4) se o back precisa do header, usar memória (não persistir).
- **Aceite:** nenhum token em `localStorage`; a sessão funciona via cookie `httpOnly`.
- **Verificação:**
  ```bash
  grep -rn 'localStorage.*token' src/ && echo 'FALHA: token persistido' || echo OK
  grep -n 'withCredentials' src/services/api.js   # deve existir
  # no browser: Application > Local Storage nao deve ter 'token'
  ```

### SEC-02 · Node 16 EOL no build · [P1]

- **Arquivo:** `Dockerfile:2`
- **Evidência:** `FROM node:16-alpine AS build` (o `serve` usa `node:20-alpine`, `Dockerfile:11`).
- **Impacto:** o build roda em Node 16 (EOL 09/2023) — sem patch. O artefato publicado sai de
  toolchain sem suporte.
- **Mudança:** `node:20-alpine` no build também (alinhado ao serve).
- **Aceite:** ambos os estágios em Node 20.
- **Verificação:**
  ```bash
  grep -n '^FROM node' Dockerfile   # ambos 20-alpine
  ```

### SEC-03 · `npm ci || npm install` · [P1]

- **Arquivo:** `Dockerfile:5`
- **Evidência:** `RUN npm ci || npm install` — o fallback **ignora a falha** do `npm ci`.
- **Impacto:** se o `package-lock.json` estiver dessincronizado, o `npm ci` falha (é o ponto dele) e o
  `npm install` instala versões **não declaradas**, reescrevendo o lock dentro da imagem. Build
  **não reprodutível** e **não auditado**.
- **Mudança:** remover o `|| npm install` — deixar o build **falhar** (comportamento correto).
- **Aceite:** build falha se o lock não bater; sucesso significa lock válido.
- **Verificação:**
  ```bash
  grep -n 'npm ci' Dockerfile   # sem fallback
  ```

### SEC-04 · `REACT_APP_*` como `ARG` genérico · [P2]

- **Arquivo:** `Dockerfile:7`
- **Evidência:** `ARG REACT_APP_*=""` — declara **todas** as variáveis `REACT_APP_*` como build arg.
- **Impacto:** qualquer variável com prefixo `REACT_APP_` pode ser injetada no build e **entra no
  bundle** (o CRA embute `REACT_APP_*` no JavaScript). Se alguém passar um segredo com esse prefixo
  (nome engana), ele vai para o **artefato público**.
- **Mudança:** (1) declarar **apenas** as variáveis necessárias (`ARG REACT_APP_API_URL`);
  (2) documentar que **`REACT_APP_*` é público** — nunca segredo; (3) `IMP-03` (CSP) como defesa.
- **Aceite:** o Dockerfile declara só `REACT_APP_API_URL`; o bundle não contém segredo.
- **Verificação:**
  ```bash
  grep -n 'REACT_APP' Dockerfile   # so a necessaria
  grep -rE 'SECRET|TOKEN|KEY' build/static/js/ 2>/dev/null | head -3   # nenhum segredo no bundle
  ```

### IMP-03 · Sem `helmet`/CSP no nginx de serve · [P2]

- **Arquivo:** `Dockerfile` (estágio `serve`)
- **Evidência:** o segundo estágio serve o build — verifique se é nginx; sem `helmet`/headers de CSP.
- **Impacto:** um SPA sem CSP é a superfície onde um XSS (que roubaria o token do `localStorage` —
  `SEC-01`) roda livre. CSP é a defesa que **quebra** o ataque.
- **Mudança:** configurar o serve (nginx) com `Content-Security-Policy` restritiva
  (`default-src 'self'`), `X-Content-Type-Options`, `X-Frame-Options`; e ajustar `connect-src` para a
  URL da API.
- **Aceite:** headers presentes; app funciona sob a CSP.
- **Verificação:**
  ```bash
  curl -sI http://localhost:3000/ | grep -iE 'content-security-policy|x-frame-options'
  ```

---

## 5. Qualidade: testes e validação no baseline (histórico)

### IMP-02 · Sem validação de formulário · [P2]

- **Arquivo:** `src/pages/Login.jsx` (131 linhas), `src/pages/Signup.jsx` (180 linhas)
- **Evidência:** os formulários coletam e enviam; sem validação de formato de e-mail nem de força de
  senha.
- **Impacto:** e-mail inválido é enviado ao back (que hoje não valida — ver `IMP-02` do back irmão);
  senha fraca é aceita; UX ruim (erro só após o round-trip).
- **Mudança:** validação no cliente (formato de e-mail, senha ≥ 8, confirmação igual) com mensagem
  imediata; **e** validação no back (defesa real).
- **Aceite:** e-mail inválido → erro imediato no campo, sem request.
- **Verificação:** (manual) digitar `abc` no e-mail e conferir a mensagem sem chamar a API.

### TEST-01 · Zero testes · [P1]

- **Arquivo:** *(ausente)* — o CRA tem `react-scripts test` configurado, mas nenhum teste
- **Evidência:** `package.json:31` tem o script `test`, sem arquivos `*.test.js`.
- **Impacto:** o `BUG-01` (login simulado) é exatamente o tipo de bug que um teste pegaria: um teste
  que tenta login inválido e espera **erro** falharia imediatamente contra o mock. É o teste mais
  valioso possível aqui.
- **Mudança:** (1) `Login.test.jsx`: mockar a API e assertar que credencial inválida mostra erro e
  que credencial válida navega; (2) `api.test.js`: assertar que o interceptor **não** usa
  `localStorage` após `SEC-01`; (3) um teste que **falha** se `'token-simulado'` existir no código.
- **Aceite:** `npm test` roda e passa; falha se o login voltar a ser simulado.
- **Verificação:**
  ```bash
  CI=true npm test 2>&1 | tail -5
  ```

---

## 6. DevOps / Infra no baseline (histórico)

### IMP-01 · Sem `.env.example` · [P1]

- **Arquivo:** *(ausente)* `.env.example`
- **Evidência:** após `BUG-02`, o front exige `REACT_APP_API_URL` — e não há exemplo. O CRA lê
  `.env` na raiz do projeto.
- **Impacto:** sem doc, quem clona não sabe qual variável definir, e o `BUG-02` (placeholder) volta
  por falta de alternativa clara.
- **Mudança:** `.env.example` com:
  ```
  # Público no bundle — NUNCA coloque segredo aqui
  REACT_APP_API_URL=http://localhost:3005
  ```
  e `.env` no `.gitignore`.
- **Aceite:** `.env.example` versionado; `cp .env.example .env` + `npm start` funciona.
- **Verificação:**
  ```bash
  ls .env.example && grep -q REACT_APP_API_URL .env.example && echo OK
  git check-ignore -q .env && echo 'OK: .env ignorado'
  ```

### DEVOPS-01 · Sem CI · [P2]

- **Arquivo:** *(ausente)* `.github/workflows/`
- **Evidência:** sem workflow.
- **Impacto:** nada trava o `BUG-01` (login simulado) de voltar, nem valida o build.
- **Mudança:** `ci.yml`: `npm ci`, `npm run lint`, `npm audit`, `npm run build` e uma barreira que
  falha se um mock antigo ou token persistido aparecer em `src/`.
- **Aceite:** PR com login simulado é bloqueado.
- **Verificação:**
  ```bash
  grep -rn 'token-simulado\|sua-api.com' src/ && echo FALHA || echo OK
  ```

### DEVOPS-02 · Sem `.dockerignore` · [P2]

- **Arquivo:** *(ausente)* `.dockerignore`
- **Evidência:** o `Dockerfile` faz `COPY . .` (linha 6) — e sem `.dockerignore`, o contexto inclui
  `node_modules` (pesado), `.git`, e — **pior** — um `.env` local com a URL da API (embora
  `REACT_APP_*` seja público, o hábito é o problema).
- **Impacto:** contexto de build grande (build lento) e risco de embutir arquivo local no layer.
- **Mudança:** `.dockerignore` com `node_modules`, `build`, `.git`, `.env`, `.env.*`, `npm-debug.log*`.
- **Aceite:** contexto menor; nenhum `.env` no build.
- **Verificação:**
  ```bash
  docker build -t wf . 2>&1 | grep -i 'transferring context'
  ```

### DEVOPS-03 · CRA (`react-scripts`) — árvore antiga com CVEs · [P2]

- **Arquivo:** `package.json` (`react-scripts`)
- **Evidência:** o projeto usa **Create React App** (`react-scripts`), árvore que a comunidade
  descontinuou como ponto de partida — e que arrasta centenas de transitivas (o repo irmão
  `recruiters-apllication-example`, com a mesma base, recebeu **203 CVEs** do GitHub, 5 críticas).
- **Impacto:** risco de supply chain no **build** (o bundle vai a produção); `npm audit` ruidoso;
  tooling desatualizado (o `react-scripts` 5 tem limite de compatibilidade).
- **Mudança:** migrar para Vite e remover o CRA; atualizar o roteador para a versão corrigida.
- **Aceite:** CVEs drasticamente reduzidas; `npm run build` funciona.
- **Verificação:**
  ```bash
  npm audit 2>&1 | tail -4
  npm run build
  ```

---

## 7. Documentação no baseline (histórico)

### DOC-01 · README não avisa que o login é simulado · [P1]

- **Arquivo:** `README.md`
- **Evidência:** o README é o de instalação do acervo e não menciona que a **API é simulada** nem que
  `baseURL` é placeholder.
- **Impacto:** alguém sobe o front achando que está integrado; testa e não entende por que qualquer
  senha entra. É o oposto de documentação útil — mais grave que faltar.
- **Mudança:** documentar a integração real, `VITE_API_URL`, CORS e as funções ainda não disponíveis.
- **Aceite:** README deixa claro o que é mock e o que é real.
- **Verificação:** `grep -ni 'simulad\|mock\|REACT_APP_API_URL' README.md`.

### DOC-02 · Falta `SECURITY.md` · [P3]

- **Arquivo:** *(ausente)* `SECURITY.md`
- **Evidência:** sem política (nem `LICENSE` no front).
- **Impacto:** as invariantes (token **nunca** em `localStorage`; `VITE_*` é **público**) precisam
  estar escritas para não regredirem.
- **Mudança:** criar com canal + as 2 invariantes.
- **Aceite:** arquivo existe com as 2 invariantes.
- **Verificação:** `ls SECURITY.md`

---

## 8. Ordem de execução original (histórica)

### Wave 1 — Ligar o front de verdade (P0)
1. **`BUG-02`** — `baseURL` por env + `.env.example` (`IMP-01`).
2. **`BUG-01`** — remover o mock, chamar o back real.
3. **`BUG-03`** — interceptor de `401`/expiração.
4. **`DOC-01`** — README avisando o estado (antes, para não confundir).

> Depois da Wave 1, o front autentica de verdade e reage a token expirado.

### Wave 2 — Segurança da sessão (P1)
5. **`SEC-01`** — cookie `httpOnly` (remover `localStorage`) — **junto** com `BUG-04` (contexto).
6. **`TEST-01`** — testes (o de "falha se simulado" trava a Wave 1).
7. **`SEC-02`** + **`SEC-03`** — Node 24 e `npm ci` estrito no Dockerfile.

### Wave 3 — Robustez (P2)
8. **`SEC-04`** — `ARG` só do necessário; **`IMP-03`** — CSP no serve.
9. **`BUG-05`**, **`IMP-02`** — feedback padronizado e validação de formulário.
10. **`DEVOPS-01`**, **`DEVOPS-02`** — CI (com barreira anti-mock) e `.dockerignore`.

### Wave 4 — Evolução (P2/P3)
11. **`DEVOPS-03`** — migrar para Vite (ou pinar overrides); **`BUG-06`**; **`DOC-02`**.

**Dependências que não podem ser invertidas:**
`BUG-02` **antes** de `BUG-01` (sem URL não há como chamar o back) · `BUG-01` antes de `SEC-01`
(o cookie só funciona com o login real) · `BUG-04` junto com `SEC-01` (o contexto é o que permite
remover o storage) · `TEST-01` depois de `BUG-01` (o teste trava a integração) · `IMP-03` depois de
`SEC-04` (a CSP lista a origem da API).

---

## 9. Fora de escopo / riscos identificados no baseline (histórico)

| Item | Decisão | Motivo |
|---|---|---|
| Reescrever a UI / trocar design system | **Não** | As 526 linhas de Dashboard funcionam; a lacuna é integração. |
| Trocar axios por fetch | **Não** | axios com interceptor está correto. |
| SSR/Next.js | **Não** | SPA é adequado; migrar é decisão de produto. |
| i18n | **Não** | Feature. |

**Riscos desta execução:**

- **`BUG-01` (ligar no back) pode revelar incompatibilidades**: o back espera `/login` e devolve
  `{ token, user }`; o front espera `response.data.token`. Confirme o contrato antes (o CORS do back
  aponta para `localhost:3000` — o front precisa rodar nessa porta ou o back precisa ser ajustado).
- **`SEC-01` (cookie `httpOnly`) exige `withCredentials`** nos dois lados: o axios precisa de
  `withCredentials: true` **e** o CORS do back precisa de `credentials: true` (já tem,
  `server.js:31`) **e** origem explícita (já tem). Alinhe os três.
- **`SEC-01` pode quebrar o interceptor** que hoje monta `Authorization`. Migre o interceptor junto.
- **`DEVOPS-03` (Vite) é migração com risco de build** — faça isolado, com o app funcionando antes.

---

## 10. Definição de pronto (DoD)

**Funcional (a raiz)**
- [x] `BUG-01` — login e cadastro chamam o backend real; erros são exibidos sem mock
- [x] `BUG-02` — URL da API validada por `VITE_API_URL`, sem placeholder
- [x] `BUG-03` — `401` encerra o estado local de sessão e leva ao login
- [x] `BUG-04` — `AuthContext` compartilha usuário, login, logout e perfil
- [x] `BUG-05` — carregamento e erros têm feedback visível
- [x] `BUG-06` — build Vite sem source map

**Segurança**
- [x] `SEC-01` — sem token em `localStorage`; sessão via cookie `httpOnly` + `withCredentials`
- [x] `SEC-02` — Node 24 no build; Nginx não-root no estágio de serviço
- [x] `SEC-03` — `npm ci` estrito, sem fallback
- [x] `SEC-04` — `VITE_API_URL` é a única configuração pública de build; não recebe segredos
- [x] `IMP-03` — CSP e cabeçalhos de segurança no Nginx

**Qualidade e infra**
- [x] `IMP-01` — `.env.example` com `VITE_API_URL`; `.env` ignorado e removido do Git
- [x] `IMP-02` — validação de cadastro e login no cliente
- [ ] `TEST-01` — testes não foram adicionados nem executados nesta rodada
- [x] `DEVOPS-01` — CI com lint, auditoria, build e barreira anti-mock
- [x] `DEVOPS-02` — `.dockerignore` exclui ambiente, dependências e arquivos locais
- [x] `DEVOPS-03` — CRA removido; Vite adotado; auditoria sem vulnerabilidades

**Documentação**
- [x] `DOC-01` — README documenta integração, variáveis e limites atuais
- [x] `DOC-02` — `SECURITY.md` registra as invariantes

**Validação de acompanhamento em 2026-10-11:** `npm run lint`, `npm run build`, `npm audit --audit-level=high`, `git diff --check` e renderização da CSP passaram. O build gerou apenas JS e CSS, sem source map.

`TEST-01` continua pendente por instrução. Esta rodada não executou testes nem iniciou serviços.

## 11. Auditoria de acompanhamento — 2026-10-11

**Base auditada:** branch `master`, inicialmente em `40bde757642ee3839215b326923e08001865fa77`, igual a `origin/master`.

| ID | Achado | Ação |
|---|---|---|
| UI-01 | Se o cancelamento da sessão falhasse durante a espera pelo QR Code, o painel assumia incorretamente o estado `connected`. | Restaurar o estado anterior ao pedido quando a API falha; respostas `404` continuam indicando sessão offline. |
| SEC-05 | A CSP permitia estilos inline sem uso identificado no bundle do painel. | Remover `'unsafe-inline'` de `style-src`; folhas CSS carregadas da própria origem continuam permitidas. |
| CI-01 | A CI usava actions v4 com runtime Node 20 e o alias `ubuntu-latest`, que estava prestes a mudar de versão principal. | Atualizar checkout/setup-node para v5 (runtime Node 24) e fixar o runner `ubuntu-24.04`. |
| DOC-03 | A documentação de implantação não explicava a restrição do cookie `SameSite=Strict`. | Registrar a exigência de HTTPS, mesma origem de site e origem CORS exata em README e SECURITY. |
| DOC-04 | O diagnóstico inicial podia ser confundido com o estado atual do código. | Marcar §§1–9 como baseline histórico e apontar para esta auditoria e os documentos vigentes. |

**Verificações desta rodada:** `npm audit --json` informou zero vulnerabilidades (38 dependências de produção; 198 no total). O CI do commit base `40bde757642ee3839215b326923e08001865fa77` concluiu com sucesso (`Frontend CI`, execução `38159643268`), mas sinalizou runtime Node 20 e a próxima migração de `ubuntu-latest`; CI-01 remove essas duas fontes de surpresa.

Lint, build e auditoria passaram; não foram adicionados nem executados testes. A validação visual manual também não foi feita nesta rodada.

---

*Fim do plano. Diagnóstico original de 2026-10-02; execução atualizada em 2026-10-11.*
