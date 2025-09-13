import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: 'https://sua-api.com', // Substitua pela URL da sua API
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token de autenticação em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Função de login
export const login = async (email, password) => {
  try {
    // Para fins de demonstração, estou simulando uma resposta bem-sucedida
    // Em produção, descomente o código abaixo e use sua API real
    
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
    
    // Simulação de resposta (remova em produção):
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      token: 'token-simulado-para-testes',
      user: { id: 1, name: 'Usuário Teste', email }
    };
  } catch (error) {
    if (error.response) {
      // Erro retornado pela API
      throw new Error(error.response.data.message || 'Credenciais inválidas');
    } else if (error.request) {
      // Sem resposta do servidor
      throw new Error('Servidor indisponível. Tente novamente mais tarde.');
    } else {
      // Erro na configuração da requisição
      throw new Error('Erro ao conectar com o servidor.');
    }
  }
};

// Função para buscar dados do usuário
export const fetchUserData = async () => {
  try {
    // Para fins de demonstração, estou simulando uma resposta bem-sucedida
    // Em produção, descomente o código abaixo e use sua API real
    
    // const response = await api.get('/user/profile');
    // return response.data;
    
    // Simulação de resposta (remova em produção):
    await new Promise(resolve => setTimeout(resolve, 800));
    return { 
      id: 1, 
      name: 'Usuário Teste', 
      email: 'usuario@teste.com',
      role: 'admin'
    };
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw error;
  }
};

// Exporte o cliente axios configurado para uso em outros componentes
export default api;