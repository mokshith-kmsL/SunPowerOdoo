// api.js — one place to handle all API calls
// Every request automatically includes the JWT token from localStorage.

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Before every request, attach the token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If any response comes back as 401, the token is expired — force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload(); // send back to login
    }
    return Promise.reject(error);
  }
);

export default api;
