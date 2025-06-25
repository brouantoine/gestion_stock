import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Table, message } from 'antd';
import commandeService from './commandeService';
import StatusBadge from './StatusBadge';

const DetailCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommande = async () => {
      try {
        const data = await commandeService.getCommande(id);
        setCommande(data);
      } catch (error) {
        message.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadCommande();
  }, [id]);

  const columns = [
    {
      title: 'Produit',
      dataIndex: ['produit', 'designation'],
      key: 'produit',
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'prix_unitaire',
      key: 'prix_unitaire',
      render: prix => `${prix} €`,
    },
    {
      title: 'Total HT',
      dataIndex: 'total_ligne_ht',
      key: 'total',
      render: total => `${total.toFixed(2)} €`,
    },
  ];

  if (loading) return <div>Chargement...</div>;
  if (!commande) return <div>Commande introuvable</div>;

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => navigate('/commandes')} style={{ marginBottom: 16 }}>
        Retour
      </Button>

      <Card title={`Commande ${commande.numero}`} loading={loading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Statut">
            <StatusBadge status={commande.statut} />
          </Descriptions.Item>
          <Descriptions.Item label="Fournisseur">
            {commande.nom_fournisseur}
          </Descriptions.Item>
          <Descriptions.Item label="Date création">
            {new Date(commande.date_creation).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total HT">
            {commande.total_ht} €
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>
            {commande.notes || 'Aucune'}
          </Descriptions.Item>
        </Descriptions>

        <h3 style={{ marginTop: 24 }}>Lignes de commande</h3>
        <Table
          columns={columns}
          dataSource={commande.lignes}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DetailCommande;