import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FormOutlined,
  HeartOutlined,
  LineChartOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      key: '/',
      icon: <FormOutlined />,
      label: '每日记录',
    },
    {
      key: '/exercises',
      icon: <HeartOutlined />,
      label: '康复训练',
    },
    {
      key: '/trends',
      icon: <LineChartOutlined />,
      label: '趋势分析',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史数据',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A373', fontSize: '20px', fontWeight: 'bold' }}>
          🏥 {collapsed ? '健' : '健康记录'}
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#FAFAF5', // Warm theme from original
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
