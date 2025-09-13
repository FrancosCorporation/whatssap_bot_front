import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  // Importando o Axios
import './Signup.css';

const apiUrl = process.env.REACT_APP_API_URL;  // Usando a variável de ambiente da URL da API

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Campo honeypot para detectar bots
  const [error, setError] = useState(''); // Armazenar mensagens de erro
  const [loading, setLoading] = useState(false); // Para controlar o estado de carregamento
  const navigate = useNavigate();

  // Função para validação de senha
  const isPasswordValid = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    setError('');

    // Dados do formulário para enviar à API
    const userData = {
      name,
      email,
      password,
    };

    try {
      // Enviar dados para a API de registro usando Axios
      const response = await axios.post(`${apiUrl}/register`, userData);

      // Caso o registro seja bem-sucedido, redireciona para a página de login
      if (response.status === 201) {
        navigate('/login');
      }
    } catch (err) {
      // Captura e exibe erros caso o envio falhe
      setError(err.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para navegar para a página de login
  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Criar Conta</h2>
        </div>
        
        <div className="signup-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nome completo</label>
              <div className="input-group">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input 
                  type="text" 
                  id="name" 
                  className="form-control" 
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

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
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
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
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar senha</label>
              <div className="input-group">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
                <input 
                  type="password" 
                  id="confirm-password" 
                  className="form-control" 
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Exibição do erro de senha não coincidente */}
            {error && <div className="error-message">{error}</div>}

            {/* Campo honeypot - invisível para usuários reais */}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="confirm_password_hp">Não preencha este campo</label>
              <input
                type="password"
                id="confirm_password_hp"
                name="confirm_password_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

            <button 
              type="submit" 
              className="signup-button"
              disabled={loading || !isPasswordValid}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <div className="login-link">
            Já tem uma conta? <span className="link-button-login"onClick={goToLogin} >Faça login</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
