import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, message } from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const { data } = await axios.get(`/clients/${id}/`);
                setClient(data);
                setLoading(false);
            } catch (error) {
                message.error('Erreur lors du chargement du client');
                navigate('/clients');
            }
        };

        fetchClient();
    }, [id, navigate]);

    return (
        <div style={{ padding: '24px' }}>
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/clients')}
                style={{ marginBottom: '16px' }}
            >
                Retour
            </Button>

            {client && (
                <Card
                    title={`Fiche Client - ${client.nom_client}`}
                    loading={loading}
                    extra={
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/clients/${id}/edit`)}
                        >
                            Modifier
                        </Button>
                    }
                >
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Nom">{client.nom_client}</Descriptions.Item>
                        <Descriptions.Item label="SIRET">{client.siret || 'Non renseigné'}</Descriptions.Item>
                        <Descriptions.Item label="Adresse">{client.adresse}</Descriptions.Item>
                        <Descriptions.Item label="Code Postal">{client.code_postal}</Descriptions.Item>
                        <Descriptions.Item label="Ville">{client.ville}</Descriptions.Item>
                        <Descriptions.Item label="Pays">{client.pays}</Descriptions.Item>
                        <Descriptions.Item label="Téléphone">{client.telephone}</Descriptions.Item>
                        <Descriptions.Item label="Email">{client.email}</Descriptions.Item>
                        {client.notes && (
                            <Descriptions.Item label="Notes" span={2}>
                                {client.notes}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>
            )}
        </div>
    );
};

export default ClientDetail;