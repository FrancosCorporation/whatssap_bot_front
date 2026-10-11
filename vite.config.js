import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrlValue = process.env.VITE_API_URL || env.VITE_API_URL;
  if (!apiUrlValue) {
    throw new Error('VITE_API_URL não foi definida. Copie .env.example para .env e configure a URL da API.');
  }

  let apiUrl;
  try {
    apiUrl = new URL(apiUrlValue);
  } catch {
    throw new Error('VITE_API_URL deve ser uma URL HTTP(S) absoluta.');
  }

  if (
    !['http:', 'https:'].includes(apiUrl.protocol) ||
    apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash ||
    (apiUrl.pathname !== '/' && apiUrl.pathname !== '')
  ) {
    throw new Error('VITE_API_URL deve apontar para a origem HTTP(S) da API, sem caminho ou credenciais.');
  }

  return {
    plugins: [react()],
    build: { sourcemap: false },
    server: { host: '0.0.0.0', port: 3000, strictPort: true },
    preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  };
});
