// src/components/UI/Table.jsx
import React from 'react';

const Table = ({ data, columns }) => {
  return (
    <table className="styled-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((item) => (
          <tr key={item.id}>
            {columns.map((col) => (
              <td key={`${item.id}-${col.accessor}`}>
                {col.cell ? col.cell(item) : item[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;