// frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL  = "https://dataforge-platform.vercel.app";

export const api = axios.create({
  baseURL: API_BASE_URL
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

// API Types
export interface ModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text';
  required: boolean;
  default?: any;
  unique?: boolean;
}

export interface RBACConfig {
  [role: string]: string[];
}

export interface ModelDefinition {
  id: string;
  name: string;
  tableName: string;
  fields: ModelField[];
  ownerField?: string;
  rbac: RBACConfig;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ModelsResponse {
  models: ModelDefinition[];
  groupedByModelName: Record<string, Omit<ModelDefinition, 'name' | 'isActive'>[]>;
  total: number;
  uniqueModelNames: number;
}

export interface CreateModelResponse {
  message: string;
  model: Omit<ModelDefinition, 'isActive'>;
  warning?: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const authAPI = {
  login: (email: string, password: string): Promise<{ data: LoginResponse }> =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, role?: string): Promise<{ data: any }> =>
    api.post('/auth/register', { email, password, role }),
};

export const modelsAPI = {
  getAll: (): Promise<{ data: ModelsResponse }> => 
    api.get('/model-definitions'),
  create: (data: any): Promise<{ data: CreateModelResponse }> => 
    api.post('/model-definitions', data),
  getOne: (id: string): Promise<{ data: ModelDefinition }> => 
    api.get(`/model-definitions/${id}`),
  getByName: (name: string): Promise<{ data: any }> =>
    api.get(`/model-definitions/name/${name}`),
  delete: (id: string): Promise<{ data: any }> => 
    api.delete(`/model-definitions/${id}`),
  deleteByNameAndTable: (modelName: string, tableName: string): Promise<{ data: any }> =>
    api.delete(`/model-definitions/name/${modelName}/table/${tableName}`),
};

export const dynamicAPI = {
  create: (modelName: string, data: any): Promise<{ data: any }> => 
    api.post(`/dynamic/${modelName}`, data),
  getAll: (modelName: string, filters?: any): Promise<{ data: any[] }> => 
    api.get(`/dynamic/${modelName}`, { params: filters }),
  getOne: (modelName: string, id: string): Promise<{ data: any }> => 
    api.get(`/dynamic/${modelName}/${id}`),
  update: (modelName: string, id: string, data: any): Promise<{ data: any }> =>
    api.put(`/dynamic/${modelName}/${id}`, data),
  delete: (modelName: string, id: string): Promise<{ data: any }> =>
    api.delete(`/dynamic/${modelName}/${id}`),
};