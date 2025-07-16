// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // Ajout d'un timeout
});

// Intercepteur pour ajouter le token JWT si nécessaire
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Gérer la déconnexion si token expiré
      localStorage.removeItem('token');
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);
export const commandeService = {
  getCommandes: (params = {}) => api.get('commandes-client/', { params }),
  getCommande: (id) => api.get(`commandes-client/${id}/`),
  createCommande: (data) => api.post('commandes-client/', data),
  updateCommande: (id, data) => api.patch(`commandes-client/${id}/`, data),
  deleteCommande: (id) => api.delete(`commandes-client/${id}/`),
  getLignesCommande: (commandeId) => api.get(`commandes-client/${commandeId}/lignes/`),
  addLigneCommande: (commandeId, data) => api.post(`commandes-client/${commandeId}/lignes/`, data),
  updateLigneCommande: (commandeId, ligneId, data) => api.patch(`commandes-client/${commandeId}/lignes/${ligneId}/`, data),
  deleteLigneCommande: (commandeId, ligneId) => api.delete(`commandes-client/${commandeId}/lignes/${ligneId}/`),
};
export default api;