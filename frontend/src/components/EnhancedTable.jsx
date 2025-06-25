// src/components/EnhancedTable.jsx
import React, { useState } from 'react';

const EnhancedTable = ({ 
  data, 
  columns, 
  onSort, 
  onEdit,
  emptyMessage 
}) => {
  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (accessor) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
    onSort(accessor, direction);
  };

  return (
    <div className="table-responsive">
      <table className="enhanced-table">
        {/* ... implémentation similaire à SmartTable mais optimisée ... */}
      </table>
      {data.length === 0 && <div className="empty-table-message">{emptyMessage}</div>}
    </div>
  );
};

export default EnhancedTable;