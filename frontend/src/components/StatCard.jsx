export default function StatCard({ icon, label, value, subtitle }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666',
          marginBottom: '8px',
        }}>
          {label}
        </div>
        <div style={{ 
          fontSize: '32px', 
          fontWeight: 'bold',
          color: '#333',
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ 
            fontSize: '12px', 
            color: '#999',
            marginTop: '4px',
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}