// frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, role?: string) =>
    api.post('/auth/register', { email, password, role }),
};

export const modelsAPI = {
  getAll: () => api.get('/model-definitions'),
  create: (data: any) => api.post('/model-definitions', data),
  getOne: (id: string) => api.get(`/model-definitions/${id}`),
  delete: (id: string) => api.delete(`/model-definitions/${id}`),
};

export const dynamicAPI = {
  create: (modelName: string, data: any) => api.post(`/dynamic/${modelName}`, data),
  getAll: (modelName: string, filters?: any) => 
    api.get(`/dynamic/${modelName}`, { params: filters }),
  getOne: (modelName: string, id: string) => 
    api.get(`/dynamic/${modelName}/${id}`),
  update: (modelName: string, id: string, data: any) =>
    api.put(`/dynamic/${modelName}/${id}`, data),
  delete: (modelName: string, id: string) =>
    api.delete(`/dynamic/${modelName}/${id}`),
};