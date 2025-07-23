import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Button,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Refresh,
  LocalMall,
  PointOfSale,
  Person,
  AttachMoney,
  ShoppingCart
} from '@mui/icons-material';
import ClientSelector from './ClientSelector';
import TypeSelector from './TypeSelector';
import ProductAdder from './ProductAdder';
import ProductList from './ProductList';
import Ticket from './Ticket';

const VenteCommande = () => {
  const [typeTransaction, setTypeTransaction] = useState('VENTE_DIRECTE');
  const [client, setClient] = useState(null);
  const [directClient, setDirectClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [tva, setTva] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastVente, setLastVente] = useState(null);
  const ticketRef = useRef();

  useEffect(() => {
    const loadDirectClient = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('/api/clients/1/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setDirectClient(response.data);
        if (typeTransaction === 'VENTE_DIRECTE') {
          setClient(response.data);
        }
      } catch (error) {
        console.error("Erreur chargement client direct:", error);
      }
    };
    loadDirectClient();
  }, [typeTransaction]);

  const handleTransactionTypeChange = (type) => {
    setTypeTransaction(type);
    setClient(type === 'VENTE_DIRECTE' ? directClient : null);
    setError(null);
    setSuccess(null);
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    setProducts(prevProducts => {
      const normalizedDiscount = parseFloat(discount) || 0;
      const normalizedPrice = parseFloat(selectedProduct.prix_vente) || 0;

      const existingIndex = prevProducts.findIndex(p => 
        p.product.id === selectedProduct.id && 
        parseFloat(p.unitPrice) === normalizedPrice &&
        parseFloat(p.discount) === normalizedDiscount
      );

      if (existingIndex !== -1) {
        const updated = [...prevProducts];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (parseInt(quantity) || 1)
        };
        return updated;
      }

      return [
        ...prevProducts,
        {
          product: selectedProduct,
          quantity: parseInt(quantity) || 1,
          unitPrice: normalizedPrice,
          discount: normalizedDiscount
        }
      ];
    });

    setSelectedProduct(null);
    setQuantity(1);
    setDiscount(0);
  };

  const handleRemoveProduct = (productId) => {
    setProducts(products.filter(p => p.product.id !== productId));
  };

  const printTicket = () => {
    const content = ticketRef.current?.innerHTML;
    if (!content) return;

    const ticketWindow = window.open('', '_blank', 'width=400,height=600');
    if (ticketWindow) {
      ticketWindow.document.write(`
        <html>
          <head>
            <title>Ticket</title>
            <style>
              body { font-family: monospace; font-size: 12px; padding: 10px; }
              h2 { text-align: center; margin: 0 0 10px; }
              hr { margin: 10px 0; }
              .line { display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      ticketWindow.document.close();
      ticketWindow.focus();
      setTimeout(() => {
        ticketWindow.print();
        ticketWindow.close();
      }, 500);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (products.length === 0) {
        throw new Error("Ajoutez au moins un produit");
      }

      const lignes = products.map(item => {
        const quantite = parseInt(item.quantity);
        if (isNaN(quantite) || quantite <= 0) {
          throw new Error(`Quantité invalide pour le produit ${item.product.designation}`);
        }

        return {
          produit: item.product.id,
          quantite: quantite,
          prix_unitaire: parseFloat(item.unitPrice),
          remise_ligne: parseFloat(item.discount) || 0
        };
      });

      const payload = {
        client: typeTransaction === 'VENTE_DIRECTE' ? directClient.id : client?.id,
        is_vente_directe: typeTransaction === 'VENTE_DIRECTE',
        statut: 'VALIDEE',
        tva: parseFloat(tva) || 0,
        lignes: lignes
      };

      const token = localStorage.getItem('access_token');
      const response = await axios.post('/api/commandes-client/', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        setSuccess("Transaction enregistrée avec succès!");
        setProducts([]);
        setLastVente(response.data);
        setTimeout(() => {
          printTicket();
        }, 300);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
      return total + itemTotal;
    }, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
            {typeTransaction === 'VENTE_DIRECTE' ? (
              <>
                <PointOfSale sx={{ mr: 1 }} />
                Vente Directe
              </>
            ) : (
              <>
                <LocalMall sx={{ mr: 1 }} />
                Commande Client
              </>
            )}
          </Typography>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <PointOfSale sx={{ mr: 1 }} /> Type Transaction
              </Typography>
              <TypeSelector 
                transactionType={typeTransaction}
                setTransactionType={setTypeTransaction}
                onTypeChange={handleTransactionTypeChange}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <Person sx={{ mr: 1 }} /> Client
              </Typography>
              <ClientSelector 
                selectedClient={client}
                setSelectedClient={setClient}
                isDirectSale={typeTransaction === 'VENTE_DIRECTE'}
                directClientData={directClient}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <AttachMoney sx={{ mr: 1 }} /> Paramètres
              </Typography>
              <TextField
                select
                fullWidth
                label="TVA"
                value={tva}
                onChange={(e) => setTva(e.target.value)}
                size="small"
              >
                <MenuItem value={1}>18%</MenuItem>
                <MenuItem value={2}>10%</MenuItem>
                <MenuItem value={3}>5.5%</MenuItem>
              </TextField>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <Add sx={{ mr: 1 }} /> Ajouter Produit
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

          <Grid item xs={12} md={7}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <ShoppingCart sx={{ mr: 1 }} /> Produits
              </Typography>
              <ProductList 
                products={products}
                onRemove={handleRemoveProduct}
              />
              {products.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {calculateTotal().toFixed(2)} FCFA
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading || products.length === 0}
            startIcon={loading ? <CircularProgress size={24} /> : <PointOfSale />}
          >
            {loading ? 'En cours...' : typeTransaction === 'VENTE_DIRECTE' ? 'Valider Vente' : 'Enregistrer Commande'}
          </Button>
        </Box>
      </Paper>

      {/* Zone d'impression cachée */}
      <div style={{ display: 'none' }}>
        <div ref={ticketRef}>
          <Ticket vente={lastVente} />
        </div>
      </div>
    </Box>
  );
};

export default VenteCommande;
