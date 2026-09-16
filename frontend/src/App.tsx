import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DiseasePage } from './features/disease/DiseasePage';
import { PestPage } from './features/pests/PestPage';
import { NutrientPage } from './features/nutrients/NutrientPage';
import { IrrigationPage } from './features/irrigation/IrrigationPage';
import { WeatherPage } from './features/weather/WeatherPage';
import { RiskPage } from './features/risks/RiskPage';
import { AssistantPage } from './features/assistant/AssistantPage';
import { IotSimulatorPage } from './features/iot/IotSimulatorPage';
import { ReportPage } from './features/reports/ReportPage';
import { SettingsPage } from './features/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="disease" element={<DiseasePage />} />
          <Route path="pests" element={<PestPage />} />
          <Route path="nutrients" element={<NutrientPage />} />
          <Route path="irrigation" element={<IrrigationPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="risks" element={<RiskPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="iot-simulator" element={<IotSimulatorPage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
