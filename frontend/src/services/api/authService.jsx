import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, {
      username,
      password
    });
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Récupérer les infos utilisateur
      const userResponse = await axios.get(`${API_URL}/me/`, {
        headers: {
          Authorization: `Bearer ${response.data.access}`
        }
      });
      
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      return userResponse.data;
    }
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Échec de la connexion');
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};