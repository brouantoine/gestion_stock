import React from 'react';

const ExportControls = ({ data, filename, columns }) => {
  const exportToCSV = () => {
    const headers = columns.map(col => col.header).join(',');
    const csvRows = data.map(item => 
      columns.map(col => `"${item[col.accessor]}"`).join(',')
    );
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.click();
  };

  return (
    <div className="export-controls">
      <button onClick={exportToCSV} className="export-btn">
        Exporter en CSV
      </button>
      <button onClick={exportToJSON} className="export-btn">
        Exporter en JSON
      </button>
    </div>
  );
};

export default ExportControls;