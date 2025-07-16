import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material';
import {
  Add,
  Refresh,
  Search,
  FilterList,
  PictureAsPdf,
  GridOn as ExcelIcon
} from '@mui/icons-material';

const ProductHeader = ({ 
  filteredCount, 
  handleCreate, 
  fetchProduits, 
  searchTerm, 
  setSearchTerm 
}) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
        Gestion des Produits
        <Chip 
          label={`${filteredCount} produits`} 
          color="primary" 
          size="medium" 
          sx={{ ml: 2, fontSize: '0.9rem' }} 
        />
      </Typography>
      
      <Box display="flex" alignItems="center" gap={1}>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          onClick={handleCreate}
        >
          Nouveau Produit
        </Button>

        <Tooltip title="Filtrer">
          <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
            <FilterList color="action" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Exporter en PDF">
          <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
            <PictureAsPdf color="error" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Exporter en Excel">
          <IconButton sx={{ backgroundColor: '#f5f5f5' }}>
            <ExcelIcon color="success" />
          </IconButton>
        </Tooltip>

        <TextField
          size="small"
          placeholder="Rechercher..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search color="action" sx={{ marginRight: 1 }} />
          }}
          sx={{ 
            width: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#f5f5f5'
            }
          }}
        />
        
        <Tooltip title="Actualiser">
          <IconButton 
            onClick={fetchProduits} 
            color="primary"
            sx={{ backgroundColor: '#f5f5f5' }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ProductHeader;