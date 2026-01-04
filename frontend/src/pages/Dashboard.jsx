import React, { useState, useEffect } from 'react';
import { useStats } from '../hooks/useStats';
import { useAuth } from '../auth/AuthContext';
import StatCard from '../components/StatCard';
import VideoTable from '../components/VideoTable';
import { Play, Clock, Users, Timer, LogOut } from 'lucide-react';
import '../App.css';

export default function Dashboard() {
  const { overview, videos, totalSeconds, averageWatchTime, user } = useStats();
  const { logout } = useAuth();
  const [sessionToken, setSessionToken] = useState('');

  useEffect(() => {
    setSessionToken(localStorage.getItem('session_token'));
  }, []);

  const formatStatsDuration = (s) => {
    const totalSecs = Math.floor(Number(s) || 0);
    if (totalSecs <= 0) return "0s";
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (totalSecs % 60 > 0 || parts.length === 0) parts.push(`${totalSecs % 60}s`);
    return parts.join(" ");
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo-section">
          <div className="logo-box"><Play fill="white" size={24} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>WatchStats</h1>
            <p style={{ margin: 0, color: '#8E8E93', fontSize: '14px' }}>YouTube Analytics</p>
          </div>
        </div>
        <div className="user-profile-nav">
          <div style={{ textAlign: 'right' }}>
            <p className="user-name-text">{user?.name || 'User'}</p>
            <p className="user-status-text">● Connected</p>
          </div>
          <button onClick={logout} className="logout-icon-btn"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard title="Total Videos" value={overview?.total_videos || '0'} icon={Play} />
        <StatCard title="Watch Time" value={formatStatsDuration(totalSeconds)} icon={Clock} />
        <StatCard title="Unique Channels" value={overview?.total_channels || '0'} icon={Users} />
        <StatCard title="Avg Watch Time" value={formatStatsDuration(averageWatchTime)} icon={Timer} />
      </div>

      <h2 className="section-title">Recent History</h2>
      <div className="video-table-container">
        <VideoTable videos={videos} />
      </div>
    </div>
  );
}