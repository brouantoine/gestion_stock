import React from 'react';

const SubmitButton = ({ transactionType, disabled, onSubmit }) => (
  <button
    className="submit-button"
    onClick={onSubmit}
    disabled={disabled}
  >
    Enregistrer {transactionType === 'VENTE_DIRECTE' ? 'la Vente' : 'la Commande'}
  </button>
);

export default SubmitButton;