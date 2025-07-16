import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, notification, Modal } from 'antd';
import { PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CommandeService } from '../../services/api';

const { confirm } = Modal;

const statusConfig = {
  BROUILLON: { color: 'default', text: 'Brouillon' },
  VALIDEE: { color: 'green', text: 'Validée' },
  LIVREE: { color: 'blue', text: 'Livrée' },
  ANNULEE: { color: 'red', text: 'Annulée' },
};

const CommandesListe = () => {
  const [state, setState] = useState({
    commandes: [],
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 0 },
    filters: {},
    sortField: 'date_creation',
    sortOrder: 'descend',
  });

  const navigate = useNavigate();

  const columns = [
    {
      title: 'Code Commande',
      dataIndex: 'code_commande',
      key: 'code',
      sorter: true,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Fournisseur',
      dataIndex: ['fournisseur', 'nom_fournisseur'],
      key: 'fournisseur',
    },
    {
      title: 'Date',
      dataIndex: 'date_creation',
      key: 'date',
      sorter: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      filters: Object.entries(statusConfig).map(([value, { text }]) => ({
        text,
        value,
      })),
      render: (statut) => (
        <Tag color={statusConfig[statut]?.color || 'default'}>
          {statusConfig[statut]?.text || statut}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'prix_total',
      key: 'total',
      sorter: true,
      render: (text) => `${parseFloat(text || 0).toFixed(2)} €`,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => navigate(`/commandes/${record.id}`)}>
            Détails
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => showDeleteConfirm(record.id)}
          >
            Suppr.
          </Button>
        </Space>
      ),
    },
  ];

  const fetchCommandes = async (params = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { current, pageSize } = state.pagination;
      const { filters, sortField, sortOrder } = state;

      const apiParams = {
        page: params.pagination?.current || current,
        page_size: params.pagination?.pageSize || pageSize,
        ...filters,
        ordering: sortOrder === 'descend' ? `-${sortField}` : sortField,
      };

      const response = await CommandeService.getAll(apiParams);
      
      setState(prev => ({
        ...prev,
        commandes: response.data.results,
        loading: false,
        pagination: {
          ...prev.pagination,
          total: response.data.count,
          current: apiParams.page,
        },
      }));
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error.message || 'Impossible de charger les commandes',
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const sortField = sorter.field || 'date_creation';
    const sortOrder = sorter.order || 'descend';
    
    setState(prev => ({
      ...prev,
      pagination,
      filters,
      sortField,
      sortOrder,
    }));

    fetchCommandes({ pagination, filters, sorter });
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: 'Confirmer la suppression',
      icon: <ExclamationCircleFilled />,
      content: 'Cette action est irréversible. Continuer ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      async onOk() {
        try {
          await CommandeService.delete(id);
          notification.success({ message: 'Commande supprimée' });
          fetchCommandes();
        } catch (error) {
          notification.error({ message: 'Erreur lors de la suppression' });
        }
      },
    });
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  return (
    <Card
      title="Liste des Commandes"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/commandes/nouvelle')}
          >
            Nouvelle Commande
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={state.commandes}
        rowKey="id"
        loading={state.loading}
        pagination={state.pagination}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
        bordered
      />
    </Card>
  );
};

export default CommandesListe;