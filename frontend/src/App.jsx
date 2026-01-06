import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store';
import MainLayout from './components/MainLayout';
import DailyRecord from './pages/DailyRecord';
import Exercises from './pages/Exercises';
import Trends from './pages/Trends';
import History from './pages/History';

// Warm theme colors
const theme = {
  token: {
    colorPrimary: '#D4A373',
    colorBgBase: '#ffffff',
    fontFamily: "'Nunito', 'Noto Sans SC', sans-serif",
  },
};

const App = () => {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DailyRecord />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="trends" element={<Trends />} />
              <Route path="history" element={<History />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
