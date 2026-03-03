import axios from 'axios';

const API_BASE_URL = 'https://match-backend-jz3n.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep for cookie support (backend sends both)
});

// Request interceptor - Add Bearer token to headers
api.interceptors.request.use(
  async (config) => {
    const { getAuthToken } = await import('./secureStorage');
    const token = await getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Bearer token to request:', config.url);
    } else {
      console.log('⚠️ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - Clearing auth data');
      // Session expired or invalid - clear local auth
      const { clearAuthData } = await import('./secureStorage');
      await clearAuthData();
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
