import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import {
  getApiErrorMessage,
  getWhatsAppSessionStatus,
  sendWhatsAppMessage,
  startWhatsAppSession,
  stopWhatsAppSession,
  updateUserSettings,
} from '../services/api';
import './Dashboard.css';

const navigation = [
  { id: 'dashboard', label: 'Visão geral', icon: FiActivity },
  { id: 'profile', label: 'Meu perfil', icon: FiUser },
  { id: 'settings', label: 'Configurações', icon: FiSettings },
  { id: 'help', label: 'Ajuda', icon: FiHelpCircle },
];

function initialsFor(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
}

function formatDate(value) {
  if (!value) return 'Não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window === 'undefined' || window.innerWidth > 768
  ));
  const [activePage, setActivePage] = useState('dashboard');
  const [sessionState, setSessionState] = useState('loading');
  const [qrCode, setQrCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messageFeedback, setMessageFeedback] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [allowPauseContinue, setAllowPauseContinue] = useState(user?.allowPauseContinue !== false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState(null);

  const displayName = user?.name || 'Usuário';
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const isConnected = sessionState === 'connected';
  const isBusy = ['loading', 'starting', 'stopping'].includes(sessionState);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleScreenSize = (event) => {
      setIsMobile(event.matches);
      setSidebarOpen(!event.matches);
    };

    handleScreenSize(mediaQuery);
    mediaQuery.addEventListener('change', handleScreenSize);
    return () => mediaQuery.removeEventListener('change', handleScreenSize);
  }, []);

  useEffect(() => {
    let active = true;

    getWhatsAppSessionStatus()
      .then((session) => {
        if (!active) return;
        if (session.authenticated) {
          setSessionState('connected');
        } else if (session.connecting) {
          setSessionState('waiting');
        } else {
          setSessionState('offline');
        }
      })
      .catch((error) => {
        if (!active) return;
        setSessionState('error');
        setFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível consultar a sessão.') });
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sessionState !== 'waiting') return undefined;

    let active = true;
    let timeoutId;

    const poll = async () => {
      try {
        const session = await getWhatsAppSessionStatus();
        if (!active) return;

        if (session.authenticated) {
          setSessionState('connected');
          setQrCode('');
          setFeedback({ type: 'success', text: 'WhatsApp conectado e pronto para uso.' });
          return;
        }

        if (session.connecting) {
          timeoutId = window.setTimeout(poll, 3000);
          return;
        }

        setSessionState('offline');
        setQrCode('');
        setFeedback({ type: 'info', text: 'A tentativa de conexão foi encerrada. Solicite um novo QR Code para tentar novamente.' });
      } catch (error) {
        if (!active) return;
        setSessionState('error');
        setFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível confirmar a conexão.') });
      }
    };

    timeoutId = window.setTimeout(poll, 3000);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [sessionState]);

  const statusCopy = {
    loading: { label: 'Consultando', detail: 'Verificando a sessão do WhatsApp.' },
    starting: { label: 'Conectando', detail: 'Preparando uma nova sessão.' },
    waiting: { label: 'Aguardando', detail: qrCode ? 'Escaneie o QR Code com o WhatsApp.' : 'Aguardando a confirmação da sessão.' },
    connected: { label: 'Conectado', detail: 'Sua sessão está ativa.' },
    offline: { label: 'Desconectado', detail: 'Conecte o WhatsApp para começar.' },
    stopping: { label: 'Encerrando', detail: 'Finalizando a sessão do WhatsApp.' },
    error: { label: 'Indisponível', detail: 'Não foi possível consultar a sessão.' },
  }[sessionState];

  const handleStartSession = async () => {
    setFeedback(null);
    setSessionState('starting');

    try {
      const session = await startWhatsAppSession();
      if (session.authenticated) {
        setSessionState('connected');
        setQrCode('');
        setFeedback({ type: 'success', text: 'WhatsApp conectado e pronto para uso.' });
        return;
      }

      if (session.qr) {
        setQrCode(session.qr);
        setSessionState('waiting');
        setFeedback({ type: 'info', text: 'Escaneie o QR Code antes que ele expire.' });
        return;
      }

      setSessionState('error');
      setFeedback({ type: 'error', text: 'A API não retornou um QR Code para esta sessão.' });
    } catch (error) {
      setSessionState('offline');
      setFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível iniciar a sessão.') });
    }
  };

  const handleStopSession = async () => {
    setSessionState('stopping');
    setFeedback(null);

    try {
      await stopWhatsAppSession();
      setSessionState('offline');
      setQrCode('');
      setFeedback({ type: 'success', text: 'Sessão do WhatsApp encerrada.' });
    } catch (error) {
      if (error.response?.status === 404) {
        setSessionState('offline');
        setQrCode('');
        setFeedback({ type: 'info', text: 'Não havia uma sessão ativa para encerrar.' });
      } else {
        setSessionState('connected');
        setFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível encerrar a sessão.') });
      }
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setMessageFeedback(null);

    const number = recipient.replace(/\D/g, '');
    const trimmedMessage = message.trim();
    if (number.length < 7 || number.length > 15) {
      setMessageFeedback({ type: 'error', text: 'Informe um telefone com código do país e entre 7 e 15 dígitos.' });
      return;
    }
    if (!trimmedMessage || trimmedMessage.length > 4000) {
      setMessageFeedback({ type: 'error', text: 'A mensagem deve ter entre 1 e 4.000 caracteres.' });
      return;
    }

    setSendingMessage(true);
    try {
      await sendWhatsAppMessage(number, trimmedMessage);
      setMessage('');
      setMessageFeedback({ type: 'success', text: 'Mensagem enviada.' });
    } catch (error) {
      setMessageFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível enviar a mensagem.') });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      await updateUserSettings({ allowPauseContinue });
      await refreshUser();
      setSettingsFeedback({ type: 'success', text: 'Preferência salva no seu perfil.' });
    } catch (error) {
      setSettingsFeedback({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível salvar a configuração.') });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const selectPage = (page) => {
    setActivePage(page);
    if (isMobile) setSidebarOpen(false);
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <section className="panel status-card" aria-labelledby="status-title">
        <div className="panel-heading">
          <div>
            <p className="section-eyebrow">Sua conta</p>
            <h2 id="status-title">Conexão do WhatsApp</h2>
          </div>
          <span className={`status-pill status-${sessionState}`}>
            <span className="status-dot" aria-hidden="true" />
            {statusCopy.label}
          </span>
        </div>

        <p className="status-description">{statusCopy.detail}</p>

        {feedback && <div className={`feedback feedback-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}

        <div className="session-actions">
          {isConnected ? (
            <button type="button" className="button button-secondary" onClick={handleStopSession} disabled={isBusy}>
              {sessionState === 'stopping' ? 'Encerrando…' : 'Desconectar WhatsApp'}
            </button>
          ) : (
            <button type="button" className="button button-primary" onClick={handleStartSession} disabled={isBusy}>
              {sessionState === 'starting' ? 'Preparando…' : qrCode ? 'Solicitar QR Code novamente' : 'Conectar WhatsApp'}
            </button>
          )}
          {sessionState === 'waiting' && (
            <button type="button" className="button button-quiet" onClick={handleStopSession}>
              Cancelar tentativa
            </button>
          )}
        </div>

        {qrCode && (
          <div className="qr-panel">
            <div>
              <h3>Leia o código pelo WhatsApp</h3>
              <p>Abra o WhatsApp no celular, acesse aparelhos conectados e leia este código.</p>
            </div>
            <img className="qr-image" src={qrCode} alt="QR Code para conectar sua conta do WhatsApp" />
          </div>
        )}
      </section>

      <section className="panel message-panel" aria-labelledby="message-title">
        <div className="panel-heading">
          <div>
            <p className="section-eyebrow">Envio individual</p>
            <h2 id="message-title">Enviar mensagem</h2>
          </div>
          <FiMessageSquare aria-hidden="true" />
        </div>
        <p className="panel-description">Envie uma mensagem de texto para um número com WhatsApp.</p>
        <form className="message-form" onSubmit={handleSendMessage}>
          <div className="form-group">
            <label htmlFor="recipient">Telefone com código do país</label>
            <input
              id="recipient"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5511999999999"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              maxLength={24}
              disabled={!isConnected || sendingMessage}
              required
            />
          </div>
          <div className="form-group">
            <div className="field-heading">
              <label htmlFor="message">Mensagem</label>
              <span>{message.length}/4000</span>
            </div>
            <textarea
              id="message"
              rows={4}
              placeholder="Escreva sua mensagem"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              disabled={!isConnected || sendingMessage}
              required
            />
          </div>
          {messageFeedback && <div className={`feedback feedback-${messageFeedback.type}`} role={messageFeedback.type === 'error' ? 'alert' : 'status'}>{messageFeedback.text}</div>}
          {!isConnected && <p className="form-hint">Conecte sua conta do WhatsApp para habilitar o envio.</p>}
          <button type="submit" className="button button-primary" disabled={!isConnected || sendingMessage}>
            {sendingMessage ? 'Enviando…' : 'Enviar mensagem'}
          </button>
        </form>
      </section>
    </div>
  );

  const renderProfile = () => (
    <section className="panel profile-panel">
      <div className="panel-heading">
        <div>
          <p className="section-eyebrow">Conta</p>
          <h2>Meu perfil</h2>
        </div>
      </div>
      <div className="profile-header">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-info">
          <h3>{displayName}</h3>
          <p>{user?.email || 'E-mail não informado'}</p>
        </div>
      </div>
      <dl className="profile-details">
        <div className="detail-item">
          <dt>Nome</dt>
          <dd>{displayName}</dd>
        </div>
        <div className="detail-item">
          <dt>E-mail</dt>
          <dd>{user?.email || 'Não informado'}</dd>
        </div>
        <div className="detail-item">
          <dt>Número do WhatsApp</dt>
          <dd>{user?.whatsappNumber || 'Ainda não conectado'}</dd>
        </div>
        <div className="detail-item">
          <dt>Conta criada em</dt>
          <dd>{formatDate(user?.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );

  const renderSettings = () => (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <div>
          <p className="section-eyebrow">Preferências</p>
          <h2>Configurações</h2>
        </div>
      </div>
      <div className="setting-item">
        <div className="setting-label">
          <h3>Permitir comandos de pausa e retomada</h3>
          <p>Salva sua preferência para os comandos <code>/wait</code> e <code>/continue</code>.</p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={allowPauseContinue}
            onChange={(event) => setAllowPauseContinue(event.target.checked)}
            aria-label="Permitir comandos de pausa e retomada"
          />
          <span className="toggle-slider" />
        </label>
      </div>
      <p className="setting-note">A API ainda não processa mensagens recebidas; esta preferência não ativa os comandos no WhatsApp.</p>
      {settingsFeedback && <div className={`feedback feedback-${settingsFeedback.type}`} role={settingsFeedback.type === 'error' ? 'alert' : 'status'}>{settingsFeedback.text}</div>}
      <div className="settings-actions">
        <button type="button" className="button button-primary" onClick={handleSaveSettings} disabled={savingSettings}>
          {savingSettings ? 'Salvando…' : 'Salvar preferência'}
        </button>
      </div>
    </section>
  );

  const renderHelp = () => (
    <section className="panel help-panel">
      <div className="panel-heading">
        <div>
          <p className="section-eyebrow">Precisa de ajuda?</p>
          <h2>Como usar o painel</h2>
        </div>
      </div>
      <div className="help-item">
        <h3>Como conectar meu WhatsApp?</h3>
        <p>Selecione “Conectar WhatsApp”, leia o QR Code pelo aplicativo no celular e aguarde a confirmação nesta tela.</p>
      </div>
      <div className="help-item">
        <h3>Como enviar uma mensagem?</h3>
        <p>Depois de conectar, informe o número com código do país, escreva a mensagem e selecione “Enviar mensagem”.</p>
      </div>
      <div className="help-item">
        <h3>Posso recuperar minha senha pelo painel?</h3>
        <p>O serviço de recuperação ainda não está disponível. Entre em contato com o administrador da conta.</p>
      </div>
    </section>
  );

  const activePageTitle = navigation.find((item) => item.id === activePage)?.label || 'Visão geral';
  const pageContent = {
    dashboard: renderDashboard,
    profile: renderProfile,
    settings: renderSettings,
    help: renderHelp,
  }[activePage]();

  return (
    <div className="app-container">
      {isMobile && sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} aria-label="Menu principal">
        <div className="sidebar-header">
          <div className="logo-mark"><FiMessageSquare aria-hidden="true" /></div>
          <span>WhatsApp Bot</span>
          {isMobile && (
            <button className="icon-button close-sidebar" type="button" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
              <FiX aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="user-profile">
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <div className="user-info">
            <strong>{displayName}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className="sidebar-menu" aria-label="Seções">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`menu-item ${activePage === id ? 'active' : ''}`}
              onClick={() => selectPage(id)}
              aria-current={activePage === id ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="menu-item logout-btn" type="button" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          {isMobile && (
            <button className="icon-button menu-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
              <FiMenu aria-hidden="true" />
            </button>
          )}
          <div>
            <p className="section-eyebrow">Painel</p>
            <h1>{activePageTitle}</h1>
          </div>
          <div className="top-bar-status">
            <span className={`status-dot ${isConnected ? 'active' : ''}`} aria-hidden="true" />
            <span>{isConnected ? 'WhatsApp online' : 'WhatsApp offline'}</span>
          </div>
        </header>

        <div className="content-wrapper">{pageContent}</div>
      </main>
    </div>
  );
}
