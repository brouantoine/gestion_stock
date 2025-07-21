import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommandesList.css';
import ApiService from '../../services/api';

const CommandesList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await ApiService.commandes.getAll({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCommandes(response.data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des commandes');
      console.error('Erreur API:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchCommandes();
}, []);

  const handleRowClick = (commandeId) => {
    navigate(`/commandes/${commandeId}`);
  };

  if (loading) return <div className="loading-state">Chargement en cours...</div>;
  if (error) return <div className="error-state">Erreur : {error}</div>;

  return (
    <div className="commandes-container">
      <h1 className="commandes-header">Liste des Commandes</h1>
      
      <div className="commandes-table-container">
        <table className="commandes-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Fournisseur</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((commande) => (
              <tr 
                key={commande.id} 
                onClick={() => handleRowClick(commande.id)}
              >
                <td>{commande.code_commande}</td>
                <td>{commande.fournisseur?.nom_fournisseur || 'N/A'}</td>
                <td>{new Date(commande.date_creation).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${
                    commande.statut === 'VALIDEE' 
                      ? 'status-valid' 
                      : commande.statut === 'ANNULEE' 
                        ? 'status-cancel' 
                        : 'status-pending'
                  }`}>
                    {commande.statut}
                  </span>
                </td>
                <td>{commande.prix_total} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommandesList;