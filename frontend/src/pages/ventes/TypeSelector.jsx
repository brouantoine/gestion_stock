import React, { useRef, useEffect } from 'react';
import { Box, ButtonGroup, Button, Typography } from '@mui/material';
import { PointOfSale, LocalMall } from '@mui/icons-material';

const TypeSelector = ({ transactionType, setTransactionType, onTypeChange }) => {
  const buttonGroupRef = useRef(null);

  const handleTypeChange = (type) => {
    // Vérification de la disponibilité du DOM avant manipulation
    if (!buttonGroupRef.current || !buttonGroupRef.current.contains(document.activeElement)) {
      return;
    }
    
    setTransactionType(type);
    onTypeChange(type);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
        Sélectionnez le type de transaction:
      </Typography>
      <ButtonGroup ref={buttonGroupRef} fullWidth>
        <Button
          variant={transactionType === 'VENTE_DIRECTE' ? 'contained' : 'outlined'}
          onClick={() => handleTypeChange('VENTE_DIRECTE')}
          startIcon={<PointOfSale />}
        >
          Vente Directe
        </Button>
        <Button
          variant={transactionType === 'COMMANDE' ? 'contained' : 'outlined'}
          onClick={() => handleTypeChange('COMMANDE')}
          startIcon={<LocalMall />}
        >
          Commande
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default React.memo(TypeSelector);