import React from 'react';
import { useUIStore } from './store/uiStore';
import PlayPage from './pages/Play/PlayPage';
import LearnPage from './pages/Learn/LearnPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';

export default function App() {
  const { activeTab, setActiveTab } = useUIStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'play': return <PlayPage />;
      case 'learn': return <LearnPage />;
      case 'profile': return <ProfilePage />;
      case 'settings': return <SettingsPage />;
      default: return <PlayPage />;
    }
  };

  const navItemStyle = (tab: string) => ({
    padding: '12px 16px', 
    backgroundColor: activeTab === tab ? '#2c2c35' : 'transparent',
    color: activeTab === tab ? '#fff' : '#888',
    border: 'none',
    textAlign: 'left' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: activeTab === tab ? '600' : '400',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0A0A0B', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ width: '240px', backgroundColor: '#141417', padding: '30px 20px', borderRight: '1px solid #1f1f24' }}>
        <h2 style={{ color: '#fff', marginBottom: '40px', fontFamily: 'Outfit, sans-serif', fontSize: '24px' }}>Web Chess</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab('play')} style={navItemStyle('play')}>Jogar</button>
          <button onClick={() => setActiveTab('learn')} style={navItemStyle('learn')}>Aprender</button>
          <button onClick={() => setActiveTab('profile')} style={navItemStyle('profile')}>Perfil</button>
          <button onClick={() => setActiveTab('settings')} style={navItemStyle('settings')}>Personalizar</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {renderTab()}
      </main>
    </div>
  );
}
