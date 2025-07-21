import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, DatePicker, Select, 
  Spin, notification, Row, Col, Statistic, 
  Button, Typography, Divider, Collapse, Empty 
} from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import moment from 'moment';
import { DownloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Removed TypeScript type alias, use plain JS

const DashboardRapports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().subtract(1, 'month'),
    moment()
  ]);
  const [reportType, setReportType] = useState('statistiques_commandes');
  const [data, setData] = useState({});
  const [activePanels, setActivePanels] = useState(['1', '2']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = {
        type: reportType,
        debut: dateRange[0].format('YYYY-MM-DD'),
        fin: dateRange[1].format('YYYY-MM-DD'),
        group: 'jour'
      };

      const response = await axios.get('/api/rapports/', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        notification.error({
          message: 'Erreur',
          description: 'Erreur lors de la récupération des données'
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      notification.error({
        message: 'Erreur',
        description: error.response?.data?.error || 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType, dateRange]);

  const renderStatsGlobales = () => {
    if (!data.stats_globales) return null;
    
    const stats = data.stats_globales;
    return (
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic
              title="Chiffre d'affaires total"
              value={stats.total_ca}
              precision={2}
              suffix="€"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total ventes"
              value={stats.total_ventes}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ventes directes"
              value={stats.ventes_directes}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Commandes clients"
              value={stats.commandes_clients}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderCommandesRecentes = () => {
    if (!data.commandes_recentes?.length) return <Empty />;
    
    return (
      <Table
        columns={[
          {
            title: 'N° Commande',
            dataIndex: 'numero',
            key: 'numero'
          },
          {
            title: 'Client',
            dataIndex: 'client',
            key: 'client'
          },
          {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: date => moment(date).format('DD/MM/YYYY HH:mm')
          },
          {
            title: 'Montant',
            dataIndex: 'total',
            key: 'total',
            render: total => `${parseFloat(total).toFixed(2)} €`
          },
          {
            title: 'Type',
            dataIndex: 'is_vente_directe',
            key: 'type',
            render: isDirect => (
              <Tag color={isDirect ? 'green' : 'blue'}>
                {isDirect ? 'Vente directe' : 'Commande'}
              </Tag>
            )
          }
        ]}
        dataSource={data.commandes_recentes}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        size="small"
      />
    );
  };

  const renderTopProduits = () => {
    if (!data.top_produits?.length) return <Empty />;
    
    return (
      <Table
        columns={[
          {
            title: 'Produit',
            dataIndex: 'produit__designation',
            key: 'produit'
          },
          {
            title: 'Quantité vendue',
            dataIndex: 'quantite_vendue',
            key: 'quantite'
          },
          {
            title: 'CA généré',
            dataIndex: 'total_ca',
            key: 'ca',
            render: ca => `${parseFloat(ca).toFixed(2)} €`
          }
        ]}
        dataSource={data.top_produits}
        rowKey="produit__id"
        pagination={false}
        size="small"
      />
    );
  };

  const renderClientsActifs = () => {
    if (!data.clients_actifs?.length) return <Empty />;
    
    return (
      <Table
        columns={[
          {
            title: 'Client',
            dataIndex: 'nom_client',
            key: 'client'
          },
          {
            title: 'Commandes',
            dataIndex: 'total_commandes',
            key: 'commandes'
          },
          {
            title: 'CA généré',
            dataIndex: 'total_ca',
            key: 'ca',
            render: ca => `${parseFloat(ca).toFixed(2)} €`
          }
        ]}
        dataSource={data.clients_actifs}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  const renderFournisseurs = () => {
    if (!data.fournisseurs?.length) return <Empty />;
    
    return (
      <Table
        columns={[
          {
            title: 'Fournisseur',
            dataIndex: 'nom_fournisseur',
            key: 'fournisseur'
          },
          {
            title: 'Commandes',
            dataIndex: 'nb_commandes',
            key: 'commandes'
          },
          {
            title: 'Dernier appro',
            dataIndex: 'dernier_appro',
            key: 'appro',
            render: date => moment(date).format('DD/MM/YYYY')
          }
        ]}
        dataSource={data.fournisseurs}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  const renderUtilisateurs = () => {
    if (!data.utilisateurs?.length) return <Empty />;
    
    return (
      <Table
        columns={[
          {
            title: 'Utilisateur',
            dataIndex: 'username',
            key: 'user'
          },
          {
            title: 'Rôle',
            dataIndex: 'role',
            key: 'role'
          },
          {
            title: 'CA total',
            dataIndex: 'Chiffre d\'affaires total',
            key: 'ca',
            render: ca => `${parseFloat(ca).toFixed(2)} €`
          }
        ]}
        dataSource={data.utilisateurs}
        rowKey="id"
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender: record => (
            <div style={{ margin: 0 }}>
              <p><strong>Commandes fournisseurs:</strong> {record['Commandes fournisseurs'].nombre}</p>
              <p><strong>Ventes directes:</strong> {record['Ventes directes effectuées'].nombre}</p>
            </div>
          )
        }}
      />
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Tableau de bord analytique</Title>
        
        <div className="flex space-x-4">
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            disabledDate={current => current > moment().endOf('day')}
          />
          
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 200 }}
          >
            <Option value="statistiques_commandes">Statistiques Commandes</Option>
            <Option value="ventes">Statistiques Ventes</Option>
            <Option value="clients">Clients actifs</Option>
            <Option value="produits">Produits</Option>
            <Option value="fournisseurs">Fournisseurs</Option>
            <Option value="utilisateurs">Utilisateurs</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <Collapse activeKey={activePanels} onChange={setActivePanels}>
          <Panel header="Statistiques globales" key="1">
            {renderStatsGlobales()}
          </Panel>
          
          <Panel header="Détails" key="2">
            {reportType === 'statistiques_commandes' && (
              <>
                <Title level={5}>Commandes récentes</Title>
                {renderCommandesRecentes()}
              </>
            )}
            
            {['ventes', 'produits'].includes(reportType) && (
              <>
                <Title level={5}>Top produits</Title>
                {renderTopProduits()}
              </>
            )}
            
            {reportType === 'clients' && (
              <>
                <Title level={5}>Clients actifs</Title>
                {renderClientsActifs()}
              </>
            )}
            
            {reportType === 'fournisseurs' && (
              <>
                <Title level={5}>Fournisseurs</Title>
                {renderFournisseurs()}
              </>
            )}
            
            {reportType === 'utilisateurs' && (
              <>
                <Title level={5}>Utilisateurs</Title>
                {renderUtilisateurs()}
              </>
            )}
          </Panel>
        </Collapse>
      )}
    </div>
  );
};

export default DashboardRapports;