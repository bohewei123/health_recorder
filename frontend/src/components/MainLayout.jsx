import React, { useState } from 'react';
import { Layout, Menu, Button, Switch, Space, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FormOutlined,
  HeartOutlined,
  LineChartOutlined,
  HistoryOutlined,
  BookOutlined,
  BulbOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleThemeMode } from '../store/themeSlice';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, colorBgLayout, colorPrimary, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme.mode);

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
    {
      key: '/pain-notes',
      icon: <BookOutlined />,
      label: '课程笔记',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: colorBgLayout }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme={mode === 'dark' ? 'dark' : 'light'}>
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colorPrimary,
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          🏥 {collapsed ? '健' : '健康记录'}
        </div>

        <Menu
          theme={mode === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <div style={{ paddingRight: 16 }}>
              <Space>
                {mode === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
                <Switch checked={mode === 'dark'} onChange={() => dispatch(toggleThemeMode())} />
              </Space>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgLayout,
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
