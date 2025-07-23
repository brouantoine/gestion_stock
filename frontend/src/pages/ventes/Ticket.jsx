import React, { forwardRef } from 'react';
import { Box, Typography, Divider } from '@mui/material';

const Ticket = forwardRef(({ vente }, ref) => {
  if (!vente) return null;

  const formatCurrency = (amount) => {
    const number = parseFloat(amount);
    return isNaN(number) ? '0.00 FCFA' : `${number.toFixed(2)} FCFA`;
  };

  const calculTotal = () => {
    return vente.lignes?.reduce((total, ligne) => {
      const prix = parseFloat(ligne.prix_unitaire) || 0;
      const qte = parseInt(ligne.quantite) || 0;
      const remise = parseFloat(ligne.remise_ligne) || 0;
      const totalLigne = prix * qte * (1 - remise / 100);
      return total + totalLigne;
    }, 0);
  };

  
  const lignes = Array.isArray(vente.lignes) ? vente.lignes : [];
  const total = lignes.length > 0 ? calculTotal() : 0;
  const client = vente.client?.nom_client || vente.nom_client || 'Client Direct';
  const dateVente = vente.date ? new Date(vente.date).toLocaleString('fr-FR') : '---';

  return (
    <Box
      ref={ref}
      sx={{
        p: 1,
        width: '72mm', // format ticket thermique
        fontSize: '11px',
        fontFamily: "'Courier New', monospace",
        backgroundColor: '#fff',
        color: '#000',
        lineHeight: 1.4,
        border: '1px solid #eee'
      }}
    >
      <Typography align="center" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
        GESTOCK CI
      </Typography>

      <Typography align="center" sx={{ fontSize: '12px' }}>
        Reçu de Vente
      </Typography>

      <Divider sx={{ my: 1 }} />

      <Typography>Date : {dateVente}</Typography>
      <Typography>Client : {client}</Typography>

      <Divider sx={{ my: 1 }} />

      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        borderBottom: '1px dashed #000',
        pb: 0.5,
        mb: 0.5
      }}>
        <span>Désignation</span>
        <span>Qté  Px  Mt</span>
      </Box>

      {vente.lignes?.map((ligne, i) => {
        const designation = ligne.designation || ligne.produit?.designation || 'Article';
        const qte = ligne.quantite;
        const prix = parseFloat(ligne.prix_unitaire) || 0;
        const remise = parseFloat(ligne.remise_ligne) || 0;
        const montant = prix * qte * (1 - remise / 100);
        return (
          <Box key={i} sx={{ mb: 0.5 }}>
            <Typography>{designation}</Typography>
            <Typography sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{qte} x {prix.toFixed(0)} FCFA</span>
              <span>{montant.toFixed(0)} FCFA</span>
            </Typography>
            {remise > 0 && (
              <Typography sx={{ fontStyle: 'italic' }}>Remise: -{remise}%</Typography>
            )}
          </Box>
        );
      })}

      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

      <Typography align="right" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
        TOTAL : {formatCurrency(total)}
      </Typography>

      <Divider sx={{ my: 1 }} />

      <Typography align="center" sx={{ mt: 2 }}>
        Merci pour votre achat !
      </Typography>
    </Box>
  );
});

export default Ticket;
