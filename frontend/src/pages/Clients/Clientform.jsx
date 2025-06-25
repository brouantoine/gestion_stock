// src/pages/Clients/ClientForm.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const ClientForm = () => {
  const [client, setClient] = useState({ nom: '', email: '', telephone: '' });
  const navigate = useNavigate();
  const { id } = useParams(); // Pour l'édition

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/clients/${id}/`, client);
      } else {
        await api.post('/clients/', client);
      }
      navigate('/clients');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={client.nom}
        onChange={(e) => setClient({ ...client, nom: e.target.value })}
        placeholder="Nom"
      />
      {/* Ajoute les autres champs ici */}
      <button type="submit">Enregistrer</button>
    </form>
  );
};

export default ClientForm;