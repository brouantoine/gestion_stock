import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Space } from 'antd';
import { 
  ShoppingOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const ALL_MODULES_CONFIG = {
  VENTE: {
    code: 'VENTE',
    nom: 'Mouvements',
    description: 'Gestion des ventes et transactions en temps réel',
    icon: <DollarOutlined />,
    path: '/ventecommande',
    isMain: true,
    color: 'blue'
  },
  PRODUIT: {
    code: 'PRODUIT',
    nom: 'Produits',
    description: 'Catalogue des produits',
    icon: <ShoppingOutlined />,
    path: '/produits',
    color: 'geekblue'
  },
  COMMANDE: {
    code: 'COMMANDE',
    nom: 'Commandes',
    description: 'Suivi des commandes',
    icon: <UnorderedListOutlined />,
    path: '/commandes',
    color: 'green'
  },
  CLIENT: {
    code: 'CLIENT',
    nom: 'Clients',
    description: 'Gestion clientèle',
    icon: <TeamOutlined />,
    path: '/clients',
    color: 'orange'
  },
  STATS: {
    code: 'STATS',
    nom: 'Statistiques',
    description: 'Analyses commerciales',
    icon: <BarChartOutlined />,
    path: '/statistiques',
    color: 'volcano'
  },
  UTILISATEUR: {
    code: 'UTILISATEUR',
    nom: 'Utilisateurs',
    description: 'Gestion des accès',
    icon: <UserOutlined />,
    path: '/utilisateurs',
    color: 'purple'
  },
    CONFIGURATION: {
    code: 'CONFIGURATION',
    nom: 'Configuration',
    description: 'Gestion des utilisateurs et permissions',
    icon: <SettingOutlined />,
    path: '/configuration',
    allowedRoles: ['admin']
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, modules, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return null; // La redirection est gérée par AuthContext
  }

  const activeModules = modules
    .map(code => ALL_MODULES_CONFIG[code])
    .filter(Boolean);

  const mainModule = activeModules.find(m => m.isMain);
  const otherModules = activeModules.filter(m => !m.isMain);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Tableau de Bord - {user.role.toUpperCase()}
      </Title>

      {mainModule && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card
              hoverable
              onClick={() => navigate(mainModule.path)}
              style={{ 
                height: '280px',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: '#fff'
              }}
              bodyStyle={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '40px'
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                {React.cloneElement(mainModule.icon, { style: { color: '#fff', fontSize: '36px' } })}
              </div>
              <Title level={3} style={{ color: '#fff', marginBottom: '8px' }}>
                {mainModule.nom}
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px', fontSize: '16px' }}>
                {mainModule.description}
              </Text>
              <Space align="center" style={{ color: '#fff', fontWeight: 500 }}>
                Accéder au module <ArrowRightOutlined />
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[24, 24]}>
        {otherModules.map(module => (
          <Col key={module.code} xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card
              hoverable
              onClick={() => navigate(module.path)}
              style={{ height: '180px' }}
              bodyStyle={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: `rgba(24, 144, 255, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {React.cloneElement(module.icon, { style: { color: '#1890ff', fontSize: '20px' } })}
              </div>
              <Title level={4} style={{ marginBottom: '4px' }}>
                {module.nom}
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                {module.description}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;