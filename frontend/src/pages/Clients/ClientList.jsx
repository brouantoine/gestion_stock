import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients/');
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
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} onClick={() => viewClient(record.id)} />
          <Button icon={<EditOutlined />} onClick={() => editClient(record.id)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => deleteClient(record.id)} />
        </Space>
      ),
    },
  ];

  const viewClient = (id) => {
    // Implémentez la navigation vers la vue détaillée
    console.log('Voir client', id);
  };

  const editClient = (id) => {
    // Implémentez l'édition
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
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Ajouter un client
          </Button>
        }
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