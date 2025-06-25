// src/services/notifications.js
import { notification } from 'antd';
import io from 'socket.io-client';

const setupNotifications = () => {
  const socket = io('http://localhost:8000');
  
  socket.on('commande_updated', (data) => {
    notification.info({
      message: `Commande ${data.numero} mise à jour`,
      description: `Statut: ${data.statut}`,
    });
  });
};

export default setupNotifications;