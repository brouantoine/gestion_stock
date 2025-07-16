// src/pages/rapports/RapportActivites.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, DatePicker, Select, Spin, Divider } from 'antd';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Rapport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  const [reportType, setReportType] = useState('global');

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD')
      };
      
      const response = await axios.get('/api/rapports/activites/', { params });
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const renderGlobalStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card title="Chiffre d'affaires" bordered={false}>
        <div className="text-2xl font-bold">
          {data.global_stats?.total_ca?.toLocaleString('fr-FR')} €
        </div>
        <div className="text-sm text-gray-500">
          sur {data.global_stats?.total_ventes} transactions
        </div>
      </Card>

      <Card title="Commandes clients" bordered={false}>
        <div className="text-2xl font-bold">
          {data.global_stats?.commandes_clients}
        </div>
        <div className="text-sm text-gray-500">
          {data.global_stats?.ca_commandes?.toLocaleString('fr-FR')} €
        </div>
      </Card>

      <Card title="Ventes directes" bordered={false}>
        <div className="text-2xl font-bold">
          {data.global_stats?.ventes_directes}
        </div>
        <div className="text-sm text-gray-500">
          {data.global_stats?.ca_ventes_directes?.toLocaleString('fr-FR')} €
        </div>
      </Card>

      <Card title="Moyenne quotidienne" bordered={false}>
        <div className="text-2xl font-bold">
          {(data.global_stats?.avg_ventes || 0).toFixed(1)}
        </div>
        <div className="text-sm text-gray-500">
          ventes par jour
        </div>
      </Card>
    </div>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card title="Chiffre d'affaires par jour" bordered={false}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.daily_stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} €`, 'CA']} />
            <Area 
              type="monotone" 
              dataKey="ca_ht" 
              stroke="#8884d8" 
              fill="#8884d8" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Répartition des ventes" bordered={false}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.daily_stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ventes_directes" name="Ventes directes" fill="#82ca9d" />
            <Bar dataKey="commandes_clients" name="Commandes clients" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderRecentActivities = () => (
    <Card title="Activités récentes" bordered={false}>
      <Table
        columns={[
          { title: 'Date', dataIndex: 'date', key: 'date' },
          { title: 'Utilisateur', dataIndex: 'user', key: 'user' },
          { title: 'Action', dataIndex: 'action', key: 'action' },
          { title: 'Détails', dataIndex: 'details', key: 'details' }
        ]}
        dataSource={data.recent_activities}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );

  const renderStockAlerts = () => (
    <Card title="Alertes stock" bordered={false} className="mt-6">
      <Table
        columns={[
          { title: 'Produit', dataIndex: 'produit', key: 'produit' },
          { title: 'Stock actuel', dataIndex: 'stock', key: 'stock' },
          { title: 'Seuil alerte', dataIndex: 'seuil', key: 'seuil' },
          { 
            title: 'Statut', 
            key: 'status',
            render: (_, record) => (
              <Tag color={record.stock === 0 ? 'red' : 'orange'}>
                {record.stock === 0 ? 'Rupture' : 'Alerte'}
              </Tag>
            )
          }
        ]}
        dataSource={data.stock_alerts}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rapport d'activités</h1>
        <div className="flex space-x-4">
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            disabledDate={current => current && current > moment().endOf('day')}
          />
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 200 }}
          >
            <Option value="global">Vue globale</Option>
            <Option value="ventes">Détail ventes</Option>
            <Option value="stock">Statut stock</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {reportType === 'global' && (
            <>
              {renderGlobalStats()}
              {renderCharts()}
              {renderRecentActivities()}
            </>
          )}

          {reportType === 'stock' && renderStockAlerts()}

          {reportType === 'ventes' && (
            <Card title="Détail des ventes" bordered={false}>
              <Table
                columns={[
                  { title: 'N° Commande', dataIndex: 'numero', key: 'numero' },
                  { title: 'Client', dataIndex: 'client', key: 'client' },
                  { title: 'Date', dataIndex: 'date', key: 'date' },
                  { 
                    title: 'Montant', 
                    dataIndex: 'total', 
                    key: 'total',
                    render: value => `${value?.toLocaleString('fr-FR')} €`
                  },
                  { 
                    title: 'Type', 
                    key: 'type',
                    render: (_, record) => (
                      <Tag color={record.is_vente_directe ? 'green' : 'blue'}>
                        {record.is_vente_directe ? 'Vente directe' : 'Commande'}
                      </Tag>
                    )
                  }
                ]}
                dataSource={data.recent_commands}
                rowKey="id"
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Rapport;