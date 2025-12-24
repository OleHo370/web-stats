import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
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
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <h3>Dashboard</h3>
        <p style={{ color: '#666' }}>
          test test test
        </p>
      </div>
    </div>
  );
}