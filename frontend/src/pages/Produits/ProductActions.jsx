import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

const ProductActions = ({ product, onEdit, onDelete, onView }) => (
  <Box display="flex" gap={1}>
    <Tooltip title="Voir détails">
      <IconButton onClick={() => onView(product)}>
        <Visibility />
      </IconButton>
    </Tooltip>
    <Tooltip title="Modifier">
      <IconButton onClick={() => onEdit(product)}>
        <Edit />
      </IconButton>
    </Tooltip>
    <Tooltip title="Supprimer">
      <IconButton onClick={() => onDelete(product)}>
        <Delete />
      </IconButton>
    </Tooltip>
  </Box>
);

export default ProductActions;