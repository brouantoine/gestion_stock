import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import ProductTable from '../components/produits/ProductTable';
import ProductForm from '../components/produits/ProductForm';
import CustomDialog from '../components/shared/CustomDialog';

const ProduitListPage = () => {
  const [products] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Logique de fetch...

  const handleCreate = () => {
    setCurrentProduct(null);
    setOpenForm(true);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setOpenForm(true);
  };

  const handleSubmit = async (formData) => {
    // Logique de sauvegarde...
    setOpenForm(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Gestion des Produits</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleCreate}
        >
          Nouveau Produit
        </Button>
      </Box>

      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={(p) => console.log('Delete', p)}
        onView={(p) => console.log('View', p)}
      />

      <CustomDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={currentProduct ? 'Modifier Produit' : 'Nouveau Produit'}
      >
        <ProductForm
          product={currentProduct}
          onSubmit={handleSubmit}
          onCancel={() => setOpenForm(false)}
        />
      </CustomDialog>
    </Paper>
  );
};

export default ProduitListPage;