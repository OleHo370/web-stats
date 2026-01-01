import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChannelChart({ channels }) {
  if (!channels || channels.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666',
        backgroundColor: 'white',
        borderRadius: '12px',
      }}>
        No channel data yet
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Top Channels</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={channels}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="channel_title" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="video_count" fill="#FF0000" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}