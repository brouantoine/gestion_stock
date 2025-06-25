import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UtilisateurPerformance = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState(null);
  const [user, setUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]); // State ajouté
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [userResponse, performanceResponse, activityResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/utilisateurs/${userId}/`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('access_token')}` 
            }
          }),
          axios.get(`http://localhost:8000/api/utilisateurs/${userId}/performance/`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('access_token')}` 
            }
          }),
          axios.get(`http://localhost:8000/api/utilisateurs/${userId}/activity/`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('access_token')}` 
            }
          }).catch(() => ({ data: [] }))
        ]);

        setUser(userResponse.data);
        setPerformance(performanceResponse.data);
        setActivityLogs(activityResponse.data);

      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de chargement des données principales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement en cours...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '10px' }}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ 
          marginBottom: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      >
        ← Retour à la liste
      </button>

      {user && (
        <h2 style={{ color: '#333' }}>
          Performance de {user.first_name} {user.last_name}
        </h2>
      )}

      {performance && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0, color: '#444' }}>Résumé</h3>
            <p>Commandes totales: <strong>{performance.commandes_total || 0}</strong></p>
            <p>
              CA HT: <strong>
                {(performance.ca_ht_total || 0).toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} €
              </strong>
            </p>
          </div>

          <h3 style={{ color: '#444', marginTop: '20px' }}>Détail mensuel</h3>
          {performance.commandes_par_mois?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #eee', borderRadius: '4px' }}>
              {performance.commandes_par_mois.map((item, index) => (
                <li 
                  key={index}
                  style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>
                    {new Date(item.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <span>
                    <strong>{item.total_commandes}</strong> commandes • {' '}
                    {item.ca_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} €
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontStyle: 'italic' }}>Aucune donnée disponible</p>
          )}
        </div>
      )}

      {/* Section Activités */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#444' }}>Activités récentes</h3>
        {activityLogs.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #eee', borderRadius: '4px' }}>
            {activityLogs.map((log, index) => (
              <li 
                key={index}
                style={{ 
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                }}
              >
                <div style={{ fontWeight: '500' }}>{log.action || 'Activité'}</div>
                <div style={{ color: '#666', fontSize: '0.9em' }}>
                  {log.timestamp && new Date(log.timestamp).toLocaleString('fr-FR')}
                </div>
                {log.details && <div style={{ marginTop: '5px' }}>{log.details}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontStyle: 'italic' }}>Aucune activité récente</p>
        )}
      </div>
    </div>
  );
};

export default UtilisateurPerformance;