// src/services/commandes.js
import api from './api';

export const fetchCommandes = async () => {
  try {
    const response = await api.get('/commandes/');
    return response.data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw new Error(error.response?.data?.detail || 'Erreur de chargement');
  }
};

export const createCommande = async (commandeData) => {
  return await api.post('/commandes/', commandeData);
};