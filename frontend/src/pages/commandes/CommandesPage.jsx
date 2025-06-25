import React from 'react';
import { Layout, Space } from 'antd';
import CommandeList from '../components/CommandeList';
import CommandeStats from '../components/CommandeStats';

const { Content } = Layout;

const CommandesPage = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <CommandeStats />
          <CommandeList />
        </Space>
      </Content>
    </Layout>
  );
};

export default CommandesPage;