import { Link } from 'react-router-dom';
import './Login.css';

export default function Forgot() {
  return (
    <main className="login-container">
      <section className="login-card" aria-labelledby="forgot-title">
        <header className="login-header">
          <p className="auth-eyebrow">WhatsApp Bot</p>
          <h1 id="forgot-title">Recuperar senha</h1>
        </header>
        <div className="login-body">
          <div className="info-message" role="status">
            A recuperação de senha ainda não está disponível. Entre em contato com o administrador da sua conta.
          </div>
          <p className="signup-link"><Link to="/login">Voltar para o login</Link></p>
        </div>
      </section>
    </main>
  );
}
