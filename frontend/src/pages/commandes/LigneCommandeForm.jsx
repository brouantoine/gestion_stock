// src/components/LigneCommandeForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Stack, Grid,
  FormControl, InputLabel, Select, MenuItem,
  Autocomplete
} from '@mui/material';
import { commandeService } from '../../services/api';

const LigneCommandeForm = ({ ligne, commande, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    produit: null,
    quantite: 1,
    prix_unitaire: 0,
    remise_ligne: 0,
    statut_livraison: 'A_LIVRER'
  });

  const [produits, setProduits] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(false);

  useEffect(() => {
    if (ligne) {
      setFormData({
        produit: ligne.produit,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        remise_ligne: ligne.remise_ligne,
        statut_livraison: ligne.statut_livraison
      });
    }
  }, [ligne]);

  const fetchProduits = async () => {
    setLoadingProduits(true);
    try {
      const response = await commandeService.getProduits();
      setProduits(response.data.results);
    } catch (err) {
      console.error('Erreur lors du chargement des produits', err);
    } finally {
      setLoadingProduits(false);
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProduitChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      produit: newValue,
      prix_unitaire: newValue?.prix_unitaire || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      produit: formData.produit?.id || null
    };
    onSave(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Autocomplete
            options={produits}
            getOptionLabel={(option) => `${option.reference} - ${option.nom}` || ''}
            value={formData.produit}
            onChange={handleProduitChange}
            loading={loadingProduits}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Produit" 
                required 
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Quantité"
            name="quantite"
            type="number"
            value={formData.quantite}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Prix unitaire"
            name="prix_unitaire"
            type="number"
            value={formData.prix_unitaire}
            onChange={handleChange}
            required
            inputProps={{ step: "0.01" }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Remise (%)"
            name="remise_ligne"
            type="number"
            value={formData.remise_ligne}
            onChange={handleChange}
            inputProps={{ min: 0, max: 100, step: "0.01" }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Statut livraison</InputLabel>
            <Select
              name="statut_livraison"
              value={formData.statut_livraison}
              label="Statut livraison"
              onChange={handleChange}
              required
            >
              <MenuItem value="A_LIVRER">À livrer</MenuItem>
              <MenuItem value="PARTIELLE">Livraison partielle</MenuItem>
              <MenuItem value="LIVREE">Livrée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Enregistrer
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
};

export default LigneCommandeForm;