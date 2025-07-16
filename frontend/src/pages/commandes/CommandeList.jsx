// src/components/CommandeList.jsx
import React, { useState, useEffect } from 'react';
import { commandeService } from '../../services/api';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress,
  Button, IconButton, Typography, Box,
  Pagination, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, Alert, Snackbar,
  Collapse, Chip, Grid, Badge
} from '@mui/material';
import { Edit, Delete, Visibility, Add, ExpandMore, ExpandLess } from '@mui/icons-material';
import CommandeForm from './CommandeForm';
import LigneCommandeForm from './LigneCommandeForm';
import { formatDate, formatCurrency } from '../../utils/format';

const CommandeList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCommandeDialog, setOpenCommandeDialog] = useState(false);
  const [openLigneDialog, setOpenLigneDialog] = useState(false);
  const [currentCommande, setCurrentCommande] = useState(null);
  const [currentLigne, setCurrentLigne] = useState(null);
  const [expandedCommandes, setExpandedCommandes] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        search: searchTerm,
        expand: 'lignes,fournisseur,client'
      };
      const response = await commandeService.getCommandes(params);
      setCommandes(response.data.results);
      setTotalPages(Math.ceil(response.data.count / pageSize));
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des commandes');
      setLoading(false);
      showSnackbar(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, [page, searchTerm]);

  const toggleExpandCommande = (commandeId) => {
    setExpandedCommandes(prev => 
      prev.includes(commandeId) 
        ? prev.filter(id => id !== commandeId) 
        : [...prev, commandeId]
    );
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleOpenCommandeDialog = (commande = null) => {
    setCurrentCommande(commande);
    setOpenCommandeDialog(true);
  };

  const handleCloseCommandeDialog = () => {
    setOpenCommandeDialog(false);
    setCurrentCommande(null);
  };

  const handleOpenLigneDialog = (commande, ligne = null) => {
    setCurrentCommande(commande);
    setCurrentLigne(ligne);
    setOpenLigneDialog(true);
  };

  const handleCloseLigneDialog = () => {
    setOpenLigneDialog(false);
    setCurrentCommande(null);
    setCurrentLigne(null);
  };

  const handleSaveCommande = async (commandeData) => {
    try {
      if (currentCommande) {
        await commandeService.updateCommande(currentCommande.id, commandeData);
        showSnackbar('Commande mise à jour avec succès', 'success');
      } else {
        await commandeService.createCommande(commandeData);
        showSnackbar('Commande créée avec succès', 'success');
      }
      fetchCommandes();
      handleCloseCommandeDialog();
    } catch (err) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleSaveLigne = async (ligneData) => {
    try {
      if (currentLigne) {
        await commandeService.updateLigneCommande(currentCommande.id, currentLigne.id, ligneData);
        showSnackbar('Ligne mise à jour avec succès', 'success');
      } else {
        await commandeService.addLigneCommande(currentCommande.id, ligneData);
        showSnackbar('Ligne ajoutée avec succès', 'success');
      }
      fetchCommandes();
      handleCloseLigneDialog();
    } catch (err) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDeleteCommande = async (id) => {
    try {
      await commandeService.deleteCommande(id);
      showSnackbar('Commande supprimée avec succès', 'success');
      fetchCommandes();
    } catch (err) {
      showSnackbar(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleDeleteLigne = async (commandeId, ligneId) => {
    try {
      await commandeService.deleteLigneCommande(commandeId, ligneId);
      showSnackbar('Ligne supprimée avec succès', 'success');
      fetchCommandes();
    } catch (err) {
      showSnackbar(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VALIDEE': return 'success';
      case 'LIVREE': return 'primary';
      case 'ANNULEE': return 'error';
      default: return 'default';
    }
  };

  if (loading && commandes.length === 0) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Liste des Commandes
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Code, client, statut..."
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenCommandeDialog()}
        >
          Nouvelle Commande
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Détails</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {commandes.map((commande) => (
              <React.Fragment key={commande.id}>
                <TableRow>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleExpandCommande(commande.id)}
                    >
                      {expandedCommandes.includes(commande.id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{commande.code_commande}</TableCell>
                  <TableCell>{commande.client?.nom || 'N/A'}</TableCell>
                  <TableCell>{formatDate(commande.date_creation)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={commande.statut} 
                      color={getStatusColor(commande.statut)} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(commande.prix_total)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenCommandeDialog(commande)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteCommande(commande.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={expandedCommandes.includes(commande.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Lignes de commande
                          <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleOpenLigneDialog(commande)}
                            sx={{ ml: 2 }}
                          >
                            Ajouter une ligne
                          </Button>
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Produit</TableCell>
                              <TableCell>Quantité</TableCell>
                              <TableCell>Prix unitaire</TableCell>
                              <TableCell>Remise</TableCell>
                              <TableCell>Total</TableCell>
                              <TableCell>Statut</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {commande.lignes?.map((ligne) => (
                              <TableRow key={ligne.id}>
                                <TableCell>{ligne.produit?.reference || 'N/A'}</TableCell>
                                <TableCell>{ligne.quantite}</TableCell>
                                <TableCell>{formatCurrency(ligne.prix_unitaire)}</TableCell>
                                <TableCell>{ligne.remise_ligne}%</TableCell>
                                <TableCell>{formatCurrency(ligne.total_ligne_ht)}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={ligne.statut_livraison} 
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleOpenLigneDialog(commande, ligne)}
                                  >
                                    <Edit fontSize="small" color="primary" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteLigne(commande.id, ligne.id)}
                                  >
                                    <Delete fontSize="small" color="error" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* Dialog pour commande */}
      <Dialog open={openCommandeDialog} onClose={handleCloseCommandeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentCommande ? 'Modifier Commande' : 'Nouvelle Commande'}
        </DialogTitle>
        <DialogContent>
          <CommandeForm 
            commande={currentCommande} 
            onSave={handleSaveCommande} 
            onCancel={handleCloseCommandeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour ligne de commande */}
      <Dialog open={openLigneDialog} onClose={handleCloseLigneDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentLigne ? 'Modifier Ligne' : 'Nouvelle Ligne'}
        </DialogTitle>
        <DialogContent>
          <LigneCommandeForm 
            ligne={currentLigne} 
            commande={currentCommande}
            onSave={handleSaveLigne} 
            onCancel={handleCloseLigneDialog}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommandeList;