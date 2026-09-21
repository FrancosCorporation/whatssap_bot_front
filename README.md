# WhatsApp Bot — Front-end

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Create React App](https://img.shields.io/badge/Create%20React%20App-5-09D3AC?logo=createreactapp&logoColor=white)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

Interface web em React para autenticação de usuários e controle da sessão do bot de WhatsApp (QR Code, status de conexão e logout).

## Sobre

Este é o front-end do bot de WhatsApp: um painel em React que consome a API do repositório irmão [whatssap_bot_api_back_end](https://github.com/FrancosCorporation/whatssap_bot_api_back_end). O usuário cria a conta, faz login e, no dashboard, liga/desliga o bot e escaneia o QR Code para parear o número.

A aplicação foi criada com Create React App e usa React Router para separar as telas de login, cadastro, recuperação de senha e dashboard (esta última protegida).

## Funcionalidades

- Tela de login com validação de campos, campo honeypot anti-bot e envio de `POST /login` via Axios com cookies (`withCredentials`); em caso de sucesso grava `token` e `authenticated` no `localStorage` e redireciona para o dashboard.
- Tela de cadastro com confirmação de senha, confirmação de e-mail e envio de `POST /register`, redirecionando para o login.
- Tela de recuperação de senha (apenas mensagem informativa no cliente; ainda não chama a API).
- Rota privada (`/dashboard`) que só renderiza com `authenticated === 'true'` no `localStorage`.
- Dashboard com botão de ativar/desativar o bot, exibição do QR Code retornado pela API (`POST /api/whatsapp/start`) e polling de `GET /api/check-session-status` a cada 3 segundos para confirmar a conexão.
- Sidebar responsiva (colapsa em telas menores) e logout que remove o token e volta para o login.
- Cliente Axios central em `src/services/api.js` com interceptor que injeta o token `Bearer` em todas as requisições (as funções `login`/`fetchUserData` desse arquivo estão simuladas para demonstração).

## Stack

- **React 18** (Create React App 5, `react-scripts`)
- **React Router DOM 6**
- **Axios**
- **React Icons** (ícones Feather)
- **CSS puro** (arquivos `.css` por página)

## Como rodar

Requer configuração de ambiente: a URL da API é lida de `REACT_APP_API_URL` (arquivo `.env` na raiz, atualmente apontando para `http://localhost:3005`).

```bash
# 1. Instalar dependências
npm install

# 2. Conferir o arquivo .env
# REACT_APP_API_URL=http://localhost:3005

# 3. Subir o front-end em modo de desenvolvimento (http://localhost:3000)
npm start

# Build de produção
npm run build

# Testes (CRA + Testing Library)
npm test

# Ejetar a configuração do CRA (irreversível)
npm run eject
```

A API precisa estar rodando (repositório `whatssap_bot_api_back_end`) e com CORS liberado para `http://localhost:3000`.

## Estrutura do projeto

```
whatssap_bot_front/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js
│   ├── index.js
│   ├── layouts/MainLayout.js
│   ├── pages/            # Login, Signup, Forgot, Dashboard, Home, Profile (+ CSS)
│   ├── routes/Router.js  # rotas e PrivateRoute
│   ├── services/api.js   # cliente Axios
│   └── assets/
└── .env                  # REACT_APP_API_URL
```

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
