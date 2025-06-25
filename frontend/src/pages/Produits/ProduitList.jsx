import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Pagination,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Snackbar,
  InputAdornment,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add,
  Refresh,
  Search,
  Edit,
  Delete,
  FilterList,
  PictureAsPdf,
  GridOn as ExcelIcon,
  Visibility,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert';
import Loading from '../../components/Loading';
import WarningIcon from '@mui/icons-material/Warning';


const ProductActions = ({ product, onView, onEdit, onDelete }) => (
  <Box display="flex" gap={1}>
    <Tooltip title="Voir détails">
      <IconButton 
        size="small" 
        onClick={() => onView(product)}
        sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}
      >
        <Visibility fontSize="small" color="info" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Modifier">
      <IconButton 
        size="small" 
        onClick={() => onEdit(product)}
        sx={{ backgroundColor: '#e8f5e9', '&:hover': { backgroundColor: '#c8e6c9' } }}
      >
        <Edit fontSize="small" color="primary" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Supprimer">
      <IconButton 
        size="small" 
        onClick={() => onDelete(product)}
        sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
      >
        <Delete fontSize="small" color="error" />
      </IconButton>
    </Tooltip>
  </Box>
);

// Composant réutilisable pour le formulaire
const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState(product || {
    reference: '',
    designation: '',
    prix_vente: 0,
    quantite_stock: 0,
    unite_mesure: 'unite'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prix_vente' || name === 'quantite_stock' ? Number(value) : value
    }));
  };

  return (
      <DialogContent>
      <Box component="form" onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }} sx={{ mt: 2 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Désignation"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Prix de vente"
          name="prix_vente"
          type="number"
          value={formData.prix_vente}
          onChange={handleChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">F</InputAdornment>,
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Quantité en stock"
          name="quantite_stock"
          type="number"
          value={formData.quantite_stock}
          onChange={handleChange}
          InputProps={{
            inputProps: { min: 0 }
          }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Unité de mesure</InputLabel>
          <Select
            label="Unité de mesure"
            name="unite_mesure"
            value={formData.unite_mesure}
            onChange={handleChange}
          >
            <MenuItem value="unite">Unité</MenuItem>
            <MenuItem value="kg">Kilogramme</MenuItem>
            <MenuItem value="g">Gramme</MenuItem>
            <MenuItem value="l">Litre</MenuItem>
            <MenuItem value="m">Mètre</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel} variant="outlined">
            Annuler
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Enregistrer
          </Button>
        </Box>
      </Box>
    </DialogContent>
  );
};

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
  
  // États pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch des produits
  const fetchProduits = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/produits/', {
        credentials: 'include', // Nécessaire pour les cookies de session
        headers: {
          'Accept': 'application/json',
        }
      });
  
      console.log('Réponse brute:', response); // Pour le débogage
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Données reçues:', data); // Vérifiez les données
      setProduits(data);
      setError(null);
    } catch (err) {
      console.error('Erreur fetchProduits:', err);
      setError(err.message);
      showSnackbar(`Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
  
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/produits/', {
          signal: abortController.signal,
          credentials: 'include'
        });
  
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setProduits(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
          setError(err.message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };
  
    fetchData();
  
    return () => abortController.abort();
  }, []); // Le tableau vide est correct ici car tout est géré en interne

  // Fonctions d'affichage des notifications
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fonctions de formatage
  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'XOF' 
      }).format(Number(price));
    } catch {
      return '0,00 Fcfa';
    }
  };

  const formatStock = (stock, seuil) => {
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

  // Filtrage et pagination
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

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/produits/${selectedProduit.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Ajoutez si vous utilisez l'authentification :
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'  // Important pour les sessions Django
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
  
      fetchProduits();
      showSnackbar('Produit supprimé avec succès');
    } catch (err) {
      console.error('Erreur suppression:', err);
      showSnackbar(`Échec de la suppression: ${err.message}`, 'error');
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const handleSave = async (produitData) => {
  try {
    const isEdit = !!produitData.id;
    const url = isEdit 
      ? `http://localhost:8000/api/produits/${produitData.id}/`
      : 'http://localhost:8000/api/produits/';
    
    // Ne jamais envoyer la référence pour les modifications
    if (isEdit) {
      delete produitData.reference;
    }

    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produitData),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Erreur serveur');

    fetchProduits();
    showSnackbar(`Produit ${isEdit ? 'modifié' : 'créé'} avec succès`);
    setOpenEditDialog(false);
  } catch (err) {
    showSnackbar(err.message, 'error');
  }
};
  // Affichage du chargement
  if (loading) return <Loading />;

  // Affichage des erreurs
  if (error) return (
    <Alert severity="error" sx={{ margin: 2 }}>
      Erreur: {error}
      <Button onClick={fetchProduits} sx={{ ml: 2 }}>Réessayer</Button>
    </Alert>
  );

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Gestion des Produits
          <Chip 
            label={`${filteredProduits.length} produits`} 
            color="primary" 
            size="medium" 
            sx={{ ml: 2, fontSize: '0.9rem' }} 
          />
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
            onClick={handleCreate}
          >
            Nouveau Produit
          </Button>

          <Tooltip title="Filtrer">
            <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
              <FilterList color="action" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exporter en PDF">
            <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
              <PictureAsPdf color="error" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exporter en Excel">
            <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
              <ExcelIcon color="success" />
            </IconButton>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Rechercher..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search color="action" sx={{ marginRight: 1 }} />
            }}
            sx={{ 
              width: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f5f5f5'
              }
            }}
          />
          
          <Tooltip title="Actualiser">
            <IconButton 
              onClick={fetchProduits} 
              color="primary"
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 800 }} aria-label="tableau des produits" stickyHeader>
          <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
            <TableRow>
              <TableCell 
                sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
                onClick={() => handleSort('reference')}
              >
                <Box display="flex" alignItems="center">
                  Référence
                  {sortConfig.key === 'reference' && (
                    sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </TableCell>
              
              <TableCell 
                sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 200 }}
                onClick={() => handleSort('designation')}
              >
                <Box display="flex" alignItems="center">
                  Désignation
                  {sortConfig.key === 'designation' && (
                    sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </TableCell>
              
              <TableCell 
                align="right" 
                sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
                onClick={() => handleSort('prix_vente')}
              >
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  Prix Vente
                  {sortConfig.key === 'prix_vente' && (
                    sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </TableCell>
              
              <TableCell 
                align="right" 
                sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
                onClick={() => handleSort('quantite_stock')}
              >
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  Stock
                  {sortConfig.key === 'quantite_stock' && (
                    sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </TableCell>
              
              <TableCell 
                sx={{ fontWeight: 'bold', minWidth: 100 }}
              >
                Unité
              </TableCell>
              
              <TableCell 
                sx={{ fontWeight: 'bold', minWidth: 150 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedProduits.map((produit) => (
              <TableRow
                key={produit.id}
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { backgroundColor: '#f9f9f9' }
                }}
              >
                <TableCell>
                  <Chip 
                    label={produit.reference} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {produit.designation}
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(produit.prix_vente)}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={formatStock(produit.quantite_stock, produit.seuil_alerte)}
                    color={
                      produit.quantite_stock === 0 ? 'error' :
                      produit.quantite_stock < produit.seuil_alerte ? 'warning' : 'success'
                    }
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                            <TableCell align="right">
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                {produit.quantite_stock <= 5 && (
                  <Tooltip title="Stock critique">
                    <WarningIcon fontSize="small" color="warning" />
                  </Tooltip>
                )}
                <Chip
                  label={
                    produit.quantite_stock === 0 
                      ? "RUPTURE" 
                      : produit.quantite_stock <= 5 
                      ? `${produit.quantite_stock}` 
                      : produit.quantite_stock
                  }
                  color={
                    produit.quantite_stock === 0 
                      ? 'default' 
                      : produit.quantite_stock <= 5 
                      ? 'error' 
                      : 'success'
                  }
                  size="small"
                  sx={{ 
                    fontWeight: 'bold',
                    opacity: produit.quantite_stock === 0 ? 0.8 : 1,
                  }}
                />
              </Box>
            </TableCell>
                <TableCell>
                  <Chip 
                    label={produit.unite_mesure} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#e0e0e0',            
                      textTransform: 'uppercase'
                    }} 
                  />
                </TableCell>
                
                <TableCell>
                  <ProductActions 
                    product={produit}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredProduits.length === 0 && (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="200px"
            flexDirection="column"
          >
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              Aucun produit trouvé
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Ajouter un produit
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* Pagination */}
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
              sx={{ 
                height: 36,
                '& .MuiSelect-select': { py: 1 }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
            
            <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
              {`${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filteredProduits.length)} sur ${filteredProduits.length}`}
            </Typography>
          </Box>
          
          <Pagination
            count={Math.ceil(filteredProduits.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{ 
              '& .MuiPaginationItem-root': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>
      )}

      {/* Dialogue de confirmation de suppression */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer définitivement le produit :
          </Typography>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: '#fff8e1', 
            borderRadius: 1 
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {selectedProduit?.designation}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Référence: {selectedProduit?.reference}
            </Typography>
          </Box>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Cette action est irréversible!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Confirmer la suppression
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de visualisation */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Détails du produit
        </DialogTitle>
        <DialogContent>
          {selectedProduit && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Référence</Typography>
                  <Typography>{selectedProduit.reference}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Désignation</Typography>
                  <Typography>{selectedProduit.designation}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Prix de vente</Typography>
                  <Typography>{formatPrice(selectedProduit.prix_vente)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Stock</Typography>
                  <Chip
                    label={formatStock(selectedProduit.quantite_stock, selectedProduit.seuil_alerte)}
                    color={
                      selectedProduit.quantite_stock === 0 ? 'error' :
                      selectedProduit.quantite_stock < selectedProduit.seuil_alerte ? 'warning' : 'success'
                    }
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Unité</Typography>
                  <Typography>{selectedProduit.unite_mesure}</Typography>
                </Box>
              </Box>
              {selectedProduit.description && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography>{selectedProduit.description}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'édition */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Modifier le produit
        </DialogTitle>
        <ProductForm 
          product={selectedProduit}
          onSave={handleSave}
          onCancel={() => setOpenEditDialog(false)}
        />
      </Dialog>

      {/* Dialogue de création */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Créer un nouveau produit
        </DialogTitle>
        <ProductForm 
          product={null}
          onSave={handleSave}
          onCancel={() => setOpenCreateDialog(false)}
        />
      </Dialog>

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