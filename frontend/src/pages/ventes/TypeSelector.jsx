import React from 'react';
import { Box, ButtonGroup, Button, Typography } from '@mui/material';
import { PointOfSale, LocalMall } from '@mui/icons-material';

const TypeSelector = ({ transactionType, setTransactionType }) => {
  return (
    <Box>
      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
        Sélectionnez le type de transaction:
      </Typography>
      <ButtonGroup fullWidth>
        <Button
          variant={transactionType === 'VENTE_DIRECTE' ? 'contained' : 'outlined'}
          onClick={() => setTransactionType('VENTE_DIRECTE')}
          startIcon={<PointOfSale />}
        >
          Vente Directe
        </Button>
        <Button
          variant={transactionType === 'COMMANDE' ? 'contained' : 'outlined'}
          onClick={() => setTransactionType('COMMANDE')}
          startIcon={<LocalMall />}
        >
          Commande
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default TypeSelector;