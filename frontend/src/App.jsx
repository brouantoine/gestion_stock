import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import NavBar from './components/NavBar';
import ProduitList from './pages/Produits/ProduitList';
import CommandeList from './pages/commandes/CommandeList';
import NouvelleCommande from './pages/commandes/NouvelleCommande';
import DetailCommande from './pages/commandes/DetailCommande';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientList from './pages/Clients/ClientList';
import ClientDetail from './pages/Clients/ClientDetail';
import UtilisateurList from './pages/utilisateurs/utilisateurList';
import UtilisateurPerformance from './pages/utilisateurs/UtilisateurPerformance';
import StatistiquesBoite from './pages/statistiques/statistiques';
import VenteCommande from './pages/ventes/VenteCommande';
import Configuration from './config/Configuration';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={
          <NavBar>
            <Dashboard />
          </NavBar>
        } />
        
        <Route path="*" element={
          <NavBar>
            <Routes>
              <Route path="/produits" element={<ProduitList />} />
              <Route path="/commandes" element={<CommandeList />} />
              <Route path="/commandes/nouveau" element={<NouvelleCommande />} />
              <Route path="/commandes/:id" element={<DetailCommande />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/utilisateurs" element={<UtilisateurList />} />
              <Route path="/utilisateurs/:userId/performance" element={<UtilisateurPerformance />} />
              <Route path="/statistiques" element={<StatistiquesBoite />} />
              <Route path="/ventecommande" element={<VenteCommande />} />
              <Route path="/configuration" element={<Configuration />} />
            </Routes>
          </NavBar>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;