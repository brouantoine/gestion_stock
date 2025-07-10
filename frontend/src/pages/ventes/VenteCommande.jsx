import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ShoppingCart,
  QrCodeScanner
} from '@mui/icons-material';
import ClientSelector from './ClientSelector';
import TypeSelector from './TypeSelector';
import ProductAdder from './ProductAdder';
import ProductList from './ProductList';
import './scanner.css';

const BarcodeScanner = ({ onDetected, onError }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      onError(new Error('Scanner non supporté par votre navigateur'));
      return;
    }

    let stream;
    const initScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new window.BarcodeDetector({ formats: ['ean_13'] });
        
        const detect = () => {
          if (!videoRef.current) return;
          
          detector.detect(videoRef.current)
            .then(([result]) => {
              if (result) {
                onDetected(result.rawValue);
              }
              requestAnimationFrame(detect);
            })
            .catch(err => onError(err));
        };
        
        detect();
      } catch (err) {
        onError(err);
      }
    };

    initScanner();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDetected, onError]);

  return (
    <video 
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%',
        height: 'auto',
        maxHeight: '300px',
        borderRadius: '4px',
        border: '2px solid #4CAF50'
      }}
    />
  );
};

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
  const [scanMode, setScanMode] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  const handleBarcodeScanned = useCallback((barcode) => {
    setScanStatus(`Code scanné: ${barcode}`);
    
    axios.get(`/api/produits/?codebarre=${barcode}`)
      .then(response => {
        if (response.data.results?.length > 0) {
          setSelectedProduct(response.data.results[0]);
          setScanStatus(`Produit trouvé: ${response.data.results[0].nom}`);
        } else {
          setScanStatus('Produit non trouvé');
        }
      })
      .catch(error => {
        setScanStatus('Erreur recherche produit');
        console.error(error);
      });
  }, []);

  useEffect(() => {
    const loadDirectClient = async () => {
      try {
        const response = await axios.get('/api/clients/3/');
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
    
    const existingProduct = products.find(p => p.product.id === selectedProduct.id);
    
    if (existingProduct) {
      setProducts(products.map(p => 
        p.product.id === selectedProduct.id 
          ? { ...p, quantity: p.quantity + quantity } 
          : p
      ));
    } else {
      setProducts([
        ...products,
        {
          product: selectedProduct,
          quantity,
          unitPrice: selectedProduct.prix_vente,
          discount
        }
      ]);
    }
    
    setSelectedProduct(null);
    setQuantity(1);
    setDiscount(0);
  };

  const handleRemoveProduct = (productId) => {
    setProducts(products.filter(p => p.product.id !== productId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (products.length === 0) {
        throw new Error("Ajoutez au moins un produit");
      }

      const payload = {
        client: typeTransaction === 'VENTE_DIRECTE' ? 3 : client?.id,
        is_vente_directe: typeTransaction === 'VENTE_DIRECTE',
        statut: typeTransaction === 'VENTE_DIRECTE' ? 'VALIDEE' : 'BROUILLON',
        tva: tva,
        lignes: products.map(item => ({
          produit: item.product.id,
          quantite: item.quantity,
          prix_unitaire: item.unitPrice,
          remise_ligne: item.discount
        }))
      };

      const response = await axios.post('/api/commandes-client/', payload);
      
      if (response.status === 201) {
        setSuccess("Transaction enregistrée avec succès!");
        setProducts([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - item.discount/100);
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
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Button
                  variant={scanMode ? "contained" : "outlined"}
                  color={scanMode ? "secondary" : "primary"}
                  onClick={() => setScanMode(!scanMode)}
                  startIcon={<QrCodeScanner />}
                  sx={{ mr: 2 }}
                >
                  {scanMode ? 'Arrêter le scan' : 'Scanner code-barres'}
                </Button>
                
                {scanStatus && (
                  <Typography variant="caption" color="text.secondary">
                    {scanStatus}
                  </Typography>
                )}
              </Box>

              {scanMode && (
                <Box sx={{ 
                  mt: 2,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  p: 1,
                  minHeight: '300px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {('BarcodeDetector' in window) ? (
                    <BarcodeScanner 
                      onDetected={handleBarcodeScanned}
                      onError={(error) => {
                        setScanStatus(`Erreur: ${error.message}`);
                        setScanMode(false);
                      }}
                    />
                  ) : (
                    <Typography color="error" textAlign="center">
                      Votre navigateur ne supporte pas le scan direct.<br />
                      Essayez avec Chrome/Edge sur Android.
                    </Typography>
                  )}
                </Box>
              )}
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
    </Box>
  );
};

export default VenteCommande;