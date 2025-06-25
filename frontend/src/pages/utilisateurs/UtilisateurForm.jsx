import React, { useEffect } from 'react';
import { Form, Input, Button, Select, message, Card, Switch, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const UtilisateurForm = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;
  const isAdmin = currentUser?.role === 'admin';

  // Chargement des données utilisateur en mode édition
  useEffect(() => {
    if (isEditMode) {
      const fetchUser = async () => {
        try {
          const { data } = await axios.get(`http://localhost:8000/api/utilisateurs/${id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          form.setFieldsValue({
            ...data,
            // Ne pas pré-remplir le mot de passe
            password: undefined
          });
        } catch (error) {
          message.error('Erreur lors du chargement des données utilisateur');
        }
      };
      fetchUser();
    }
  }, [id, form, isEditMode]);

  // Soumission du formulaire
  const onFinish = async (values) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      };

      if (isEditMode) {
        await axios.patch(`http://localhost:8000/api/utilisateurs/${id}/`, values, config);
        message.success('Utilisateur mis à jour avec succès');
      } else {
        await axios.post('http://localhost:8000/api/utilisateurs/', values, config);
        message.success('Utilisateur créé avec succès');
      }
      navigate('/utilisateurs');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.detail || 
                         'Erreur lors de la sauvegarde';
      message.error(errorMessage);
    }
  };

  return (
    <Card 
      title={isEditMode ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ 
          role: 'vendeur',
          est_actif: true
        }}
      >
        <Form.Item
          label="Prénom"
          name="first_name"
          rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
        >
          <Input placeholder="Entrez le prénom" />
        </Form.Item>

        <Form.Item
          label="Nom"
          name="last_name"
          rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
        >
          <Input placeholder="Entrez le nom" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Ce champ est obligatoire' },
            { type: 'email', message: 'Email non valide' }
          ]}
        >
          <Input placeholder="email@exemple.com" />
        </Form.Item>

        {isAdmin && (
          <Form.Item
            label="Rôle"
            name="role"
            rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
          >
            <Select disabled={!isAdmin}>
              <Option value="admin">Administrateur</Option>
              <Option value="gestionnaire">Gestionnaire</Option>
    ù
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="Téléphone"
          name="telephone"
          rules={[
            { pattern: /^[0-9]+$/, message: 'Numéro de téléphone invalide' }
          ]}
        >
          <Input placeholder="0612345678" />
        </Form.Item>

        {isAdmin && (
          <Form.Item
            label="Statut"
            name="est_actif"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Actif"
              unCheckedChildren="Inactif"
            />
          </Form.Item>
        )}

        {!isEditMode && (
          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[
              { required: true, message: 'Ce champ est obligatoire' },
              { min: 8, message: 'Minimum 8 caractères' }
            ]}
          >
            <Input.Password placeholder="Entrez un mot de passe sécurisé" />
          </Form.Item>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {isEditMode ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button onClick={() => navigate('/utilisateurs')}>
              Annuler
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UtilisateurForm;