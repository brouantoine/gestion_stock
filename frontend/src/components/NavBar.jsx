import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  HomeOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  ProfileFilled
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext'; // Importez votre contexte d'authentification

const { Header, Sider, Content } = Layout;

const NavBar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, modules, logout } = useAuth(); // Utilisez les données d'authentification

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Configuration des éléments de menu avec leurs codes correspondants
  const MENU_ITEMS = [
    { key: '1', icon: <HomeOutlined />, label: 'Dashboard', path: '/', code: 'DASHBOARD', },
    { key: '2', icon: <ShoppingOutlined />, label: 'Produits', path: '/produits', code: 'PRODUIT' },
    { key: '3', icon: <ShoppingCartOutlined />, label: 'Commandes', path: '/commandes', code: 'COMMANDE' },
    { key: '4', icon: <TeamOutlined />, label: 'Clients', path: '/clients', code: 'CLIENT' },
    { key: '5', icon: <UserOutlined />, label: 'Utilisateurs', path: '/utilisateurs', code: 'UTILISATEUR' },
    { key: '6', icon: <BarChartOutlined />, label: 'Statistiques', path: '/statistiques', code: 'STATS' },
    { key: '7', icon: <ProfileFilled />, label: 'Rapports', path: '/rapports', code: 'RAPPORT' }
  ];

  // Filtre les éléments du menu selon les modules autorisés
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    // L'admin voit tout
    if (user?.role === 'admin') return true;
    // Pour les autres rôles, vérifie si le module est autorisé
    return modules.includes(item.code);
  });

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Profil</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Déconnexion
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={250}
        theme="light"
        style={{
          position: 'fixed',
          height: '100vh',
          zIndex: 1,
          boxShadow: '2px 0 8px 0 rgba(29,35,41,0.05)'
        }}
      >
        <div style={{ 
          padding: 16, 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0 }}>{collapsed ? 'GS' : 'Gestion Stock'}</h2>
        </div>
        
        <Menu
          mode="inline"
          theme="light"
          defaultSelectedKeys={['1']}
          style={{ borderRight: 0 }}
        >
          {filteredMenuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.path}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout style={{ 
        marginLeft: collapsed ? 80 : 250,
        transition: 'margin 0.2s'
      }}>
        <Header style={{ 
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              gap: 8
            }}>
              <Avatar 
                src={user?.avatar} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              {!collapsed && (
                <span style={{ fontWeight: 500 }}>
                  {user?.username || 'Utilisateur'} ({user?.role})
                </span>
              )}
            </div>
          </Dropdown>
        </Header>

        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          minHeight: 280
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default NavBar;