import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DemoBanner } from '../ui/DemoBanner';
import { Sector } from '../../types';
import { api } from '../../services/api';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Sync selected sector from URL path (e.g. /sector/:id)
  useEffect(() => {
    const match = location.pathname.match(/\/sector\/([^/]+)/);
    if (match) {
      setSelectedSectorId(match[1]);
    } else if (location.pathname === '/') {
      setSelectedSectorId(null);
    }
  }, [location.pathname]);

  const fetchSectors = async () => {
    try {
      const data = await api.getSectors();
      setSectors(data);
    } catch (err) {
      console.error('Failed to load sectors', err);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Persistent Demo Mode Banner */}
      <DemoBanner onSeedSuccess={fetchSectors} />

      <div className="flex flex-1 relative">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sectors={sectors}
          selectedSectorId={selectedSectorId}
          onSelectSector={setSelectedSectorId}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(true)}
            sectors={sectors}
            selectedSectorId={selectedSectorId}
            onSelectSector={setSelectedSectorId}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet context={{ sectors, refreshSectors: fetchSectors, selectedSectorId }} />
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
              <span>SentinelX — Multi-Sector Digital Risk Protection Platform</span>
              <span className="font-mono text-[11px] text-slate-400">REST API v1.0 • SQLite Persistent Storage • Demo Dataset</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
