export default function DataLoader({ loading, error, children }) {
    if (loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">{error}</div>;
    return children;
  }