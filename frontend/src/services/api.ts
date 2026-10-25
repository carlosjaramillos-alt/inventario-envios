import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Desactivamos temporalmente el envío de tokens expirados/ficticios para desarrollo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-oWA2xO5-A9M2C8-B3z_N4M1Q') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;