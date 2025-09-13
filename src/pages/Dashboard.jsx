import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

// Icons import
import { 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiMessageSquare, 
  FiAlertCircle, 
  FiCheckCircle,
  FiMenu,
  FiX,
  FiActivity,
  FiUsers,
  FiHelpCircle,
  FiBarChart2
} from 'react-icons/fi';

const apiUrl = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('Carregando...');
  const [isActive, setIsActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState({
    name: 'Usuário',
    email: 'usuario@exemplo.com',
    avatar: 'https://via.placeholder.com/150'
  });
  
  const navigate = useNavigate();

  // Check screen size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para obter o token do localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Função para iniciar a sessão do WhatsApp
  const startWhatsAppSession = async () => {
    setIsActive(true);
    const token = getAuthToken();
    
    if (!token) {
      setStatus('Erro: Token não encontrado');
      navigate('/login');
      return;
    }
    
    try {
      setStatus('Iniciando sessão...');
      const response = await axios.post(`${apiUrl}/api/whatsapp/start`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 200) {
        setQrCode(response.data.qr);
        setStatus('Escaneie o QR Code com seu WhatsApp');
        pollAuthStatus(token);
      }
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      setStatus('Erro na conexão com o servidor');
      setIsActive(false);
    }
  };

  // Função para parar a sessão do WhatsApp
  const stopWhatsAppSession = async () => {
    const token = getAuthToken();
    
    if (!token) {
      setStatus('Erro: Token não encontrado');
      navigate('/login');
      return;
    }
    
    try {
      setStatus('Desconectando...');
      const response = await axios.post(`${apiUrl}/api/whatsapp/stop`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 200) {
        setQrCode(null);
        setStatus('Bot WhatsApp desativado');
        setIsActive(false);
      }
    } catch (error) {
      console.error('Erro ao parar sessão:', error);
      setStatus('Erro ao desconectar o bot');
    }
  };

  // Função para verificar o status de autenticação
  const pollAuthStatus = (token) => {
    setTimeout(() => {
      axios.get(`${apiUrl}/api/check-session-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.data.authenticated) {
            setQrCode(null);
            setStatus('Bot WhatsApp ativo e conectado');
          } else {
            pollAuthStatus(token);
          }
        })
        .catch((error) => {
          console.error('Erro ao verificar status:', error);
          setStatus('Erro ao verificar status de conexão');
        });
    }, 3000);
  };

  // Buscar informações do usuário
  const fetchUserInfo = async () => {
    const token = getAuthToken();
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await axios.get(`${apiUrl}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 200) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    
    // Verifica se o bot já está ativo ao carregar a página
    const checkBotStatus = async () => {
      const token = getAuthToken();
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await axios.get(`${apiUrl}/api/whatsapp/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 200) {
          setIsActive(response.data.active);
          if (response.data.active) {
            setStatus('Bot WhatsApp ativo e conectado');
          } else {
            setStatus('Bot WhatsApp desativado');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do bot:', error);
        setStatus('Erro ao verificar status do bot');
      }
    };
    
    checkBotStatus();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Render the active page content
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="status-card">
              <h2>Status do Bot</h2>
              <div className="status-indicator">
                <div className={`status-dot ${isActive ? 'active' : 'inactive'}`}></div>
                <span>{status}</span>
              </div>
              
              <div className="toggle-container">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={() => isActive ? stopWhatsAppSession() : startWhatsAppSession()}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span>{isActive ? 'Desativar Bot' : 'Ativar Bot'}</span>
              </div>
            </div>
            
            {qrCode && (
              <div className="qrcode-container">
                <h2>Escaneie o QR Code</h2>
                <div className="qrcode">
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
                </div>
                <p>Use o aplicativo WhatsApp em seu celular para escanear este código</p>
              </div>
            )}
            
            <div className="stats-container">
              <div className="stat-card">
                <FiMessageSquare className="stat-icon" />
                <div className="stat-info">
                  <h3>Mensagens</h3>
                  <p>1,234</p>
                </div>
              </div>
              
              <div className="stat-card">
                <FiUsers className="stat-icon" />
                <div className="stat-info">
                  <h3>Contatos</h3>
                  <p>85</p>
                </div>
              </div>
              
              <div className="stat-card">
                <FiActivity className="stat-icon" />
                <div className="stat-info">
                  <h3>Tempo Ativo</h3>
                  <p>3h 45m</p>
                </div>
              </div>
              
              <div className="stat-card">
                <FiBarChart2 className="stat-icon" />
                <div className="stat-info">
                  <h3>Respostas</h3>
                  <p>957</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="profile-content">
            <h2>Perfil do Usuário</h2>
            <div className="profile-card">
              <div className="profile-header">
                <img src={user.avatar} alt="Avatar" className="profile-avatar" />
                <div className="profile-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Nome:</span>
                  <span className="detail-value">{user.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone:</span>
                  <span className="detail-value">{user.phone || 'Não informado'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data de registro:</span>
                  <span className="detail-value">{user.createdAt || '01/01/2024'}</span>
                </div>
              </div>
              <div className="profile-actions">
                <button className="btn edit-btn">Editar Perfil</button>
                <button className="btn password-btn">Alterar Senha</button>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="settings-content">
            <h2>Configurações</h2>
            <div className="settings-card">
              <h3>Configurações do Bot</h3>
              <div className="setting-item">
                <div className="setting-label">
                  <span>Mensagem de boas-vindas</span>
                  <p className="setting-description">Mensagem enviada automaticamente para novos contatos</p>
                </div>
                <div className="setting-control">
                  <textarea rows="3" placeholder="Olá! Sou um bot automatizado. Como posso ajudá-lo hoje?"></textarea>
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Resposta automática</span>
                  <p className="setting-description">Responder automaticamente a mensagens quando estiver offline</p>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch small">
                    <input type="checkbox" checked={true} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Notificações por e-mail</span>
                  <p className="setting-description">Receber e-mails quando houver novas mensagens</p>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch small">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <h3>Configurações da Conta</h3>
              <div className="setting-item">
                <div className="setting-label">
                  <span>Tema escuro</span>
                  <p className="setting-description">Mudar para o tema escuro</p>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch small">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Idioma</span>
                  <p className="setting-description">Selecione o idioma da interface</p>
                </div>
                <div className="setting-control">
                  <select>
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">Inglês (EUA)</option>
                    <option value="es">Espanhol</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn save-btn">Salvar Alterações</button>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="help-content">
            <h2>Ajuda e Suporte</h2>
            <div className="help-card">
              <h3>Perguntas Frequentes</h3>
              <div className="faq-item">
                <h4>Como conectar o WhatsApp Bot?</h4>
                <p>Clique no botão "Ativar Bot" na dashboard e escaneie o QR Code com seu aplicativo WhatsApp.</p>
              </div>
              <div className="faq-item">
                <h4>Como personalizar as respostas automáticas?</h4>
                <p>Acesse a seção "Configurações" e edite os campos de respostas automáticas conforme necessário.</p>
              </div>
              <div className="faq-item">
                <h4>Por quanto tempo o bot permanece conectado?</h4>
                <p>O bot permanecerá conectado até que você o desative manualmente ou ocorra uma desconexão do servidor WhatsApp.</p>
              </div>
              <div className="faq-item">
                <h4>Como adicionar novas respostas automáticas?</h4>
                <p>Em "Configurações", você pode adicionar novas palavras-chave e suas respectivas respostas.</p>
              </div>
              
              <h3>Contato</h3>
              <p>Se você precisar de mais ajuda, entre em contato conosco:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> suporte@whatsappbot.com</p>
                <p><strong>Telefone:</strong> (11) 1234-5678</p>
              </div>
              
              <button className="btn support-btn">Abrir Ticket de Suporte</button>
            </div>
          </div>
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FiMessageSquare />
            <span>WhatsApp Bot</span>
          </div>
          {isMobile && (
            <button className="close-sidebar" onClick={toggleSidebar}>
              <FiX />
            </button>
          )}
        </div>
        
        <div className="user-profile">
          <img src={user.avatar} alt="Avatar do usuário" className="user-avatar" />
          <div className="user-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <FiActivity />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`menu-item ${activePage === 'profile' ? 'active' : ''}`}
            onClick={() => setActivePage('profile')}
          >
            <FiUser />
            <span>Perfil</span>
          </button>
          
          <button 
            className={`menu-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
          >
            <FiSettings />
            <span>Configurações</span>
          </button>
          
          <button 
            className={`menu-item ${activePage === 'help' ? 'active' : ''}`}
            onClick={() => setActivePage('help')}
          >
            <FiHelpCircle />
            <span>Ajuda</span>
          </button>
        </div>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          {isMobile && (
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FiMenu />
            </button>
          )}
          <h1>{activePage === 'dashboard' ? 'Dashboard' : 
               activePage === 'profile' ? 'Perfil do Usuário' : 
               activePage === 'settings' ? 'Configurações' : 
               activePage === 'help' ? 'Ajuda e Suporte' : 'WhatsApp Bot'}</h1>
          <div className="top-bar-actions">
            <div className="status-badge">
              <span className={`status-indicator ${isActive ? 'active' : 'inactive'}`}></span>
              <span>{isActive ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        
        <div className="content-wrapper">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;