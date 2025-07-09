import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { logout } from '../services/api/authService';
import { Spin } from 'antd';
import { useState, useEffect } from 'react';

const ProtectedRoute = () => {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');

  useEffect(() => {
    const validateToken = () => {
      if (!token || !user) {
        setIsValid(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        setIsValid(decoded.exp * 1000 > Date.now());
      } catch (e) {
        logout();
        setIsValid(false);
      }
    };

    validateToken();
  }, [token, user]);

  if (isValid === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;