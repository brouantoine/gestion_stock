// src/components/CommandeForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Stack, Grid,
  FormControl, InputLabel, Select, MenuItem,
  Autocomplete
} from '@mui/material';
import { formatDate } from '../../utils/format';
import { commandeService } from '../../services/api';
const CommandeForm = ({ commande, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    client: null,
    type_produit: '',
    statut: 'BROUILLON',
    notes: '',
    date_livraison_prevue: ''
  });

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (commande) {
      setFormData({
        client: commande.client,
        type_produit: commande.type_produit || '',
        statut: commande.statut || 'BROUILLON',
        notes: commande.notes || '',
        date_livraison_prevue: commande.date_livraison_prevue || ''
      });
    }
  }, [commande]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await commandeService.getClients();
      setClients(response.data.results);
    } catch (err) {
      console.error('Erreur lors du chargement des clients', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      client: newValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      client: formData.client?.id || null
    };
    onSave(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => option.nom || ''}
            value={formData.client}
            onChange={handleClientChange}
            loading={loadingClients}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Client" 
                required 
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Type de produit"
            name="type_produit"
            value={formData.type_produit}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              name="statut"
              value={formData.statut}
              label="Statut"
              onChange={handleChange}
              required
            >
              <MenuItem value="BROUILLON">Brouillon</MenuItem>
              <MenuItem value="VALIDEE">Validée</MenuItem>
              <MenuItem value="LIVREE">Livrée</MenuItem>
              <MenuItem value="ANNULEE">Annulée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Date livraison prévue"
            name="date_livraison_prevue"
            type="date"
            value={formData.date_livraison_prevue}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
          />
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

export default CommandeForm;