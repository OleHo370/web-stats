import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function useStats() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    overview: null,
    channels: [],
    videos: [],
    totalSeconds: 0,
    loading: true,
    error: null
  });

  const isMounted = useRef(true);

  const loadStats = useCallback(async (showLoading = false) => {
    if (!user) return;
    try {
      const [ov, ch, vi] = await Promise.all([
        apiClient.get('/stats/overview'),
        apiClient.get('/stats/channels?limit=10'),
        apiClient.get('/stats/videos?limit=250')
      ]);

      if (isMounted.current) {
        const videoList = vi.data || [];
        const total = videoList.reduce((acc, curr) => acc + (curr.watch_time_seconds || 0), 0);
        
        setStatsData({
          overview: ov.data,
          channels: ch.data,
          videos: vi.data,
          totalSeconds: total,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setStatsData(prev => ({ ...prev, loading: false, error: 'Sync Error' }));
      }
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    loadStats(true);
    
    const interval = setInterval(() => loadStats(false), 1000);
    
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [loadStats]);

  return { ...statsData, refresh: () => loadStats(true) };
}