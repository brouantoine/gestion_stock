import React, { useState, useEffect } from 'react';
import { Steps, Form, Input, Button, Select, Table, Space, Divider, notification } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Step } = Steps;
const { Option } = Select;

const NouvelleCommande = () => {
  const [current, setCurrent] = useState(0);
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [lignesCommande, setLignesCommande] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [produitsRes, fournisseursRes] = await Promise.all([
          api.get('/produits/'),
          api.get('/fournisseurs/')
        ]);
        setProduits(produitsRes.data);
        setFournisseurs(fournisseursRes.data);
      } catch (error) {
        notification.error({ message: 'Erreur lors du chargement des données' });
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Produit',
      dataIndex: 'produit',
      key: 'produit',
      render: (_, record) => record.produit.designation,
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
    },
    {
      title: 'Prix Unitaire',
      dataIndex: 'prix_unitaire',
      key: 'prix_unitaire',
      render: (text) => `${text} €`,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => `${record.quantite * record.prix_unitaire} €`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => (
        <Button
          danger
          icon={<MinusOutlined />}
          onClick={() => {
            const newLignes = [...lignesCommande];
            newLignes.splice(index, 1);
            setLignesCommande(newLignes);
          }}
        />
      ),
    },
  ];

  const onFinishStep1 = (values) => {
    form.setFieldsValue(values);
    setCurrent(1);
  };

  const handleAddLigne = () => {
    setLignesCommande([
      ...lignesCommande,
      {
        produit: produits[0],
        quantite: 1,
        prix_unitaire: produits[0].prix_achat,
        key: Date.now(),
      },
    ]);
  };

  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      const commandeData = {
        fournisseur: values.fournisseur,
        notes: values.notes,
        lignes: lignesCommande.map(l => ({
          produit: l.produit.id,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
        })),
      };
      
      await api.post('/commandes/', commandeData);
      notification.success({ message: 'Commande créée avec succès' });
      // Redirection vers la liste des commandes
    } catch (error) {
      notification.error({ message: 'Erreur lors de la création de la commande' });
    }
  };

  return (
    <div>
      <Steps current={current} style={{ marginBottom: 24 }}>
        <Step title="Information générale" />
        <Step title="Lignes de commande" />
        <Step title="Validation" />
      </Steps>

      {current === 0 && (
        <Form form={form} layout="vertical" onFinish={onFinishStep1}>
          <Form.Item
            name="fournisseur"
            label="Fournisseur"
            rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
          >
            <Select placeholder="Sélectionnez un fournisseur">
              {fournisseurs.map(f => (
                <Option key={f.id} value={f.id}>
                  {f.nom_fournisseur}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Suivant
          </Button>
        </Form>
      )}

      {current === 1 && (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddLigne}
            style={{ marginBottom: 16 }}
          >
            Ajouter une ligne
          </Button>

          <Table
            columns={columns}
            dataSource={lignesCommande}
            pagination={false}
            footer={() => (
              <div style={{ textAlign: 'right' }}>
                <strong>Total: </strong>
                {lignesCommande.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire), 0)} €
              </div>
            )}
          />

          <Divider />

          <Space>
            <Button onClick={() => setCurrent(0)}>Précédent</Button>
            <Button type="primary" onClick={() => setCurrent(2)}>
              Suivant
            </Button>
          </Space>
        </div>
      )}

      {current === 2 && (
        <div>
          <h3>Récapitulatif de la commande</h3>
          {/* Afficher les détails de la commande */}
          
          <Divider />
          
          <Space>
            <Button onClick={() => setCurrent(1)}>Précédent</Button>
            <Button type="primary" onClick={handleSubmit}>
              Valider la commande
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default NouvelleCommande;