import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchUtilisateurs = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/utilisateurs/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return data;
  } catch (error) {
    console.error('Erreur fetchUtilisateurs:', error);
    throw error;
  }
};

export const fetchUtilisateurPerformance = async (userId) => {
  try {
    const { data } = await axios.get(`${API_BASE}/utilisateurs/${userId}/performance/`, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
      }
    });
    return data;
  } catch (error) {
    console.error('Erreur fetchUtilisateurPerformance:', error);
    throw error;
  }
};