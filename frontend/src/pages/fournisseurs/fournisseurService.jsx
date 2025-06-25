import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// 1. Créez d'abord l'objet complet
const fournisseurService = {
  getFournisseurs() {
    return axios.get(`${API_URL}/fournisseurs/`)
      .then(res => res.data)
      .catch(error => {
        console.error("Erreur API:", error);
        throw error;
      });
  },

  getFournisseur(id) {
    return axios.get(`${API_URL}/fournisseurs/${id}/`)
      .then(res => res.data);
  },

  createFournisseur(data) {
    return axios.post(`${API_URL}/fournisseurs/`, data);
  },

  updateFournisseur(id, data) {
    return axios.patch(`${API_URL}/fournisseurs/${id}/`, data);
  },

  deleteFournisseur(id) {
    return axios.delete(`${API_URL}/fournisseurs/${id}/`);
  }
};

// 2. Exportez l'objet comme valeur par défaut
export default fournisseurService;