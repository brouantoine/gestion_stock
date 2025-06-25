// Remplacez l'import générique par des imports spécifiques
import {  Tag } from 'antd';

const statusColors = {
  BROUILLON: 'orange',
  VALIDEE: 'blue',
  EN_PREPARATION: 'purple',
  LIVREE: 'green',
  ANNULEE: 'red'
};

const StatusBadge = ({ status }) => (
  <Tag color={statusColors[status] || 'gray'}>
    {status.replace('_', ' ')}
  </Tag>
);

export default StatusBadge;