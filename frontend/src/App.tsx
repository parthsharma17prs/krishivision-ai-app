import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DiseasePage } from './features/disease/DiseasePage';
import { LiveImageDashboardPage } from './features/live_feed/LiveImageDashboardPage';
import { PestPage } from './features/pests/PestPage';
import { NutrientPage } from './features/nutrients/NutrientPage';
import { IrrigationPage } from './features/irrigation/IrrigationPage';
import { WeatherPage } from './features/weather/WeatherPage';
import { RiskPage } from './features/risks/RiskPage';
import { AssistantPage } from './features/assistant/AssistantPage';
import { IotSimulatorPage } from './features/iot/IotSimulatorPage';
import { ReportPage } from './features/reports/ReportPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { EdgeDashboardPage } from './features/edge/EdgeDashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Page */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Main Smart Farming Dashboard Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/disease" element={<DiseasePage />} />
          <Route path="/live-feed" element={<LiveImageDashboardPage />} />
          <Route path="/edge" element={<EdgeDashboardPage />} />
          <Route path="/pests" element={<PestPage />} />
          <Route path="/nutrients" element={<NutrientPage />} />
          <Route path="/irrigation" element={<IrrigationPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/risks" element={<RiskPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/iot-simulator" element={<IotSimulatorPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
