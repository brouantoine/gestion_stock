import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import NavBar from './components/NavBar';
import ProduitList from './pages/Produits/ProduitList';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientList from './pages/Clients/ClientList';
import UtilisateurList from './pages/utilisateurs/utilisateurList';
import UtilisateurPerformance from './pages/utilisateurs/UtilisateurPerformance';
import StatistiquesBoite from './pages/statistiques/statistiques';
import VenteCommande from './pages/ventes/VenteCommande';
import Rapport from './config/Rapport';
import CommandesList from './pages/commandes/commandesListe';

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
              <Route path="/clients" element={<ClientList />} />
              <Route path="/utilisateurs" element={<UtilisateurList />} />
              <Route path="/utilisateurs/:userId/performance" element={<UtilisateurPerformance />} />
              <Route path="/statistiques" element={<StatistiquesBoite />} />
              <Route path="/ventecommande" element={<VenteCommande />} />
              <Route path="/rapport" element={<Rapport />} />
              <Route path="/commandes" element={<CommandesList />} />
            </Routes>
          </NavBar>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;