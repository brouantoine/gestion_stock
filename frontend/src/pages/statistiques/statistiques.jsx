import React, { useState, useEffect, useRef } from 'react';
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
import { format, parseISO, isWithinInterval, subDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [rawData, setRawData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const reportRef = useRef();

  // Téléchargement du PDF
  const handleDownloadPDF = () => {
    const input = reportRef.current;
    const pdf = new jsPDF('landscape');

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`rapport-statistiques-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    });
  };

  // Fonction pour récupérer toutes les données
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/statistiques/');
      
      if (response.data.success) {
        setRawData(response.data.data);
        applyFilters(response.data.data, startDate, endDate, viewMode);
      } else {
        throw new Error(response.data.message || 'Données non disponibles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Applique les filtres
  const applyFilters = (data, start, end, mode) => {
    if (!data) return;

    // Filtrage par date
    const dateFiltered = {
      ...data,
      commandes_recentes: data.commandes_recentes.filter(cmd => {
        const cmdDate = parseISO(cmd.date.split(' ')[0]);
        return isWithinInterval(cmdDate, {
          start: start,
          end: end
        });
      })
    };

    // Filtrage par type
    const typeFiltered = {
      ...dateFiltered,
      commandes_recentes: dateFiltered.commandes_recentes.filter(cmd => {
        if (mode === 'direct') return cmd.client === "Client Direct";
        if (mode === 'orders') return cmd.client !== "Client Direct";
        return true;
      })
    };

    // Calcul des stats
    const stats = calculateStats(typeFiltered.commandes_recentes);
    const dailyStats = generateDailyStats(typeFiltered.commandes_recentes, start, end);

    setFilteredData({
      ...typeFiltered,
      stats_globales: stats,
      stats_quotidiennes: dailyStats,
      periode: {
        debut: format(start, 'yyyy-MM-dd'),
        fin: format(end, 'yyyy-MM-dd')
      }
    });
  };

  // Calcul des statistiques
  const calculateStats = (commandes) => {
    return {
      total_ca: commandes.reduce((sum, cmd) => sum + cmd.total, 0),
      ventes_directes: commandes.filter(cmd => cmd.client === "Client Direct").length,
      commandes_clients: commandes.filter(cmd => cmd.client !== "Client Direct").length,
      ca_ventes_directes: commandes
        .filter(cmd => cmd.client === "Client Direct")
        .reduce((sum, cmd) => sum + cmd.total, 0),
      ca_commandes: commandes
        .filter(cmd => cmd.client !== "Client Direct")
        .reduce((sum, cmd) => sum + cmd.total, 0),
      avg_ventes: commandes.length > 0 
        ? commandes.reduce((sum, cmd) => sum + cmd.total, 0) / commandes.length 
        : 0
    };
  };

  // Génération des stats quotidiennes
  const generateDailyStats = (commandes, start, end) => {
    const days = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dailyCommands = commandes.filter(cmd => 
        cmd.date.startsWith(dateStr)
      );
      
      days.push({
        date: dateStr,
        ca_ht: dailyCommands.reduce((sum, cmd) => sum + cmd.total, 0),
        nb_ventes: dailyCommands.length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Gestion des changements de date
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end || start);
    
    if (rawData) {
      applyFilters(rawData, start, end || start, viewMode);
    }
  };

  // Gestion du changement de type
  const handleTypeChange = (type) => {
    setViewMode(type);
    if (rawData) {
      applyFilters(rawData, startDate, endDate, type);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatChartDate = (dateStr) => {
    return format(parseISO(dateStr), 'dd MMM', { locale: fr });
  };

  const prepareChartData = () => {
    if (!filteredData) return null;

    // Données pour le graphique à barres
    const barData = {
      labels: filteredData.stats_quotidiennes.map(day => formatChartDate(day.date)),
      datasets: [{
        label: 'Chiffre d\'affaires (FCFA)',
        data: filteredData.stats_quotidiennes.map(day => day.ca_ht),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    // Données pour le camembert
    const pieData = {
      labels: ['Ventes Directes', 'Commandes Clients'],
      datasets: [{
        data: [
          filteredData.stats_globales.ca_ventes_directes,
          filteredData.stats_globales.ca_commandes
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
        ticks: { 
          callback: (value) => formatNumber(value),
          stepSize: 10000
        }
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
        {error} <Button onClick={fetchAllData}>Réessayer</Button>
      </Alert>
    );
  }

  if (!filteredData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Aucune donnée disponible <Button onClick={fetchAllData}>Actualiser</Button>
      </Alert>
    );
  }

  const { barData, pieData } = prepareChartData();

  return (
    <Box sx={{ p: 3 }} ref={reportRef}>
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
            <IconButton onClick={fetchAllData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  isClearable={false}
                  locale={fr}
                  dateFormat="dd/MM/yyyy"
                  customInput={
                    <TextField
                      fullWidth
                      label="Période"
                      variant="outlined"
                      size="small"
                      value={`${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`}
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
              onClick={() => handleTypeChange('all')}
              color={viewMode === 'all' ? 'primary' : 'inherit'}
            >
              Toutes
            </Button>
            <Button 
              onClick={() => handleTypeChange('direct')}
              color={viewMode === 'direct' ? 'error' : 'inherit'}
              startIcon={<PointOfSale />}
            >
              Ventes Directes
            </Button>
            <Button 
              onClick={() => handleTypeChange('orders')}
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
                {formatNumber(filteredData.stats_globales.total_ca)} FCFA
              </Typography>
              <Typography variant="caption">
                Période: {format(startDate, 'dd/MM/yyyy')} au {format(endDate, 'dd/MM/yyyy')}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #d32f2f' }}>
              <Typography variant="h6" color="textSecondary">
                Ventes Directes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatNumber(filteredData.stats_globales.ca_ventes_directes)} FCFA
              </Typography>
              <Typography variant="caption">
                {filteredData.stats_globales.ventes_directes} transactions
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderTop: '4px solid #2e7d32' }}>
              <Typography variant="h6" color="textSecondary">
                Commandes Clients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatNumber(filteredData.stats_globales.ca_commandes)} FCFA
              </Typography>
              <Typography variant="caption">
                {filteredData.stats_globales.commandes_clients} commandes
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
                {barData && <Bar data={barData} options={chartOptions} />}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Répartition des Ventes
              </Typography>
              <Box sx={{ height: '300px' }}>
                {pieData && <Pie data={pieData} options={chartOptions} />}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Dernières Commandes */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Dernières Transactions ({filteredData.commandes_recentes.length})
            </Typography>
            <Box>
              <Button 
                startIcon={<Download />} 
                size="small" 
                sx={{ mr: 1 }}
                onClick={handleDownloadPDF}
              >
                Exporter PDF
              </Button>
              <Button startIcon={<Print />} size="small">
                Imprimer
              </Button>
            </Box>
          </Box>
          
          {filteredData.commandes_recentes.length > 0 ? (
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
                  {filteredData.commandes_recentes.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{format(parseISO(order.date), 'dd/MM/yyyy HH:mm')}</td>
                      <td style={{ padding: '12px' }}>{order.numero}</td>
                      <td style={{ padding: '12px' }}>{order.client}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {formatNumber(order.total)} FCFA
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: order.client === "Client Direct" ? '#ffebee' : '#e8f5e9',
                          color: order.client === "Client Direct" ? '#c62828' : '#2e7d32',
                          fontSize: '0.8rem'
                        }}>
                          {order.client === "Client Direct" ? 'Vente Directe' : 'Commande'}
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