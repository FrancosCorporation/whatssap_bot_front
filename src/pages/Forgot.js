import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // reutiliza o estilo do Login

function Forgot() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aqui você pode fazer a request à sua API, se quiser
    setMessage('Se o e-mail estiver cadastrado, você receberá as instruções.');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Recuperar senha</h2>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Digite seu email</label>
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

            {message && <div className="info-message">{message}</div>}

            <button type="submit" className="login-button">
              Enviar instruções
            </button>
          </form>

          <div className="signup-link">
            Lembrou a senha?{' '}
            <span onClick={() => navigate('/login')} className="link-button">
              Fazer login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forgot;
