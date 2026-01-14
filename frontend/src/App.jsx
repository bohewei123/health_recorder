import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { store } from './store';
import MainLayout from './components/MainLayout';
import DailyRecord from './pages/DailyRecord';
import Exercises from './pages/Exercises';
import Trends from './pages/Trends';
import History from './pages/History';
import PainNotes from './pages/PainNotes';

const ThemeCssVars = () => {
  const { token } = antdTheme.useToken();

  useEffect(() => {
    document.body.style.setProperty('--app-bg', token.colorBgLayout);
    document.body.style.setProperty('--markdown-code-bg', token.colorFillTertiary);
    document.body.style.setProperty('--markdown-inline-code-bg', token.colorFillQuaternary);
    document.body.style.setProperty('--markdown-border', token.colorBorderSecondary);
    document.body.style.setProperty('--markdown-link', token.colorLink);
  }, [
    token.colorBgLayout,
    token.colorBorderSecondary,
    token.colorFillQuaternary,
    token.colorFillTertiary,
    token.colorLink,
  ]);

  return null;
};

const ThemedApp = () => {
  const mode = useSelector((state) => state.theme.mode);

  const themeConfig = useMemo(() => {
    return {
      algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#D4A373',
        fontFamily: "'Nunito', 'Noto Sans SC', sans-serif",
      },
    };
  }, [mode]);

  return (
    <ConfigProvider theme={themeConfig}>
      <ThemeCssVars />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DailyRecord />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="trends" element={<Trends />} />
            <Route path="history" element={<History />} />
            <Route path="pain-notes" element={<PainNotes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
};

export default App;
