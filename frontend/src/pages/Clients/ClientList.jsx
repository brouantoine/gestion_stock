import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, message } from 'antd';
import axios from 'axios';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token'); // Assurez-vous que le token est récupéré si nécessaire
      const response = await axios.get('/api/clients/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClients(response.data);
    } catch (error) {
      message.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom_client',
      key: 'nom',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          <div>{record.telephone}</div>
        </div>
      ),
    },
    {
      title: 'Localisation',
      key: 'location',
      render: (_, record) => (
        <div>
          {record.adresse}, {record.code_postal} {record.ville}
        </div>
      ),
    },
    {
      title: 'SIRET',
      dataIndex: 'siret',
      key: 'siret',
      render: (siret) => siret || <Tag color="orange">Non renseigné</Tag>,
    },
    // J'ai supprimé la colonne 'Actions' entièrement
  ];

  // J'ai conservé ces fonctions au cas où elles seraient utilisées ailleurs
  const viewClient = (id) => {
    console.log('Voir client', id);
  };

  const editClient = (id) => {
    console.log('Éditer client', id);
  };

  const deleteClient = async (id) => {
    try {
      await axios.delete(`/api/clients/${id}/`);
      message.success('Client supprimé avec succès');
      fetchClients();
    } catch (error) {
      message.error('Erreur lors de la suppression');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Liste des Clients"
        // J'ai supprimé le bouton "Ajouter un client" dans l'extra
      >
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ClientList;