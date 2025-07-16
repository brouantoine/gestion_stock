// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Intercepteur pour le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur pour les erreurs globales
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

// Objet centralisé pour toutes les requêtes
const ApiService = {
  // Commandes
  commandes: {
    getAll: () => api.get('/commandes/'),
    getById: (id) => api.get(`/commandes/${id}/`),
    create: (data) => api.post('/commandes/', data),
    update: (id, data) => api.patch(`/commandes/${id}/`, data),
    delete: (id) => api.delete(`/commandes/${id}/`),
  },

  // Produits
  produits: {
    getAll: () => api.get('/produits/'),
    getById: (id) => api.get(`/produits/${id}/`),
  },

  // Fournisseurs
  fournisseurs: {
    getAll: () => api.get('/fournisseurs/'),
  },

  // Authentification
  auth: {
    login: (credentials) => api.post('/token/', credentials),
    logout: () => {
      localStorage.removeItem('token');
      return Promise.resolve();
    },
    refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  },
};

export default ApiService;