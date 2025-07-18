import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, DatePicker, Select, 
  Spin, notification, Row, Col, Statistic, Button 
} from 'antd';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import moment from 'moment';
import { DownloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const RapportActivites = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([
    moment().subtract(1, 'month'),
    moment()
  ]);
  const [reportType, setReportType] = useState('ventes');
  const [groupBy, setGroupBy] = useState('jour');
  const [stats, setStats] = useState({
    totalCA: 0,
    totalTransactions: 0,
    panierMoyen: 0
  });

  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const fetchReportData = async () => {
  try {
    setLoading(true);
    
    const params = {
      type: reportType,
      debut: dateRange[0].format('YYYY-MM-DD'),
      fin: dateRange[1].format('YYYY-MM-DD'),
      group: reportType === 'ventes' ? groupBy : undefined
    };

    const { data } = await axios.get('/api/rapports/', { params });
    
    if (data?.success) {
      // Normalisation des dates
      const normalizedData = data.data?.map(item => ({
        ...item,
        date: item.date ? moment(item.date) : null,
        total: safeNumber(item.total),
        count: safeNumber(item.count, 1)
      })) || [];
      
      setReportData(normalizedData);
      
      // Calcul des stats pour les ventes
      if (reportType === 'ventes') {
        const totalCA = normalizedData.reduce((sum, item) => sum + safeNumber(item.total), 0);
        const totalTransactions = normalizedData.reduce((sum, item) => sum + safeNumber(item.count), 0);
        setStats({
          totalCA,
          totalTransactions,
          panierMoyen: totalTransactions > 0 ? totalCA / totalTransactions : 0
        });
      }
    } else {
      notification.error({
        message: 'Erreur',
        description: data?.error || 'Erreur lors de la récupération des données'
      });
      setReportData([]);
    }
  } catch (error) {
    console.error("Erreur:", error);
    notification.error({
      message: 'Erreur',
      description: error.response?.data?.error || 'Impossible de charger le rapport'
    });
    setReportData([]);
  } finally {
    setLoading(false);
  }
};

  const exportToPDF = async () => {
    try {
      const params = {
        type: reportType,
        debut: dateRange[0].format('YYYY-MM-DD'),
        fin: dateRange[1].format('YYYY-MM-DD'),
        group: reportType === 'ventes' ? groupBy : undefined
      };

      window.open(`/api/rapports/export-pdf/?${new URLSearchParams(params).toString()}`, '_blank');
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de générer le PDF'
      });
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, groupBy]);

  const renderVentesReport = () => {
    return (
      <>
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Card>
              <Statistic
                title="Chiffre d'affaires total"
                value={stats.totalCA.toFixed(2)}
                precision={2}
                suffix="€"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Nombre de transactions"
                value={stats.totalTransactions}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Panier moyen"
                value={stats.panierMoyen.toFixed(2)}
                precision={2}
                suffix="€"
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title={`Chiffre d'affaires par ${groupBy}`} 
          className="mb-4"
          extra={
            <Button 
              icon={<DownloadOutlined />} 
              onClick={exportToPDF}
            >
              Exporter
            </Button>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={val => groupBy === 'jour' ? 
                  moment(val).format('DD/MM') : 
                  moment(val).format('MMM YYYY')}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${safeNumber(value).toFixed(2)} €`, "CA"]}
                labelFormatter={val => groupBy === 'jour' ?
                  moment(val).format('DD/MM/YYYY') :
                  moment(val).format('MMMM YYYY')}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                fill="#8884d8" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Détail des ventes">
          <Table
            columns={[
              {
                title: groupBy === 'jour' ? 'Date' : 'Produit',
                dataIndex: groupBy === 'jour' ? 'date' : 'produit__designation',
                render: val => groupBy === 'jour' ? 
                  moment(val).format('DD/MM/YYYY') : 
                  val || 'N/A'
              },
              {
                title: 'Montant',
                dataIndex: 'total',
                render: val => `${safeNumber(val).toFixed(2)} €`
              },
              {
                title: 'Quantité',
                dataIndex: 'count',
                render: val => safeNumber(val),
                hidden: groupBy !== 'jour'
              },
              {
                title: 'Type',
                dataIndex: 'is_vente_directe',
                render: val => (
                  <Tag color={val ? 'green' : 'blue'}>
                    {val ? 'Vente directe' : 'Commande'}
                  </Tag>
                )
              }
            ].filter(col => !col.hidden)}
            dataSource={reportData}
            rowKey={groupBy === 'jour' ? 'date' : 'produit__reference'}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucune donnée disponible' }}
          />
        </Card>
      </>
    );
  };

  const renderStocksReport = () => (
    <Card 
      title="État des stocks"
      extra={
        <Button 
          icon={<DownloadOutlined />} 
          onClick={exportToPDF}
        >
          Exporter
        </Button>
      }
    >
      <Table
        columns={[
          {
            title: 'Produit',
            dataIndex: 'designation',
            key: 'designation'
          },
          {
            title: 'Référence',
            dataIndex: 'reference',
            key: 'reference'
          },
          {
            title: 'Prix',
            dataIndex: 'prix_vente',
            key: 'prix',
            render: val => `${safeNumber(val).toFixed(2)} €`
          },
          {
            title: 'Stock',
            dataIndex: 'quantite_stock',
            key: 'stock'
          },
          {
            title: 'Seuil alerte',
            dataIndex: 'seuil_alerte',
            key: 'seuil'
          },
          {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: status => (
              <Tag color={status === 'rupture' ? 'red' : status === 'alerte' ? 'orange' : 'green'}>
                {status === 'rupture' ? 'Rupture' : status === 'alerte' ? 'Alerte' : 'OK'}
              </Tag>
            )
          }
        ]}
        dataSource={reportData}
        rowKey="reference"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Aucune donnée disponible' }}
      />
    </Card>
  );

  const renderCommandesReport = () => (
    <Card 
      title="Commandes récentes"
      extra={
        <Button 
          icon={<DownloadOutlined />} 
          onClick={exportToPDF}
        >
          Exporter
        </Button>
      }
    >
      <Table
        columns={[
          {
            title: 'N° Commande',
            dataIndex: 'numero_commande',
            key: 'numero'
          },
          {
            title: 'Client',
            dataIndex: 'client__nom_client',
            key: 'client',
            render: client => client || 'Vente directe'
          },
          {
            title: 'Date',
            dataIndex: 'date_creation',
            key: 'date',
            render: date => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'N/A'
          },
          {
            title: 'Montant',
            dataIndex: 'total_commande',
            key: 'total',
            render: total => `${safeNumber(total).toFixed(2)} €`
          },
          {
            title: 'Statut',
            dataIndex: 'statut',
            key: 'statut',
            render: statut => (
              <Tag color={
                statut === 'VALIDEE' ? 'green' : 
                statut === 'ANNULEE' ? 'red' : 'blue'
              }>
                {statut}
              </Tag>
            )
          }
        ]}
        dataSource={reportData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Aucune donnée disponible' }}
      />
    </Card>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {`Rapport ${reportType === 'ventes' ? 'des ventes' : 
            reportType === 'produits' ? 'du stock' : 
            'des commandes'}`}
        </h1>
        
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
            style={{ width: 150 }}
          >
            <Option value="ventes">Ventes</Option>
            <Option value="produits">Stock</Option>
            <Option value="commandes">Commandes</Option>
          </Select>
          
          {reportType === 'ventes' && (
            <Select
              value={groupBy}
              onChange={setGroupBy}
              style={{ width: 120 }}
            >
              <Option value="jour">Par jour</Option>
              <Option value="produit">Par produit</Option>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {reportType === 'ventes' && renderVentesReport()}
          {reportType === 'produits' && renderStocksReport()}
          {reportType === 'commandes' && renderCommandesReport()}
        </>
      )}
    </div>
  );
};

export default RapportActivites;