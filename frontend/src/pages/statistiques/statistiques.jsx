import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  ButtonGroup,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import { 
  Refresh, 
  FilterAlt, 
  PointOfSale, 
  LocalMall,
  Download,
  Print
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatisticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const calculateStats = (rawData) => {
    if (!rawData) return rawData;

    // Si les stats sont à 0 mais il y a des commandes, on recalcule
    if (rawData.stats_globales.total_ca === 0 && rawData.commandes_recentes.length > 0) {
      const newStats = { ...rawData.stats_globales };
      
      newStats.total_ca = rawData.commandes_recentes.reduce((sum, cmd) => sum + cmd.total, 0);
      newStats.ventes_directes = rawData.commandes_recentes.filter(cmd => cmd.is_vente_directe).length;
      newStats.commandes_clients = rawData.commandes_recentes.filter(cmd => !cmd.is_vente_directe).length;
      newStats.ca_ventes_directes = rawData.commandes_recentes
        .filter(cmd => cmd.is_vente_directe)
        .reduce((sum, cmd) => sum + cmd.total, 0);
      newStats.ca_commandes = rawData.commandes_recentes
        .filter(cmd => !cmd.is_vente_directe)
        .reduce((sum, cmd) => sum + cmd.total, 0);
      
      return {
        ...rawData,
        stats_globales: newStats
      };
    }
    
    return rawData;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/statistiques/', {
        params: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      });
      
      if (response.data.success) {
        setData(calculateStats(response.data.data));
      } else {
        throw new Error(response.data.message || 'Données non disponibles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const filteredData = () => {
    if (!data) return null;

    return {
      ...data,
      commandes_recentes: data.commandes_recentes.filter(cmd => {
        if (viewMode === 'direct') return cmd.is_vente_directe;
        if (viewMode === 'orders') return !cmd.is_vente_directe;
        return true;
      })
    };
  };

  const prepareChartData = () => {
    const currentData = filteredData();
    if (!currentData) return null;

    // Graphique à barres (CA quotidien)
    const barData = {
      labels: currentData.stats_quotidiennes.length > 0 
        ? currentData.stats_quotidiennes.map(day => day.date) 
        : ['Aucune donnée'],
      datasets: [{
        label: 'Chiffre d\'affaires (FCFA)',
        data: currentData.stats_quotidiennes.length > 0 
          ? currentData.stats_quotidiennes.map(day => day.ca_ht || 0)
          : [0],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    // Camembert (répartition)
    const pieData = {
      labels: ['Ventes Directes', 'Commandes Clients'],
      datasets: [{
        data: [
          currentData.stats_globales.ca_ventes_directes || 0,
          currentData.stats_globales.ca_commandes || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    };

    return { barData, pieData };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)} FCFA`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => formatNumber(value) }
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error} <Button onClick={fetchData}>Réessayer</Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Aucune donnée disponible <Button onClick={fetchData}>Actualiser</Button>
      </Alert>
    );
  }

  const currentData = filteredData();
  const { barData, pieData } = prepareChartData();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* En-tête avec filtres */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            Tableau de Bord Statistique
          </Typography>
          
          <Box>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterAlt />
            </IconButton>
            <IconButton onClick={fetchData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  customInput={
                    <TextField
                      fullWidth
                      label="Date de début"
                      variant="outlined"
                      size="small"
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  customInput={
                    <TextField
                      fullWidth
                      label="Date de fin"
                      variant="outlined"
                      size="small"
                    />
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Boutons de filtre */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ButtonGroup variant="contained">
            <Button 
              onClick={() => setViewMode('all')}
              color={viewMode === 'all' ? 'primary' : 'inherit'}
            >
              Toutes
            </Button>
            <Button 
              onClick={() => setViewMode('direct')}
              color={viewMode === 'direct' ? 'error' : 'inherit'}
              startIcon={<PointOfSale />}
            >
              Ventes Directes
            </Button>
            <Button 
              onClick={() => setViewMode('orders')}
              color={viewMode === 'orders' ? 'success' : 'inherit'}
              startIcon={<LocalMall />}
            >
              Commandes
            </Button>
          </ButtonGroup>
        </Box>

        {/* Cartes de statistiques */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #1976d2' }}>
              <Typography variant="h6" color="textSecondary">
                Chiffre d'Affaires Total
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatNumber(currentData.stats_globales.total_ca)} FCFA
              </Typography>
              <Typography variant="caption">
                Période: {currentData.periode.debut} au {currentData.periode.fin}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #d32f2f' }}>
              <Typography variant="h6" color="textSecondary">
                Ventes Directes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatNumber(currentData.stats_globales.ca_ventes_directes)} FCFA
              </Typography>
              <Typography variant="caption">
                {currentData.stats_globales.ventes_directes} transactions
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #2e7d32' }}>
              <Typography variant="h6" color="textSecondary">
                Commandes Clients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatNumber(currentData.stats_globales.ca_commandes)} FCFA
              </Typography>
              <Typography variant="caption">
                {currentData.stats_globales.commandes_clients} commandes
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Graphiques */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Chiffre d'Affaires Journalier
              </Typography>
              <Box sx={{ height: '300px' }}>
                <Bar data={barData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Répartition des Ventes
              </Typography>
              <Box sx={{ height: '300px' }}>
                <Pie data={pieData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Dernières Commandes */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Dernières Transactions ({currentData.commandes_recentes.length})
            </Typography>
            <Box>
              <Button startIcon={<Download />} size="small" sx={{ mr: 1 }}>
                Exporter
              </Button>
              <Button startIcon={<Print />} size="small">
                Imprimer
              </Button>
            </Box>
          </Box>
          
          {currentData.commandes_recentes.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>N°</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.commandes_recentes.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{order.date}</td>
                      <td style={{ padding: '12px' }}>{order.numero}</td>
                      <td style={{ padding: '12px' }}>{order.client}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {formatNumber(order.total)} FCFA
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: order.is_vente_directe ? '#ffebee' : '#e8f5e9',
                          color: order.is_vente_directe ? '#c62828' : '#2e7d32',
                          fontSize: '0.8rem'
                        }}>
                          {order.is_vente_directe ? 'Vente Directe' : 'Commande'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Alert severity="info">Aucune transaction correspondante</Alert>
          )}
        </Paper>
      </Paper>
    </Box>
  );
};

export default StatisticsDashboard;