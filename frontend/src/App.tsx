import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import SensorNodePage from './pages/SensorNodePage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RiskMapPage from './pages/RiskMapPage';
import SettingsPage from './pages/SettingsPage';
import { useMockTelemetry } from './hooks/useMockTelemetry';
import type { Alert } from './types';

const App: React.FC = () => {
  const { state } = useMockTelemetry();
  
  const unacknowledgedCount = state ? state.alerts.filter((a: Alert) => !a.acknowledged).length : 0;
  const isConnected = state ? state.isConnected : false;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout alertCount={unacknowledgedCount} isConnected={isConnected} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sensor" element={<SensorNodePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/map" element={<RiskMapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
