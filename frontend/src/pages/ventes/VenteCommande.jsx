import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Button,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  LocalMall,
  PointOfSale,
  Person,
  AttachMoney,
  Percent,
  ShoppingCart
} from '@mui/icons-material';
import ClientSelector from './ClientSelector';
import TypeSelector from './TypeSelector';
import ProductAdder from './ProductAdder';
import ProductList from './ProductList';

const VenteCommande = () => {
  const [typeTransaction, setTypeTransaction] = useState('VENTE_DIRECTE');
  const [client, setClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [defaultClient, setDefaultClient] = useState(null);
  const [tva, setTva] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchDefaultClient = async () => {
      try {
        const response = await axios.get('/api/clients/', {
          params: { search: 'Client Direct' }
        });
        if (response.data.length > 0) {
          setDefaultClient(response.data[0]);
          if (typeTransaction === 'VENTE_DIRECTE') {
            setClient(response.data[0]);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du client par défaut:", error);
      }
    };
    fetchDefaultClient();
  }, []);

  const handleTransactionTypeChange = (type) => {
    setTypeTransaction(type);
    if (type === 'VENTE_DIRECTE' && defaultClient) {
      setClient(defaultClient);
    } else {
      setClient(null);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const existingIndex = products.findIndex(p => p.product.id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      const updatedProducts = [...products];
      updatedProducts[existingIndex].quantity += quantity;
      setProducts(updatedProducts);
    } else {
      const newItem = {
        product: selectedProduct,
        quantity,
        unitPrice: selectedProduct.prix_vente,
        discount
      };
      setProducts([...products, newItem]);
    }
    
    resetProductForm();
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setDiscount(0);
  };

  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if ((!client || products.length === 0) && typeTransaction !== 'VENTE_DIRECTE') {
        throw new Error("Veuillez sélectionner un client et ajouter des produits");
      }

      for (const item of products) {
        if (item.product.quantite_stock < item.quantity) {
          throw new Error(`Stock insuffisant pour ${item.product.designation} (Stock disponible: ${item.product.quantite_stock})`);
        }
      }

      const payload = {
        client: typeTransaction === 'VENTE_DIRECTE' ? defaultClient.id : client.id,
        is_vente_directe: typeTransaction === 'VENTE_DIRECTE',
        statut: typeTransaction === 'VENTE_DIRECTE' ? 'VALIDEE' : 'BROUILLON',
        tva: tva, 
        lignes: products.map(product => ({
          produit: product.product.id,
          quantite: parseInt(product.quantity, 10),
          prix_unitaire: parseFloat(product.unitPrice),
          remise_ligne: parseFloat(product.discount) || 0
        }))
      };

      const response = await axios.post(
        'http://localhost:8000/api/commandes-client/', 
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.status === 201) {
        setSuccess("Transaction enregistrée avec succès!");
        setClient(typeTransaction === 'VENTE_DIRECTE' ? defaultClient : null);
        setProducts([]);
      }
    } catch (error) {
      setError(error.message);
      console.error("Erreur détaillée:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice * (1 - item.discount/100));
    }, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {typeTransaction === 'VENTE_DIRECTE' ? (
              <><PointOfSale sx={{ verticalAlign: 'middle', mr: 1 }} /> Vente Directe</>
            ) : (
              <><LocalMall sx={{ verticalAlign: 'middle', mr: 1 }} /> Commande Client</>
            )}
          </Typography>
          
          <Box>
            <Tooltip title="Actualiser">
              <IconButton color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Section Type de Transaction */}
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PointOfSale sx={{ mr: 1 }} /> Type de Transaction
              </Typography>
              <TypeSelector 
                transactionType={typeTransaction}
                setTransactionType={handleTransactionTypeChange}
              />
            </Paper>
          </Grid>

          {/* Section Client */}
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} /> Informations Client
              </Typography>
              <ClientSelector 
                selectedClient={client}
                setSelectedClient={setClient}
                isDirectSale={typeTransaction === 'VENTE_DIRECTE'}
              />
            </Paper>
          </Grid>

          {/* Section Paramètres Financiers */}
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} /> Paramètres Financiers
              </Typography>
              <TextField
                select
                fullWidth
                label="TVA Applicable"
                value={tva}
                onChange={(e) => setTva(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value={1}>18% (TVA standard)</MenuItem>
                <MenuItem value={2}>10% (TVA réduite)</MenuItem>
                <MenuItem value={3}>5.5% (TVA spéciale)</MenuItem>
              </TextField>
            </Paper>
          </Grid>

          {/* Section Ajout de Produits */}
          <Grid item xs={12} md={5}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Add sx={{ mr: 1 }} /> Ajout de Produits
              </Typography>
              <ProductAdder
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                quantity={quantity}
                setQuantity={setQuantity}
                discount={discount}
                setDiscount={setDiscount}
                onAdd={handleAddProduct}
              />
            </Paper>
          </Grid>

          {/* Section Détail de la Transaction */}
          <Grid item xs={12} md={7}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ mr: 1 }} /> Détail de la Transaction
              </Typography>
              <ProductList 
                products={products}
                onRemove={handleRemoveProduct}
              />
              
              {products.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {calculateTotal().toFixed(2)} F
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Bouton de soumission */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PointOfSale />}
            onClick={handleSubmit}
            disabled={loading || (!client && typeTransaction !== 'VENTE_DIRECTE') || products.length === 0}
            sx={{ px: 4, py: 1.5 }}
          >
            {typeTransaction === 'VENTE_DIRECTE' ? 'Valider la Vente' : 'Enregistrer la Commande'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default VenteCommande;