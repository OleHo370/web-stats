export default function VideoTable({ videos }) {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

  if (!videos || videos.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666' 
      }}>
        No videos watched yet. Start watching YouTube with the extension installed!
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <div style={{ 
        overflowX: 'auto',
        maxHeight: '600px',
      }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead style={{
            backgroundColor: '#f8f9fa',
            position: 'sticky',
            top: 0,
          }}>
            <tr>
              <th style={headerStyle}>Thumbnail</th>
              <th style={headerStyle}>Title</th>
              <th style={headerStyle}>Channel</th>
              <th style={headerStyle}>Watch Time</th>
              <th style={headerStyle}>Watched</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, index) => (
              <tr key={`${video.id}-${video.watched_at}-${index}`} style={{
                borderBottom: '1px solid #eee',
              }}>
                <td style={cellStyle}>
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      style={{
                        width: '120px',
                        height: '68px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '68px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                    }} />
                  )}
                </td>
                <td style={cellStyle}>
                  <a 
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#333',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                  >
                    {video.title}
                  </a>
                </td>
                <td style={cellStyle}>{video.channel_title}</td>
                <td style={cellStyle}>
                  <strong>{formatDuration(video.watch_time_seconds)}</strong>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    of {formatDuration(video.duration_seconds)}
                  </div>
                </td>
                <td style={cellStyle}>{formatDate(video.watched_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '16px',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: '600',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const cellStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#333',
};