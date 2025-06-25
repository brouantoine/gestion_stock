import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useApiData(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = `http://localhost:8000/api/${endpoint}/`;
    
    axios.get(apiUrl)
      .then(response => {
        setData(response.data);
      })
      .catch(err => {
        setError(`Échec du chargement des ${endpoint}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [endpoint]);

  return { data, loading, error };
}