import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, register } from '../services/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (name.trim().length < 2 || name.trim().length > 100) {
      setError('Informe seu nome completo (até 100 caracteres).');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('A senha deve ter entre 8 e 128 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (honeypot) {
      setError('Não foi possível criar a conta. Confira os dados e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/login', {
        replace: true,
        state: { message: 'Conta criada. Entre com seu e-mail e senha.' },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível criar sua conta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-container">
      <section className="signup-card" aria-labelledby="signup-title">
        <header className="signup-header">
          <p className="auth-eyebrow">WhatsApp Bot</p>
          <h1 id="signup-title">Criar conta</h1>
          <p>Cadastre seus dados para acessar o painel.</p>
        </header>

        <div className="signup-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label htmlFor="name">Nome completo</label>
              <input
                type="text"
                id="name"
                className="auth-form-control"
                placeholder="Seu nome completo"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'signup-error' : undefined}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="signup-email">E-mail</label>
              <input
                type="email"
                id="signup-email"
                className="auth-form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                maxLength={254}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'signup-error' : undefined}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="signup-password">Senha</label>
              <input
                type="password"
                id="signup-password"
                className="auth-form-control"
                placeholder="Pelo menos 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'signup-error' : undefined}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirm-password">Confirmar senha</label>
              <input
                type="password"
                id="confirm-password"
                className="auth-form-control"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="signup-website">Deixe este campo vazio</label>
              <input
                id="signup-website"
                name="website"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error && <div id="signup-error" className="error-message" role="alert">{error}</div>}

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <p className="login-link">
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
