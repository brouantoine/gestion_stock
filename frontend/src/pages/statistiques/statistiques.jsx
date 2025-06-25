import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/StatistiquesCommandes.css';
import TypeSelector from '../ventes/TypeSelector';

const StatistiquesBoite = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [transactionType, setTransactionType] = useState('TOUS');
  const [startDate, endDate] = dateRange;

  const safeToLocaleString = (value) => {
    if (value === undefined || value === null) return '0';
    try {
      return Number(value).toLocaleString('fr-FR');
    } catch {
      return '0';
    }
  };

  const filterCommandes = useCallback((commandes) => {
    let filtered = commandes || [];
    
    // Filtre par période
    if (startDate && endDate) {
      filtered = filtered.filter(cmd => {
        const cmdDate = new Date(cmd.date);
        return cmdDate >= new Date(startDate) && cmdDate <= new Date(endDate);
      });
    }
    
    // Filtre par type de transaction
    if (transactionType === 'VENTE_DIRECTE') {
      filtered = filtered.filter(cmd => cmd.is_vente_directe);
    } else if (transactionType === 'COMMANDE') {
      filtered = filtered.filter(cmd => !cmd.is_vente_directe);
    }
    
    return filtered;
  }, [startDate, endDate, transactionType]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('/api/statistiques-commandes/');
      if (response.data.success) {
        setData({
          ...response.data.data,
          filteredDetails: filterCommandes(response.data.data.details)
        });
      } else {
        throw new Error(response.data.message || 'Structure de données incorrecte');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCommandes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.details) {
      setData(prev => ({
        ...prev,
        filteredDetails: filterCommandes(prev.details)
      }));
    }
  }, [startDate, endDate, transactionType, filterCommandes, data?.details]);

  if (loading) return <div className="loading">Chargement des statistiques...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data) return <div className="error">Aucune donnée disponible</div>;

  // Calcul des statistiques filtrées
  const filteredStats = {
    total_commandes: data.filteredDetails?.length || 0,
    vente_directe: data.filteredDetails?.filter(cmd => cmd.is_vente_directe).length || 0,
    commande_client: data.filteredDetails?.filter(cmd => !cmd.is_vente_directe).length || 0,
    chiffre_affaires: data.filteredDetails?.reduce((sum, cmd) => sum + (cmd.total_ttc || 0), 0) || 0,
    chiffre_affaires_vente_directe: data.filteredDetails
      ?.filter(cmd => cmd.is_vente_directe)
      ?.reduce((sum, cmd) => sum + (cmd.total_ttc || 0), 0) || 0,
    chiffre_affaires_commande: data.filteredDetails
      ?.filter(cmd => !cmd.is_vente_directe)
      ?.reduce((sum, cmd) => sum + (cmd.total_ttc || 0), 0) || 0
  };

  return (
    <div className="statistiques-container">
      <h1>Statistiques des Commandes Clients</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Type de transaction :</label>
          <TypeSelector 
            transactionType={transactionType} 
            setTransactionType={setTransactionType}
            includeAllOption
          />
        </div>

        <div className="filter-group">
          <label>Période :</label>
          <div className="date-range">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setDateRange([e.target.value, endDate])}
            />
            <span>au</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setDateRange([startDate, e.target.value])}
            />
          </div>
        </div>
      </div>

      <div className="stats-results">
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Total Transactions</h3>
            <p>{filteredStats.total_commandes}</p>
            <small>{safeToLocaleString(filteredStats.chiffre_affaires)} F</small>
          </div>
          
          <div className="stat-card">
            <h3>Ventes Directes</h3>
            <p>{filteredStats.vente_directe}</p>
            <small>{safeToLocaleString(filteredStats.chiffre_affaires_vente_directe)} F</small>
          </div>
          
          <div className="stat-card">
            <h3>Commandes Clients</h3>
            <p>{filteredStats.commande_client}</p>
            <small>{safeToLocaleString(filteredStats.chiffre_affaires_commande)} F</small>
          </div>
        </div>

        <div className="transactions-list">
          <h2>Détail des transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Client</th>
                <th>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              {data.filteredDetails?.map(cmd => (
                <tr key={cmd.id}>
                  <td>{cmd.date}</td>
                  <td>{cmd.is_vente_directe ? 'Vente Directe' : 'Commande'}</td>
                  <td>{cmd.client}</td>
                  <td>{safeToLocaleString(cmd.total_ttc)} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatistiquesBoite;