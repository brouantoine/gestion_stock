import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    modules: [],
    loading: true,
    error: null
  });
  const navigate = useNavigate();

  const fetchAuthData = useCallback(async (token) => {
    try {
      const [userRes, modulesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/user/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/user/modules/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      return {
        user: userRes.data,
        modules: modulesRes.data.modules || []
      };
    } catch (error) {
      console.error("Erreur API:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const { user, modules } = await fetchAuthData(token);
        setAuthState({
          user,
          modules,
          loading: false,
          error: null
        });
      } catch (error) {
        localStorage.removeItem('access_token');
        setAuthState({
          user: null,
          modules: [],
          loading: false,
          error: error.response?.status === 401 ? "Session expirée" : "Erreur serveur"
        });
        navigate('/login');
      }
    };

    initializeAuth();
  }, [fetchAuthData, navigate]);

  const login = async (credentials) => {
  try {
    const { data } = await axios.post('http://localhost:8000/token/', {
      username: 'Assanvo',
      password: 'leaderyoung'
    });
    localStorage.setItem('access_token', data.access);
    
    const userRes = await axios.get('http://localhost:8000/user/', {
      headers: { Authorization: `Bearer ${data.access}` }
    });

    const modulesRes = await axios.get('http://localhost:8000/user/modules/', {
      headers: { Authorization: `Bearer ${data.access}` }
    });

    return {
      user: userRes.data,
      modules: modulesRes.data.modules
    };
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

  const logout = () => {
    localStorage.removeItem('access_token');
    setAuthState({
      user: null,
      modules: [],
      loading: false,
      error: null
    });
    navigate('/login');
  };

  const value = {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};