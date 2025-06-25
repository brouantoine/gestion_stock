import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Delete } from '@mui/icons-material';

const ProductList = ({ products, onRemove }) => {
  if (products.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        border: '1px dashed #ddd',
        borderRadius: 1
      }}>
        <Typography color="textSecondary">
          Aucun produit ajouté
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Produit</TableCell>
            <TableCell align="right">Prix Unitaire</TableCell>
            <TableCell align="center">Quantité</TableCell>
            <TableCell align="right">Remise</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell width={40}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((item, index) => {
            // Conversion des valeurs en nombres si nécessaire
            const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            const discount = typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount;
            
            return (
              <TableRow key={index}>
                <TableCell>
                  <Typography fontWeight="bold">{item.product.designation}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.product.reference}
                  </Typography>
                </TableCell>
                <TableCell align="right">{unitPrice.toFixed(2)} F</TableCell>
                <TableCell align="center">{quantity}</TableCell>
                <TableCell align="right">{discount}%</TableCell>
                <TableCell align="right">
                  {(quantity * unitPrice * (1 - discount/100)).toFixed(2)} F
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => onRemove(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductList;