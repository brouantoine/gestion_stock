import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UtilisateurList = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Charger les données utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Token non trouvé');
        
        const [meRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/me/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/utilisateurs/', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCurrentUser(meRes.data);
        setUsers(usersRes.data.map(user => ({
          ...user,
          first_name: user.first_name || '',
          last_name: user.last_name || ''
        })));
      } catch (error) {
        console.error('Erreur:', error);
        setError(error.response?.data?.detail || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gestion du changement de rôle
  const handleRoleChange = (userId, newRole) => {
    setPendingUpdates(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  // Sauvegarde des modifications
  const saveUpdates = async () => {
    if (!currentUser?.is_superuser || Object.keys(pendingUpdates).length === 0) return;

    setSaveLoading(true);
    try {
      await Promise.all(
        Object.entries(pendingUpdates).map(([userId, newRole]) =>
          axios.patch(
            `http://localhost:8000/api/utilisateurs/${userId}/update-role/`,
            { role: newRole },
            { 
              headers: { 
                Authorization: `Bearer ${localStorage.getItem('access_token')}` 
              }
            }
          )
        )
      );
      
      // Mise à jour de l'état local
      setUsers(users.map(user => 
        pendingUpdates[user.id] ? { ...user, role: pendingUpdates[user.id] } : user
      ));
      setPendingUpdates({});
    } catch (error) {
      console.error('Échec de la mise à jour:', error);
      setError("Erreur lors de la sauvegarde des modifications");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  
  if (error) return (
    <div className="error-container">
      <h3>Erreur</h3>
      <p>{error}</p>
      {error.includes('authentification') && (
        <button 
          className="login-btn"
          onClick={() => window.location.href='/login'}
        >
          Se connecter
        </button>
      )}
    </div>
  );

  return (
    <div className="user-list-container">
      <div className="header-container">
        <h1>Liste des Utilisateurs {currentUser?.is_superuser && "(Admin)"}</h1>
        {Object.keys(pendingUpdates).length > 0 && (
          <button 
            onClick={saveUpdates}
            disabled={saveLoading}
            className="save-btn"
          >
            {saveLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        )}
      </div>
      
      <table className="user-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={pendingUpdates[user.id] || user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={!currentUser?.is_superuser}
                  className="role-select"
                >
                  <option value="admin">Admin</option>
                  <option value="gestionnaire">Gestionnaire</option>
                  <option value="vendeur">Vendeur</option>
                  <option value="caissier">Caissier</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .user-list-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .user-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .user-table th, .user-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .user-table th {
          background-color: #f5f5f5;
        }
        
        .role-select {
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #d9d9d9;
        }
        
        .save-btn {
          padding: 8px 16px;
          background-color: #1890ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .save-btn:hover {
          background-color: #40a9ff;
        }
        
        .save-btn:disabled {
          background-color: #d9d9d9;
          cursor: not-allowed;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          font-size: 18px;
        }
        
        .error-container {
          color: #ff4d4f;
          padding: 20px;
          border: 1px solid #ffa39e;
          border-radius: 4px;
          background-color: #fff1f0;
          margin: 20px;
        }
        
        .login-btn {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: #ff4d4f;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default UtilisateurList;