import React from 'react';
import {
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel
} from '@mui/material';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState({
    designation: '',
    prix_vente: 0,
    prix_achat: 0,
    quantite_stock: 0,
    seuil_alerte: 5,
    unite_mesure: 'unite',
    description: '',
    ...product
  });

  const displayReference = product?.reference || 'Génération automatique';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['prix_vente', 'prix_achat'].includes(name)
        ? parseFloat(value) || 0
        : ['quantite_stock', 'seuil_alerte'].includes(name)
          ? parseInt(value) || 0
          : value
    }));
  };

  return (
    <Box component="form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }} sx={{ mt: 2 }}>
      
      <TextField
        margin="normal"
        fullWidth
        label="Référence"
        value={displayReference}
        InputProps={{
          readOnly: true,
        }}
        variant="filled"
        sx={{
          '& .MuiFilledInput-root': {
            backgroundColor: 'action.disabledBackground',
            cursor: 'not-allowed'
          }
        }}
      />

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
          endAdornment: <InputAdornment position="end">€</InputAdornment>,
          inputProps: { min: 0, step: 0.01 }
        }}
      />

      <TextField
        margin="normal"
        fullWidth
        label="Prix d'achat"
        name="prix_achat"
        type="number"
        value={formData.prix_achat}
        onChange={handleChange}
        InputProps={{
          endAdornment: <InputAdornment position="end">€</InputAdornment>,
          inputProps: { min: 0, step: 0.01 }
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
        inputProps={{ min: 0 }}
      />

      <TextField
        margin="normal"
        fullWidth
        label="Seuil d'alerte"
        name="seuil_alerte"
        type="number"
        value={formData.seuil_alerte}
        onChange={handleChange}
        inputProps={{ min: 0 }}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Unité de mesure</InputLabel>
        <Select
          name="unite_mesure"
          value={formData.unite_mesure}
          label="Unité de mesure"
          onChange={handleChange}
        >
          <MenuItem value="unite">Unité</MenuItem>
          <MenuItem value="kg">Kilogramme</MenuItem>
          <MenuItem value="g">Gramme</MenuItem>
          <MenuItem value="l">Litre</MenuItem>
          <MenuItem value="m">Mètre</MenuItem>
        </Select>
      </FormControl>

      <TextField
        margin="normal"
        fullWidth
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={4}
      />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          Annuler
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;