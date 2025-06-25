import api from '../../services/api';

const commandeService = {
  // Configuration de base
  config: {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  },

  // Méthodes principales
  async getCommandes(params = {}) {
    try {
      const response = await api.get('/commandes/', { 
        params,
        ...this.config 
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erreur lors de la récupération des commandes');
      throw error;
    }
  },

  async getCommande(id) {
    try {
      const response = await api.get(`/commandes/${id}/`, this.config);
      return response.data;
    } catch (error) {
      this.handleError(error, `Erreur lors de la récupération de la commande ${id}`);
      throw error;
    }
  },

  async createCommande(data) {
    try {
      const response = await api.post('/commandes/', data, this.config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erreur lors de la création de la commande');
      throw error;
    }
  },

  async updateCommande(id, data) {
    try {
      const response = await api.patch(`/commandes/${id}/`, data, this.config);
      return response.data;
    } catch (error) {
      this.handleError(error, `Erreur lors de la mise à jour de la commande ${id}`);
      throw error;
    }
  },

  async deleteCommande(id) {
    try {
      await api.delete(`/commandes/${id}/`, this.config);
    } catch (error) {
      this.handleError(error, `Erreur lors de la suppression de la commande ${id}`);
      throw error;
    }
  },

  // Actions spécifiques
  async validerCommande(id) {
    try {
      const response = await api.post(
        `/commandes/${id}/valider/`, 
        {}, 
        this.config
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Erreur lors de la validation de la commande ${id}`);
      throw error;
    }
  },

  // Gestion des lignes
  async getLignes(commandeId) {
    try {
      const response = await api.get(
        `/commandes/${commandeId}/lignes/`, 
        this.config
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Erreur lors de la récupération des lignes`);
      throw error;
    }
  },

  async addLigne(commandeId, data) {
    try {
      const response = await api.post(
        `/commandes/${commandeId}/lignes/`, 
        data, 
        this.config
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erreur lors de l\'ajout de la ligne');
      throw error;
    }
  },

  // Statistiques
  async getStats() {
    try {
      const response = await api.get('/commandes/stats/', this.config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erreur lors de la récupération des statistiques');
      throw error;
    }
  },

  // Gestion centralisée des erreurs
  handleError(error, defaultMessage) {
    const errorData = error.response?.data;
    const errorMessage = errorData?.detail || 
                        errorData?.message || 
                        defaultMessage;
    
    console.error(`${errorMessage}:`, error);
    return errorMessage;
  }
};

export default commandeService;