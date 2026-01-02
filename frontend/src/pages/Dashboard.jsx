import { useAuth } from '../auth/AuthContext';
import { useStats } from '../hooks/useStats';
import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import VideoTable from '../components/VideoTable';
import ChannelChart from '../components/ChannelChart';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const { overview, channels, videos, averageWatchTime, totalSeconds, loading, error, refresh } = useStats();
  
  const [sessionToken, setSessionToken] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [showExtensionHelp, setShowExtensionHelp] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    setSessionToken(token);
  }, []);

  const copyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    alert('Token copied! Paste it in the extension.');
  };

  const formatDuration = (secondsInput) => {
    if (secondsInput === null || secondsInput === undefined || secondsInput <= 0) {
      return "0s";
    }

    const totalSecs = Math.floor(secondsInput);
    const d = Math.floor(totalSecs / (24 * 3600));
    const h = Math.floor((totalSecs % (24 * 3600)) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh' 
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user?.picture && (
            <img 
              src={user.picture} 
              alt="Profile" 
              style={{ width: '60px', height: '60px', borderRadius: '50%' }}
            />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>YouTube Watch Stats</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>{user?.name || user?.email}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={refresh} style={{ ...buttonStyle, backgroundColor: '#007bff' }}>
          </button>
          <button onClick={logout} style={{ ...buttonStyle, backgroundColor: '#dc3545' }}>
            Logout
          </button>
        </div>
      </div>

      {showExtensionHelp && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Setup Browser Extension</h3>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Install extension in Chrome Developer Mode</li>
                <li>
                  Copy token: 
                  <button onClick={copyToken} style={smallButtonStyle}>Copy</button>
                  <button onClick={() => setShowToken(!showToken)} style={smallButtonStyle}>
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </li>
                <li>Watch any video for 5s+ to start tracking</li>
              </ol>
              {showToken && (
                <div style={tokenBoxStyle}>{sessionToken}</div>
              )}
            </div>
            <button onClick={() => setShowExtensionHelp(false)} style={closeButtonStyle}>×</button>
          </div>
        </div>
      )}

      {loading && !overview && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h3>Syncing live data...</h3>
        </div>
      )}

      {error && (
        <div style={errorStyle}>Error: {error}</div>
      )}

      {!error && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}>
            <StatCard 
              label="Unique Videos"
              value={overview?.total_videos || 0}
            />
            <StatCard 
              label="Total Watch Time"
              value={formatDuration(totalSeconds)} 
            />
            <StatCard 
              label="Unique Channels"
              value={overview?.total_channels || 0}
            />
            <StatCard 
              label="Average Watch Time"
              value={formatDuration(averageWatchTime)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <ChannelChart channels={channels} />
          </div>

          <div>
            <h2 style={{ marginBottom: '16px' }}>Recent Video Sessions</h2>
            <VideoTable videos={videos} />
          </div>
        </>
      )}
    </div>
  );
}


const buttonStyle = {
  padding: '10px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
};

const smallButtonStyle = {
  marginLeft: '10px',
  padding: '6px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
};

const tokenBoxStyle = {
  marginTop: '12px',
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '11px',
  wordBreak: 'break-all',
  border: '1px solid #ddd',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '0 10px',
};

const errorStyle = {
  padding: '20px',
  backgroundColor: '#f8d7da',
  color: '#721c24',
  borderRadius: '8px',
  marginBottom: '24px',
};