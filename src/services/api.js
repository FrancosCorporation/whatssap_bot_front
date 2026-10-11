import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error('VITE_API_URL não foi definida. Copie .env.example para .env e configure a URL da API.');
}

let parsedApiUrl;
try {
  parsedApiUrl = new URL(configuredApiUrl);
} catch {
  throw new Error('VITE_API_URL deve ser uma URL HTTP(S) absoluta.');
}

if (
  !['http:', 'https:'].includes(parsedApiUrl.protocol) ||
  parsedApiUrl.username || parsedApiUrl.password || parsedApiUrl.search || parsedApiUrl.hash ||
  (parsedApiUrl.pathname !== '/' && parsedApiUrl.pathname !== '')
) {
  throw new Error('VITE_API_URL deve apontar para a origem HTTP(S) da API, sem caminho ou credenciais.');
}

export const apiUrl = parsedApiUrl.origin;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.skipAuthRedirect &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Não foi possível concluir a solicitação.') {
  if (error.response?.status === 429) {
    return error.response.data?.message || 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  }
  if (typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (error.request) {
    return 'Não foi possível conectar à API. Verifique se o servidor está disponível.';
  }
  return fallback;
}

export async function login(email, password) {
  const response = await api.post('/login', { email, password }, { skipAuthRedirect: true });
  return response.data.user;
}

export async function register(userData) {
  const response = await api.post('/register', userData, { skipAuthRedirect: true });
  return response.data;
}

export async function verifySession() {
  return api.get('/verify', { skipAuthRedirect: true });
}

export async function fetchUserProfile() {
  const response = await api.get('/api/user/profile');
  return response.data;
}

export async function logout() {
  return api.post('/logout', {}, { skipAuthRedirect: true });
}

export async function getWhatsAppSessionStatus() {
  const response = await api.get('/api/check-session-status');
  return response.data;
}

export async function startWhatsAppSession() {
  const response = await api.post('/api/whatsapp/start', {});
  return response.data;
}

export async function stopWhatsAppSession() {
  return api.post('/api/whatsapp/stop', {});
}

export async function sendWhatsAppMessage(to, message) {
  return api.post('/api/whatsapp/send', { to, message });
}

export async function updateUserSettings(settings) {
  const response = await api.put('/api/user/settings', settings);
  return response.data;
}

export default api;
