import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, theme, Space } from 'antd';
import { 
  ShoppingOutlined, 
  UnorderedListOutlined,
  UserOutlined,
  PieChartOutlined,
  DollarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { useToken } = theme;

const Dashboard = () => {
  const { token } = useToken();
  const navigate = useNavigate();

  const mainModule = { 
    title: 'Mouvements', 
    icon: <DollarOutlined />,
    path: '/ventecommande',
    color: token.colorPrimary,
    description: 'Gestion des ventes et transactions en temps réel'
  };

  const otherModules = [
    { 
      title: 'Produits', 
      icon: <ShoppingOutlined />,
      path: '/produits',
      color: token.geekblue,
      description: 'Catalogue produits'
    },
    
    { 
      title: 'Commandes', 
      icon: <UnorderedListOutlined />,
      path: '/commandes',
      color: token.green,
      description: 'Suivi des commandes'
    },
    { 
      title: 'Clients', 
      icon: <UserOutlined />,
      path: '/clients',
      color: token.orange,
      description: 'Gestion clientèle'
    },
    { 
      title: 'Statistiques', 
      icon: <PieChartOutlined />,
      path: '/statistiques',
      color: token.volcano,
      description: 'Analyses commerciales'
    },
    { 
      title: 'Utilisateurs', 
      icon: <UserOutlined />,
      path: '/utilisateurs',
      color: token.purple,
      description: 'Gestion des accès'
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: token.colorBgContainer
    }}>
      <Title level={2} style={{ marginBottom: '24px', fontWeight: 600 }}>Tableau de Bord</Title>
      
      {/* Module principal - Mouvements */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card 
            hoverable
            onClick={() => navigate(mainModule.path)}
            style={{ 
              height: '280px',
              borderRadius: '16px',
              border: 'none',
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              position: 'relative'
            }}
            bodyStyle={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '40px',
              color: '#fff'
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
              {React.cloneElement(mainModule.icon, { 
                style: { 
                  color: '#fff',
                  fontSize: '36px'
                } 
              })}
            </div>
            <Title level={3} style={{ color: '#fff', marginBottom: '8px' }}>{mainModule.title}</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px', fontSize: '16px' }}>
              {mainModule.description}
            </Text>
            <Space align="center" style={{ color: '#fff', fontWeight: 500 }}>
              Accéder au module <ArrowRightOutlined />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Autres modules */}
      <Row gutter={[24, 24]}>
        {otherModules.map((item, index) => (
          <Col key={index} xs={24} sm={12} md={12} lg={8} xl={8}>
            <Card 
              hoverable
              onClick={() => navigate(item.path)}
              style={{ 
                height: '180px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: token.colorBgElevated,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: `${item.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {React.cloneElement(item.icon, { 
                  style: { 
                    color: item.color,
                    fontSize: '20px'
                  } 
                })}
              </div>
              <Title level={4} style={{ marginBottom: '4px', color: token.colorText }}>{item.title}</Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>{item.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;