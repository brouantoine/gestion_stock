// src/components/Loading.jsx
import { Spin } from 'antd';

const Loading = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(255, 255, 255, 0.7)',
      zIndex: 1000
    }}>
      <Spin size="large" tip="Chargement..." />
    </div>
  );
};

export default Loading;