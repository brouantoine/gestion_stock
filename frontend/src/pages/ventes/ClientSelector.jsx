import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Autocomplete,
  Typography,
  Chip
} from '@mui/material';
import { Person, CheckCircle } from '@mui/icons-material';

const ClientSelector = ({ 
  selectedClient, 
  setSelectedClient, 
  isDirectSale,
  directClientData
}) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDirectSale && directClientData) {
      setSelectedClient(directClientData);
    } else if (!isDirectSale) {
      const fetchClients = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/clients/');
          const data = await response.json();
          setClients(data);
        } catch (error) {
          console.error("Erreur chargement clients:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchClients();
    }
  }, [isDirectSale, directClientData, setSelectedClient]);

  return (
    <Box sx={{ minWidth: 250 }}>
      {isDirectSale ? (
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">Vente Directe</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography>{directClientData?.nom_client || 'Client Direct'}</Typography>
            <Chip label="Par défaut" size="small" sx={{ ml: 1 }} color="primary" />
          </Box>
        </Box>
      ) : (
        <Autocomplete
          options={clients}
          getOptionLabel={(option) => option.nom_client}
          value={selectedClient}
          onChange={(_, newValue) => setSelectedClient(newValue)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Sélectionnez un client" 
              variant="outlined"
              size="small"
              fullWidth
              required
            />
          )}
          loading={loading}
          noOptionsText="Aucun client trouvé"
        />
      )}
    </Box>
  );
};

export default ClientSelector;