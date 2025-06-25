import { Table, InputNumber } from 'antd';

const LigneCommandeTable = ({ data, editable = false, onUpdate }) => {
  const columns = [
    {
      title: 'Produit',
      dataIndex: ['produit', 'nom'],
      key: 'produit'
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
      render: editable ? (value, record, index) => (
        <InputNumber 
          min={1} 
          value={value} 
          onChange={(val) => onUpdate(index, 'quantite', val)} 
        />
      ) : (value) => value
    },
    // ... autres colonnes ...
  ];

  return <Table columns={columns} dataSource={data} rowKey="id" pagination={false} />;
};

export default LigneCommandeTable;