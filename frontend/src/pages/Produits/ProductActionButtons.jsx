import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

const ProductActionButtons = ({ 
  product, 
  onView, 
  onEdit, 
  onDelete,
  size = 'medium'
}) => {
  const actionButtons = [
    {
      icon: <Visibility fontSize={size} />,
      tooltip: 'Voir détails',
      onClick: onView,
      color: 'info'
    },
    {
      icon: <Edit fontSize={size} />,
      tooltip: 'Modifier',
      onClick: onEdit,
      color: 'primary'
    },
    {
      icon: <Delete fontSize={size} />,
      tooltip: 'Supprimer',
      onClick: onDelete,
      color: 'error'
    }
  ];

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {actionButtons.map((action, index) => (
        <Tooltip key={index} title={action.tooltip}>
          <IconButton 
            onClick={() => action.onClick(product)}
            color={action.color}
            size={size}
          >
            {action.icon}
          </IconButton>
        </Tooltip>
      ))}
    </div>
  );
};

export default ProductActionButtons;