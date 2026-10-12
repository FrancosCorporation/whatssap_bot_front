# Segurança do painel web

- O JWT não é gravado em `localStorage` nem em `sessionStorage`. O painel depende do cookie `httpOnly` emitido e removido pela API.
- O cookie da API usa `SameSite=Strict`: em produção, painel e API precisam estar sob o mesmo site e usar HTTPS. CORS deve permitir a origem exata do painel com credenciais.
- `VITE_*` é configuração pública do navegador. Nunca use esse prefixo para segredo, senha ou token.
- O servidor estático envia CSP sem estilos inline, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
- A CSP permite conexões à origem definida por `VITE_API_URL`; a API deve restringir o CORS às origens conhecidas e habilitar credenciais.
- Relatos de vulnerabilidade devem ser encaminhados em particular aos mantenedores do repositório, sem incluir tokens ou dados pessoais.
