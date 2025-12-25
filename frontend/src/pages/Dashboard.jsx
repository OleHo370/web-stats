import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sessionToken, setSessionToken] = useState(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    setSessionToken(token);
  }, []);

  const copyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    alert('Token copied! Paste it in the extension.');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user?.picture && (
            <img 
              src={user.picture} 
              alt="Profile" 
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
          )}
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {user?.name || user?.email}!</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <h3 style={{ marginTop: 0 }}>Connect Browser Extension</h3>
        <p style={{ color: '#666' }}>
          To automatically track your YouTube watch history, install our browser extension:
        </p>
        
        <ol style={{ color: '#666', lineHeight: '1.8' }}>
          <li>
            <strong>Install Extension:</strong> Go to <code>chrome://extensions/</code> → 
            Enable "Developer mode" → Click "Load unpacked" → 
            Select the <code>extension</code> folder from this project
          </li>
          <li>
            <strong>Copy Your Token:</strong>
            <button
              onClick={copyToken}
              style={{
                marginLeft: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Copy Token
            </button>
            {showToken && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                wordBreak: 'break-all',
              }}>
                {sessionToken}
              </div>
            )}
            <button
              onClick={() => setShowToken(!showToken)}
              style={{
                marginLeft: '10px',
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {showToken ? 'Hide' : 'Show'} Token
            </button>
          </li>
          <li>
            <strong>Start Watching:</strong> Watch any YouTube video for 30+ seconds 
            and it will be automatically tracked!
          </li>
        </ol>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d1ecf1',
          borderLeft: '4px solid #0c5460',
          borderRadius: '4px',
        }}>
        </div>
      </div>

      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <h3>Your Stats Will Appear Here</h3>
        <p style={{ color: '#666' }}>
          Once you start watching YouTube videos with the extension installed, 
          your stats will be displayed here!
        </p>
      </div>
    </div>
  );
}