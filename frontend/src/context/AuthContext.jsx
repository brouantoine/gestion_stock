// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    role: null,
    first_name: '',
    last_name: '',
    email: '',
    est_actif: false
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const { data } = await axios.get('http://localhost:8000/api/user/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser({
            id: data.id,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            est_actif: data.est_actif
          });
        }
      } catch (error) {
        console.error("Erreur d'authentification", error);
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await axios.post('http://localhost:8000/api/token/', credentials);
      localStorage.setItem('access_token', data.access);
      
      const { data: userData } = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${data.access}` }
      });

      const completeUser = {
        id: userData.id,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        est_actif: userData.est_actif
      };

      setUser(completeUser);
      navigate('/dashboard');
    } catch (error) {
      console.error("Échec de la connexion", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser({
      id: null,
      role: null,
      first_name: '',
      last_name: '',
      email: '',
      est_actif: false
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAdmin: user?.role === 'admin' // Ajout pratique
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};