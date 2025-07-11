import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Space, message, Tag } from 'antd';
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
        // Normalisation des données avec les nouveaux champs
        const normalizedData = data.map(item => ({
          ...item,
          code_commande: item.code_commande || 'GÉNÉRATION...',
          fournisseur_nom: item.fournisseur?.nom_fournisseur || 'Non spécifié',
          total_ht: item.total_ht || calculateTotal(item), // Calcul du total si non fourni
          type_produit: item.type_produit || 'Non spécifié',
          statut: item.statut || 'INCONNU',
          date_creation: item.date_creation || new Date().toISOString()
        }));
        setCommandes(normalizedData);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        message.error('Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateTotal = (commande) => {
    // Calcul du total HT à partir des lignes si disponible
    if (commande.lignes && commande.lignes.length > 0) {
      return commande.lignes.reduce((sum, ligne) => sum + (ligne.prix_unitaire * ligne.quantite), 0);
    }
    return commande.prix_total || 0;
  };

 const columns = [
  {
    title: 'Code',
    dataIndex: 'code_commande',
    key: 'code',
    width: 120,
    render: code => <Tag color="blue">{code}</Tag>,
    sorter: (a, b) => a.code_commande.localeCompare(b.code_commande),
  },
  {
    title: 'Produit',
    dataIndex: 'type_produit',
    key: 'produit',
    width: 100,
    render: type => type || '-'
  },
  {
    title: 'Fournisseur',
    key: 'fournisseur',
    width: 120,
    render: (_, record) => record.fournisseur_nom,
    sorter: (a, b) => a.fournisseur_nom.localeCompare(b.fournisseur_nom),
  },
  {
    title: 'Statut',
    dataIndex: 'statut',
    key: 'statut',
    width: 100,
    render: statut => <StatusBadge status={statut} />,
    filters: [
      { text: 'Brouillon', value: 'BROUILLON' },
      { text: 'Validée', value: 'VALIDEE' },
      { text: 'Livrée', value: 'LIVREE' },
      { text: 'Annulée', value: 'ANNULEE' },
    ],
    onFilter: (value, record) => record.statut === value,
  },
  {
    title: 'Total HT',
    dataIndex: 'total_ht',
    key: 'total',
    width: 100,
    render: total => `${parseFloat(total).toFixed(2)} €`,
    sorter: (a, b) => parseFloat(a.total_ht) - parseFloat(b.total_ht),
  },
  {
    title: 'Qté',
    dataIndex: 'quantite',
    key: 'qte',
    width: 80,
    render: quantite => quantite
  },
  {
    title: 'Date',
    dataIndex: 'date_creation',
    key: 'date',
    width: 100,
    render: date => new Date(date).toLocaleDateString('fr-FR'),
    sorter: (a, b) => new Date(a.date_creation) - new Date(b.date_creation),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (_, record) => (
      <Space size="small">
        <Button onClick={() => navigate(`/commandes/${record.id}`)}>Détails</Button>
        {record.statut === 'BROUILLON' && (
          <Button 
            type="primary" 
            onClick={() => handleValidate(record.id)}
            loading={loading}
          >
            Valider
          </Button>
        )}
      </Space>
    ),
  },
];

  const handleValidate = async (id) => {
    setLoading(true);
    try {
      await commandeService.validerCommande(id);
      setCommandes(commandes.map(c => 
        c.id === id ? {...c, statut: 'VALIDEE', date_validation: new Date().toISOString()} : c
      ));
      message.success('Commande validée avec succès');
    } catch (error) {
      console.error("Erreur validation:", error);
      message.error('Échec de la validation');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = commandes.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(c.code_commande).toLowerCase().includes(searchLower) ||
      String(c.type_produit).toLowerCase().includes(searchLower) ||
      String(c.fournisseur_nom).toLowerCase().includes(searchLower) ||
      String(c.statut).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="commande-list-container">
      {loading && <Loading fullscreen />}
      
      <Card 
        title="Liste des Commandes"
        bordered={false}
        extra={
          <Space>
            <Input.Search 
              placeholder="Rechercher par code, fournisseur..." 
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              size="middle"
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/commandes/nouveau')}
              size="middle"
            >
              Nouvelle Commande
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} commandes`,
          }}
          locale={{
            emptyText: 'Aucune commande trouvée'
          }}
        />
      </Card>
    </div>
  );
};

export default CommandeList;