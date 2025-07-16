import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';

const ProductActions = ({ product, onView, onEdit, onDelete }) => (
  <Box display="flex" gap={1}>
    <Tooltip title="Voir détails">
      <IconButton 
        size="small" 
        onClick={() => onView(product)}
        sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}
      >
        <Visibility fontSize="small" color="info" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Modifier">
      <IconButton 
        size="small" 
        onClick={() => onEdit(product)}
        sx={{ backgroundColor: '#e8f5e9', '&:hover': { backgroundColor: '#c8e6c9' } }}
      >
        <Edit fontSize="small" color="primary" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Supprimer">
      <IconButton 
        size="small" 
        onClick={() => onDelete(product)}
        sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
      >
        <Delete fontSize="small" color="error" />
      </IconButton>
    </Tooltip>
  </Box>
);

export default ProductActions;