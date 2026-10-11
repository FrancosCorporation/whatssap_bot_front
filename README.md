# WhatsApp Bot — painel web

Interface React para criar uma conta, conectar o WhatsApp por QR Code, acompanhar a sessão e enviar mensagens individuais pela API.

## Requisitos

- Node.js 22.13 ou mais recente (a imagem Docker usa Node 24).
- A API do projeto irmão [whatssap_bot_api_back_end](https://github.com/FrancosCorporation/whatssap_bot_api_back_end), configurada para aceitar a origem `http://localhost:3000`.

## Desenvolvimento local

```bash
cp .env.example .env
npm ci
npm start
```

O painel abre em `http://localhost:3000`. Configure `VITE_API_URL` no `.env` com a origem HTTP(S) da API, sem caminho adicional. Para o ambiente local, o exemplo usa `http://localhost:3005`.

Para criar o bundle de produção:

```bash
npm run lint
npm run build
```

`VITE_API_URL` é incluída no JavaScript público do navegador. Não coloque tokens, senhas ou outras credenciais em variáveis com prefixo `VITE_`.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

O Compose sobe somente o front-end, publicado em `http://localhost:3000`. A API precisa estar disponível no endereço informado por `VITE_API_URL`. Para uma implantação, defina o endereço público da API antes de construir a imagem; essa configuração é embutida no bundle e na política CSP.

## Conta e sessão

- Cadastro: `POST /register`.
- Login: `POST /login`; a sessão usa o cookie `httpOnly` da API.
- Validação da sessão: `GET /verify`; perfil: `GET /api/user/profile`.
- Logout: `POST /logout`, que remove o cookie no servidor.
- Conexão WhatsApp: `POST /api/whatsapp/start`, `GET /api/check-session-status` e `POST /api/whatsapp/stop`.
- Envio individual: `POST /api/whatsapp/send`.
- Preferência de pausa/retomada: `GET /api/user/profile` e `PUT /api/user/settings`.

A recuperação de senha ainda não está implementada pela API. A preferência `/wait` e `/continue` pode ser salva no perfil, mas a API atual ainda não processa mensagens recebidas nem esses comandos.

## Segurança

O navegador não persiste JWT em `localStorage` ou `sessionStorage`. As chamadas usam cookies com credenciais, e o Docker serve o bundle com cabeçalhos de segurança e CSP ajustada à origem da API. Veja [SECURITY.md](./SECURITY.md).

## Estrutura

- `src/contexts/AuthContext.jsx`: sessão e dados de usuário compartilhados entre as telas.
- `src/services/api.js`: cliente HTTP, endpoints e erros legíveis.
- `src/pages/`: login, cadastro, recuperação informativa e painel.
- `nginx.conf`: fallback do SPA e cabeçalhos de segurança da imagem.
- `MELHORIAS.md`: diagnóstico e registro do trabalho deste projeto.
