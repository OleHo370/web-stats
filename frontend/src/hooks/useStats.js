import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function useStats() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    overview: null,
    channels: [],
    videos: [],
    loading: true,
    error: null
  });

  const isMounted = useRef(true);

  const loadStats = useCallback(async (showLoading = false) => {
    if (!user) return;

    if (showLoading) {
      setStatsData(prev => ({ ...prev, loading: true }));
    }
    
    try {
      const [ov, ch, vi] = await Promise.all([
        apiClient.get('/stats/overview'),
        apiClient.get('/stats/channels?limit=10'),
        apiClient.get('/stats/videos?limit=50')
      ]);

      if (isMounted.current) {
        setStatsData({
          overview: ov.data,
          channels: ch.data,
          videos: vi.data,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      console.error('Stats loading error:', err);
      if (isMounted.current) {
        setStatsData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to fetch updated data' 
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;

    loadStats(true);

    const refreshInterval = setInterval(() => {
      loadStats(false);
    }, 2000);

    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
    };
  }, [loadStats]);

  return { 
    ...statsData, 
    refresh: () => loadStats(true) 
  };
}