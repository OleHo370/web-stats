import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="stat-card">
      <div style={{ background: '#2D1616', padding: '10px', borderRadius: '12px', color: '#FF4D4D', display: 'inline-flex', marginBottom: '20px' }}>
        <Icon size={22} />
      </div>
      <div className="card-body">
        <p style={{ color: '#8E8E93', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{title}</p>
        <h2 style={{ fontSize: '32px', margin: '4px 0', fontWeight: '700' }}>{value}</h2>
        <p style={{ color: '#505054', fontSize: '11px', margin: 0 }}>{subtext}</p>
      </div>
    </div>
  );
};

export default StatCard;