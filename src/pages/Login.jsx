import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
const apiUrl = process.env.REACT_APP_API_URL;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Campo honeypot para detectar bots
  const [error, setError] = useState(''); // Armazenar mensagens de erro
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const api = axios.create({
      baseURL: apiUrl,  // Seu servidor
      withCredentials: true,  // Se você estiver usando cookies
    });

    try {
      const response = await api.post('/login', { email, password });
      
      // Verifique a resposta da API para saber o que está sendo retornado
      if (response.status === 200) {
        // Armazena o token JWT no localStorage após login
        localStorage.setItem('token', response.data.token); // Supondo que o token seja retornado aqui

        // Caso o login seja bem-sucedido, armazenamos a variável authenticated no localStorage
        localStorage.setItem('authenticated', 'true');

        // Redireciona para a Dashboard
        navigate("/dashboard");  
      }
    } catch (err) {
      console.error(err);  // Verifique o erro
      setError(err.response ? err.response.data.message : 'Erro ao tentar fazer login');
    }
  };

  // Função para navegar para a página de cadastro
  const goToSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Bem-vindo</h2>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-group">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-forgot">
                <label htmlFor="password">Senha</label>
                <span className="forgot-password" onClick={() => navigate('/forgot')}>
                  Esqueceu a senha?
                </span>
              </div>
              <div className="input-group">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Campo honeypot - invisível para usuários reais */}
            {error && <div className="error-message">{error}</div>}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="confirm_password">Não preencha este campo</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="login-button"
            >
              Entrar
            </button>
          </form>

          <div className="signup-link">
            Não tem uma conta? <span onClick={goToSignup} className="link-button">
              Cadastre-se
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
