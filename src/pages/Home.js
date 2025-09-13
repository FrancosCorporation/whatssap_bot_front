import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserData } from '../services/api';
import './Home.css';

function Home() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await fetchUserData();
        setUserData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Se houver erro de autorização, redirecionar para o login
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Painel Principal</h1>
          <button className="logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-card">
          <h2>Bem-vindo, {userData?.name || 'Usuário'}</h2>
          <p>Você está logado com sucesso!</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Estatísticas</h3>
            <p>Seus dados estatísticos aparecerão aqui.</p>
          </div>
          <div className="dashboard-card">
            <h3>Atividade Recente</h3>
            <p>Sua atividade recente aparecerá aqui.</p>
          </div>
          <div className="dashboard-card">
            <h3>Notificações</h3>
            <p>Suas notificações aparecerão aqui.</p>
          </div>
          <div className="dashboard-card">
            <h3>Configurações</h3>
            <p>Suas configurações aparecerão aqui.</p>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Minha Aplicação. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default Home;