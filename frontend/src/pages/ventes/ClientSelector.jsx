import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Autocomplete,
  CircularProgress,
  Typography
} from '@mui/material';
import { Person } from '@mui/icons-material';

const ClientSelector = ({ selectedClient, setSelectedClient, isDirectSale }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients/');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Erreur de chargement des clients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Autocomplete
          options={clients}
          getOptionLabel={(option) => option.nom_client}
          value={isDirectSale ? null : selectedClient}
          onChange={(_, newValue) => setSelectedClient(newValue)}
          disabled={isDirectSale}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label={isDirectSale ? "Client Direct (par défaut)" : "Sélectionnez un client"} 
              variant="outlined" 
              size="small"
              fullWidth
            />
          )}
        />
      )}
    </Box>
  );
};

export default ClientSelector;