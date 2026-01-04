import React from 'react';

export default function VideoTable({ videos }) {
  const formatDuration = (seconds) => {
    const totalSecs = Math.floor(Number(seconds) || 0);
    if (totalSecs <= 0) return "0:00";
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { time: '--:--', date: '---' };
    const d = new Date(dateString);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString()
    };
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Thumbnail</th>
          <th>Video Title</th>
          <th>Channel</th>
          <th>Watch Time</th>
          <th>Watched At</th>
        </tr>
      </thead>
      <tbody>
        {videos?.length > 0 ? (
          videos.map((video, idx) => {
            const dt = formatDateTime(video.watched_at);
            const watchTime = video.watch_time_seconds || 0;
            const totalDuration = video.duration_seconds || 0;
            const videoId = video.video_id || video.id;

            return (
              <tr key={`${videoId}-${idx}`}>
                <td>
                  <img src={video.thumbnail_url} className="thumbnail-img" alt="thumb" />
                </td>
                <td style={{ fontWeight: '600', maxWidth: '350px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={video.title}>
                    <a 
                      href={`https://www.youtube.com/watch?v=${videoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {video.title}
                    </a>
                  </div>
                </td>
                <td style={{ color: '#FF4D4D', fontWeight: '500' }}>{video.channel_title}</td>
                <td>
                  <div style={{ fontWeight: '600' }}>{formatDuration(watchTime)}</div>
                  <div style={{ fontSize: '11px', color: '#8E8E93' }}>
                    of {formatDuration(totalDuration)}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600' }}>{dt.time}</div>
                  <div style={{ fontSize: '11px', color: '#8E8E93' }}>{dt.date}</div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No history found.</td></tr>
        )}
      </tbody>
    </table>
  );
}