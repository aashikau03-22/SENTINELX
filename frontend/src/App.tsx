import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { SectorDashboard } from './pages/SectorDashboard';
import { BrandProfiles } from './pages/BrandProfiles';
import { BrandDetail } from './pages/BrandDetail';
import { SocialThreatMonitor } from './pages/SocialThreatMonitor';
import { AppThreatMonitor } from './pages/AppThreatMonitor';
import { ThreatIntelligenceGraph } from './pages/ThreatIntelligenceGraph';
import { InvestigationQueue } from './pages/InvestigationQueue';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { DataSources } from './pages/DataSources';
import { CustomSectorBuilder } from './pages/CustomSectorBuilder';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewDashboard />} />
          <Route path="sector/:sectorId" element={<SectorDashboard />} />
          <Route path="brands" element={<BrandProfiles />} />
          <Route path="brands/:brandId" element={<BrandDetail />} />
          <Route path="social-monitor" element={<SocialThreatMonitor />} />
          <Route path="app-monitor" element={<AppThreatMonitor />} />
          <Route path="threat-graph" element={<ThreatIntelligenceGraph />} />
          <Route path="investigations" element={<InvestigationQueue />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="sources" element={<DataSources />} />
          <Route path="custom-sector" element={<CustomSectorBuilder />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
