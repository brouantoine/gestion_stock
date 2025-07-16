import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Pagination,
  Select,
  MenuItem,
  Button,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Loading from '../../components/Loading';
import ProductHeader from './ProductHeader';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';

function ProduitList() {
  // États
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États pour les dialogues
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [showInactiveOption, setShowInactiveOption] = useState(false);

  // États pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch des produits
  const fetchProduits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/produits/', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setProduits(data);
      setError(null);
    } catch (err) {
      console.error('Erreur fetchProduits:', err);
      setError(err.message);
      showSnackbar(`Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  // Fonctions utilitaires
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF' 
    }).format(Number(price));
  };

  const formatStock = (stock, seuil = 5) => {
    if (stock === 0) return 'Rupture';
    if (stock < seuil) return `Faible (${stock})`;
    return stock;
  };

  // Tri des données
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrage et pagination
  const sortedProduits = [...produits].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredProduits = sortedProduits.filter(produit =>
    produit.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProduits = filteredProduits.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // Gestion des actions
  const handleView = (produit) => {
    setSelectedProduit(produit);
    setOpenViewDialog(true);
  };

  const handleEdit = (produit) => {
    setSelectedProduit(produit);
    setOpenEditDialog(true);
  };

  const handleDelete = (produit) => {
    setSelectedProduit(produit);
    setOpenDeleteDialog(true);
  };

  const handleCreate = () => {
    setSelectedProduit(null);
    setOpenCreateDialog(true);
  };

  const handleMarkInactive = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/produits/${selectedProduit.id}/mark_inactive/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ est_actif: false })
    });

    if (!response.ok) throw new Error("Échec de la désactivation");

    fetchProduits();
    showSnackbar('Produit marqué comme inactif');
    setOpenDeleteDialog(false);
    setShowInactiveOption(false);
  } catch (err) {
    showSnackbar(err.message, 'error');
  }
};

// Modifiez handleDeleteConfirm
const handleDeleteConfirm = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/produits/${selectedProduit.id}/`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.detail?.includes("utilisé dans des commandes")) {
        setShowInactiveOption(true);
        return;
      }
      throw new Error(errorData.detail || 'Erreur lors de la suppression');
    }

    fetchProduits();
    showSnackbar('Produit supprimé avec succès');
    setOpenDeleteDialog(false);
  } catch (err) {
    showSnackbar(err.message, 'error');
  }
};

  const handleSave = async (produitData) => {
  try {
    const isEdit = !!produitData.id;
    const url = isEdit 
      ? `http://localhost:8000/api/produits/${produitData.id}/`
      : 'http://localhost:8000/api/produits/';

    // Préparer les données à envoyer (seulement les champs modifiables)
    const dataToSend = {
      designation: produitData.designation,
      prix_vente: Number(produitData.prix_vente),
      quantite_stock: Number(produitData.quantite_stock),
      unite_mesure: produitData.unite_mesure,
      // Ajouter d'autres champs modifiables si nécessaire
    };

    console.log('Données envoyées:', dataToSend); // Pour débogage

    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur détaillée:', errorData); // Log l'erreur du backend
      throw new Error(errorData.detail || JSON.stringify(errorData));
    }

    fetchProduits();
    showSnackbar(`Produit ${isEdit ? 'modifié' : 'créé'} avec succès`);
    isEdit ? setOpenEditDialog(false) : setOpenCreateDialog(false);
  } catch (err) {
    console.error('Erreur complète:', err);
    showSnackbar(`Erreur: ${err.message}`, 'error');
  }
};

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <ProductHeader 
        filteredCount={filteredProduits.length} 
        handleCreate={handleCreate}
        fetchProduits={fetchProduits}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <Alert severity="error" sx={{ margin: 2 }}>
          Erreur: {error}
          <Button onClick={fetchProduits} sx={{ ml: 2 }}>Réessayer</Button>
        </Alert>
      ) : (
        <>
          <ProductTable
            produits={paginatedProduits}
            sortConfig={sortConfig}
            handleSort={handleSort}
            formatPrice={formatPrice}
            formatStock={formatStock}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {filteredProduits.length > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="textSecondary">
                  Lignes par page:
                </Typography>
                <Select
                  size="small"
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  sx={{ height: 36 }}
                >
                  {[5, 10, 25, 50].map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </Box>
              
              <Pagination
                count={Math.ceil(filteredProduits.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Dialogue de suppression */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer "{selectedProduit?.designation}" (Réf: {selectedProduit?.reference}) ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error">Confirmer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de visualisation */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails du produit</DialogTitle>
        <DialogContent>
          {selectedProduit && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedProduit.designation}</Typography>
              <Typography>Référence: {selectedProduit.reference}</Typography>
              <Typography>Prix: {formatPrice(selectedProduit.prix_vente)}</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography>Stock:</Typography>
                <Chip
                  label={formatStock(selectedProduit.quantite_stock)}
                  color={selectedProduit.quantite_stock === 0 ? 'error' : 'primary'}
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue d'édition/création */}
      {(openEditDialog || openCreateDialog) && (
        <Dialog 
          open={openEditDialog || openCreateDialog} 
          onClose={() => openEditDialog ? setOpenEditDialog(false) : setOpenCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {openEditDialog ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
          <ProductForm 
            product={selectedProduit}
            onSave={handleSave}
            onCancel={() => openEditDialog ? setOpenEditDialog(false) : setOpenCreateDialog(false)}
          />
        </Dialog>
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
}

export default ProduitList;