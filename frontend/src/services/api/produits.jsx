import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchProduits = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/produits/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return data;
  } catch (error) {
    console.error('Erreur fetchProduits:', error);
    throw error;
  }
};

export const createProduit = async (produitData) => {
  try {
    const { data } = await axios.post(`${API_BASE}/produits/`, produitData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return data;
  } catch (error) {
    console.error('Erreur createProduit:', error);
    throw error;
  }
};