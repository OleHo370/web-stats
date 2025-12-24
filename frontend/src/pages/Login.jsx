import GoogleLoginButton from '../auth/GoogleLogin';

export default function Login() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
          YouTube Watch Stats
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          test test test jskdfdklsjd
        </p>
        
        <GoogleLoginButton />
        
        <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>By signing in, you allow us to:</p>
          <ul style={{ textAlign: 'left', marginTop: '10px' }}>
            <li>Access your YouTube watch history</li>
            <li>View video metadata</li>
            <li>Generate viewing statistics</li>
          </ul>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Test test test
          </p>
        </div>
      </div>
    </div>
  );
}