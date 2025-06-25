import ProductActions from './ProductActions';
import SortableHeader from './SortableHeader'; // Ensure the correct path to SortableHeader
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography
} from '@mui/material';
import ErrorDisplay from './ErrorDisplay'; // Ensure the correct path to ErrorDisplay

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView, 
  sortConfig, 
  handleSort,
  loading,
  error
}) => {
  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <SortableHeader 
              field="reference" 
              label="Référence" 
              sortConfig={sortConfig} 
              onSort={handleSort} 
            />
            {/* Ajoutez d'autres en-têtes de colonne ici */}
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Chip label={product.reference} />
              </TableCell>
              {/* Autres cellules */}
              <TableCell>
                <ProductActions 
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
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