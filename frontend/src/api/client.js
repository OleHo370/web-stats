import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (idToken, accessToken) => {
    const response = await apiClient.post('/auth/login', {
      id_token: idToken,
      access_token: accessToken,
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('session_token');
    return response.data;
  },
};

export const stats = {
  getOverview: async () => {
    const response = await apiClient.get('/stats/overview');
    return response.data;
  },
};

export const ingest = {
  syncHistory: async () => {
    const response = await apiClient.post('/ingest/history');
    return response.data;
  },
};

export default apiClient;