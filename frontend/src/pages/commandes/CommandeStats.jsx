import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import commandeService from '../services/commandeService';

const CommandeStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await commandeService.getStatsCommandes();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic 
            title="Commandes ce mois" 
            value={stats.mois_courant} 
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="En attente" 
            value={stats.en_attente} 
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="Chiffre d'affaires (HT)" 
            value={stats.ca_ht} 
            precision={2} 
            suffix="€" 
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="Fournisseurs actifs" 
            value={stats.fournisseurs_actifs} 
          />
        </Card>
      </Col>
    </Row>
  );
};

export default CommandeStats;