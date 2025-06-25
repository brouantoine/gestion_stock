import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Button } from 'antd';
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
  ShoppingCartOutlined
} from '@ant-design/icons';
import { logout, getCurrentUser } from '../services/api/authService';

const { Header, Sider, Content } = Layout;

const NavBar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <Menu.Item key="1" icon={<HomeOutlined />}>
            <Link to="/">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<ShoppingOutlined />}>
            <Link to="/produits">Produits</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<ShoppingCartOutlined />}>
            <Link to="/commandes">Commandes</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<TeamOutlined />}>
            <Link to="/clients">Clients</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<UserOutlined />}>
            <Link to="/utilisateurs">Utilisateurs</Link>
          </Menu.Item>
          <Menu.Item key="6" icon={<BarChartOutlined />}>
            <Link to="/statistiques">Statistiques</Link>
          </Menu.Item>
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
                src={currentUser?.avatar} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              {!collapsed && (
                <span style={{ fontWeight: 500 }}>
                  {currentUser?.username || 'Utilisateur'}
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