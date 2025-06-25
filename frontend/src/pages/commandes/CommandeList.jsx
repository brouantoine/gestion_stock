import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StatusBadge from './StatusBadge';
import commandeService from './commandeService';
import Loading from '../../components/Loading';

const CommandeList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await commandeService.getCommandes();
        setCommandes(data);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const columns = [
    {
      title: 'Numéro',
      dataIndex: 'numero',
      key: 'numero',
    },
    {
      title: 'Fournisseur',
      key: 'fournisseur',
      render: (_, record) => record.nom_fournisseur || 'Non spécifié',
      sorter: (a, b) => (a.fournisseurzz?.nom_fournisseur || '').localeCompare(b.fournisseur?.nom_fournisseur || ''),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: statut => <StatusBadge status={statut} />,
    },
    {
      title: 'Total HT',
      dataIndex: 'total_ht',
      key: 'total_ht',
      render: total => `${total} €`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => navigate(`/commandes/${record.id}`)}>Détails</Button>
          {record.statut === 'BROUILLON' && (
            <Button type="primary" onClick={() => handleValidate(record.id)}>
              Valider
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = commandes.filter(c => 
    c.numero.includes(searchTerm) || 
    (c.fournisseur?.nom_fournisseur || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleValidate(id) {
    try {
      await commandeService.validerCommande(id);
      setCommandes(commandes.map(c => 
        c.id === id ? {...c, statut: 'VALIDEE'} : c
      ));
    } catch (error) {
      console.error("Erreur validation:", error);
    }
  }

  return (
    <>
      {loading && <Loading />}
      
      <Card 
        title="Commandes"
        extra={
          <>
            <Input.Search 
              placeholder="Recherche..." 
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200, marginRight: 10 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/commandes/nouveau')}
            >
              Nouvelle
            </Button>
          </>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>
    </>
  );
};

export default CommandeList;