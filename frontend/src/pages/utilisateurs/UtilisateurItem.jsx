import React from 'react';
import { useNavigate } from 'react-router-dom';

const UtilisateurItem = ({ user }) => {
  const navigate = useNavigate();

  // Style de base pour tous les utilisateurs
  const baseStyle = {
    padding: '10px',
    margin: '5px 0',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5'
  };

  // Style conditionnel pour les interactions
  const getItemStyle = (isClickable) => ({
    ...baseStyle,
    cursor: isClickable ? 'pointer' : 'default',
    ':hover': {
      backgroundColor: isClickable ? '#e0e0e0' : '#f5f5f5'
    }
  });

  const isVendeur = user.role === 'vendeur';

  return (
    <li
      style={getItemStyle(isVendeur)}
      onClick={() => isVendeur && navigate(`/utilisateurs/${user.id}/performance`)}
    >
      <span>
        {user.first_name || 'Prénom non renseigné'} {user.last_name || 'Nom non renseigné'}
        <span style={{ marginLeft: '8px', color: '#666' }}>({user.role})</span>
      </span>
      {isVendeur && <span>→</span>}
    </li>
  );
};

export default UtilisateurItem;