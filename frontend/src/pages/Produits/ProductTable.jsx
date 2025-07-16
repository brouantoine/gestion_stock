import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Warning as WarningIcon
} from '@mui/icons-material';
import ProductActions from './ProductActions';

const ProductTable = ({ 
  produits, 
  sortConfig, 
  handleSort, 
  formatPrice, 
  formatStock, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  return (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
          <TableRow>
            <TableCell 
              sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
              onClick={() => handleSort('reference')}
            >
              <Box display="flex" alignItems="center">
                Référence
                {sortConfig.key === 'reference' && (
                  sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                )}
              </Box>
            </TableCell>
            
            <TableCell 
              sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 200 }}
              onClick={() => handleSort('designation')}
            >
              <Box display="flex" alignItems="center">
                Désignation
                {sortConfig.key === 'designation' && (
                  sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                )}
              </Box>
            </TableCell>
            
            <TableCell 
              align="right" 
              sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
              onClick={() => handleSort('prix_vente')}
            >
              <Box display="flex" alignItems="center" justifyContent="flex-end">
                Prix Vente
                {sortConfig.key === 'prix_vente' && (
                  sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                )}
              </Box>
            </TableCell>
            
            <TableCell 
              align="right" 
              sx={{ fontWeight: 'bold', cursor: 'pointer', minWidth: 120 }}
              onClick={() => handleSort('quantite_stock')}
            >
              <Box display="flex" alignItems="center" justifyContent="flex-end">
                Stock
                {sortConfig.key === 'quantite_stock' && (
                  sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
                )}
              </Box>
            </TableCell>
            
            <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>
              Unité
            </TableCell>
            
            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {produits.map((produit) => (
            <TableRow
              key={produit.id}
              hover
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { backgroundColor: '#f9f9f9' }
              }}
            >
              <TableCell>
                <Chip 
                  label={produit.reference} 
                  color="primary" 
                  size="small" 
                  variant="outlined" 
                />
              </TableCell>
              
              <TableCell>
                <Typography>{produit.designation}</Typography>
              </TableCell>
              
              <TableCell align="right">
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(produit.prix_vente)}
                </Typography>
              </TableCell>
              
              <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                  {produit.quantite_stock <= 5 && (
                    <Tooltip title="Stock critique">
                      <WarningIcon fontSize="small" color="warning" />
                    </Tooltip>
                  )}
                  <Chip
                    label={formatStock(produit.quantite_stock, 5)}
                    color={
                      produit.quantite_stock === 0 ? 'error' :
                      produit.quantite_stock <= 5 ? 'warning' : 'success'
                    }
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </TableCell>
              
              <TableCell>
                <Chip 
                  label={produit.unite_mesure} 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#e0e0e0',
                    textTransform: 'uppercase'
                  }} 
                />
              </TableCell>
              
              <TableCell>
                <ProductActions 
                  product={produit}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable;