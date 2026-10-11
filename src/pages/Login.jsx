import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password || password.length > 128) {
      setError('Informe sua senha.');
      return;
    }
    if (honeypot) {
      setError('Não foi possível entrar. Confira os dados e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'E-mail ou senha incorretos.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <p className="auth-eyebrow">WhatsApp Bot</p>
          <h1 id="login-title">Bem-vindo de volta</h1>
          <p>Entre para gerenciar a conexão da sua conta.</p>
        </header>

        <div className="login-body">
          {location.state?.message && !error && (
            <div className="info-message" role="status">{location.state.message}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                className="auth-form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="auth-form-group">
              <div className="label-forgot">
                <label htmlFor="password">Senha</label>
                <Link className="forgot-password" to="/forgot">Esqueceu a senha?</Link>
              </div>
              <input
                type="password"
                id="password"
                className="auth-form-control"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                maxLength={128}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="website">Deixe este campo vazio</label>
              <input
                id="website"
                name="website"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error && <div id="login-error" className="error-message" role="alert">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="signup-link">
            Ainda não tem uma conta? <Link to="/signup">Criar conta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
