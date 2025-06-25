import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Button,
  CircularProgress,
  Typography,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import { Add } from '@mui/icons-material';

const ProductAdder = ({
  selectedProduct,
  setSelectedProduct,
  quantity,
  setQuantity,
  discount,
  setDiscount,
  onAdd
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/produits/');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Erreur de chargement des produits:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.designation} - ${option.prix_vente} F`}
            value={selectedProduct}
            onChange={(_, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Rechercher un produit" 
                variant="outlined" 
                size="small"
                fullWidth
              />
            )}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Quantité"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              variant="outlined"
              size="small"
              InputProps={{
                inputProps: { min: 1 }
              }}
              fullWidth
            />

            <TextField
              label="Remise (%)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { min: 0, max: 100, step: 0.5 }
              }}
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAdd}
            disabled={!selectedProduct}
            fullWidth
            sx={{ mt: 1 }}
          >
            Ajouter au panier
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductAdder;