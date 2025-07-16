import React, { useState } from 'react';
import {
  DialogContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState(product || {
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

export default ProductForm;