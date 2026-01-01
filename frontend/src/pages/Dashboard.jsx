import { useAuth } from '../auth/AuthContext';
import { useStats } from '../hooks/useStats';
import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import VideoTable from '../components/VideoTable';
import ChannelChart from '../components/ChannelChart';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { overview, channels, videos, loading, error, refresh } = useStats();
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

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%' 
              }}
            />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              YouTube Watch Stats
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              {user?.name || user?.email}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={refresh}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
          </button>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'start' 
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                Setup Browser Extension
              </h3>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Install extension from <code>chrome://extensions/</code></li>
                <li>
                  Copy your token: 
                  <button onClick={copyToken} style={smallButtonStyle}>
                    Copy Token
                  </button>
                  <button onClick={() => setShowToken(!showToken)} style={smallButtonStyle}>
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </li>
                <li>Paste token in extension popup</li>
                <li>Watch YouTube videos (30+ seconds)</li>
              </ol>
              {showToken && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  border: '1px solid #ddd',
                }}>
                  {sessionToken}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowExtensionHelp(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 10px',
              }}
            >
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h3>Loading your stats...</h3>
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          Error loading stats: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}>
            <StatCard 
              label="Videos Watched"
              value={overview?.total_videos || 0}
            />
            <StatCard 
              label="Total Watch Time"
              value={formatDuration(overview?.total_watch_time_seconds || 0)}
            />
            <StatCard 
              label="Channels"
              value={overview?.total_channels || 0}
            />
            <StatCard 
              label="Avg Video Length"
              value={formatDuration(overview?.avg_video_duration || 0)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <ChannelChart channels={channels} />
          </div>

          <div>
            <h2 style={{ marginBottom: '16px' }}>Recent Videos</h2>
            <VideoTable videos={videos} />
          </div>
        </>
      )}
    </div>
  );
}

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