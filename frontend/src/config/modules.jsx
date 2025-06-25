// src/config/modules.js
import {
  HomeOutlined,
  ShoppingOutlined,
  DollarOutlined,
  UnorderedListOutlined,
  UserOutlined,
  PieChartOutlined
} from '@ant-design/icons';

export const APP_MODULES = {
  DASHBOARD: {
    code: 'DASHBOARD',
    name: 'Tableau de bord',
    path: '/',
    icon: <HomeOutlined />,
    dashboardIcon: <HomeOutlined style={{ fontSize: '32px' }} />,
    color: 'colorPrimary',
    description: 'Vue globale du système',
    showInNav: false
  },
  PRODUCTS: {
    code: 'PRODUCTS',
    name: 'Produits',
    path: '/produits',
    icon: <ShoppingOutlined />,
    dashboardIcon: <ShoppingOutlined style={{ fontSize: '32px' }} />,
    color: 'colorPrimary',
    description: 'Gestion du catalogue produits',
    showInNav: true
  },
  SALES: {
    code: 'SALES',
    name: 'Ventes',
    path: '/ventes',
    icon: <DollarOutlined />,
    dashboardIcon: <DollarOutlined style={{ fontSize: '32px' }} />,
    color: 'colorSuccess',
    description: 'Gestion des ventes',
    showInNav: true
  },
  ORDERS: {
    code: 'ORDERS',
    name: 'Commandes',
    path: '/commandes',
    icon: <UnorderedListOutlined />,
    dashboardIcon: <UnorderedListOutlined style={{ fontSize: '32px' }} />,
    color: 'colorWarning',
    description: 'Gestion des commandes',
    showInNav: true
  },
  CUSTOMERS: {
    code: 'CUSTOMERS',
    name: 'Clients',
    path: '/clients',
    icon: <UserOutlined />,
    dashboardIcon: <UserOutlined style={{ fontSize: '32px' }} />,
    color: 'colorError',
    description: 'Gestion des clients',
    showInNav: true
  },
  REPORTS: {
    code: 'REPORTS',
    name: 'Statistiques',
    path: '/statistiques',
    icon: <PieChartOutlined />,
    dashboardIcon: <PieChartOutlined style={{ fontSize: '32px' }} />,
    color: 'colorInfo',
    description: 'Analytiques des ventes',
    showInNav: true
  },
};