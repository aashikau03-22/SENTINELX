import React, { useState, useEffect } from 'react';
import {
  FileBarChart, Download, BarChart2, PieChart,
  Layers, ShieldAlert, CheckCircle2, Globe, Smartphone
} from 'lucide-react';
import { api } from '../services/api';
import { Sector, Brand } from '../types';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';

export const ReportsAnalytics: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('banking');
  const [sectorReport, setSectorReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [secData, brandData] = await Promise.all([
          api.getSectors(),
          api.getBrands()
        ]);
        setSectors(secData);
        setBrands(brandData);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const loadSectorReport = async (sId: string) => {
    setLoading(true);
    try {
      const data = await api.getSectorReport(sId);
      setSectorReport(data);
    } catch (err) {
      console.error('Failed to load sector report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSectorId) {
      loadSectorReport(selectedSectorId);
    }
  }, [selectedSectorId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Security Intelligence Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditable compliance exports, sector threat distribution, and brand protection summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl({ sector_id: selectedSectorId })}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Sector CSV Dossier
          </a>
        </div>
      </div>

      {/* Sector Selection Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Select Domain Report:</span>
          <select
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            className="text-xs sm:text-sm p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
          >
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Generated from persistent local SQLite database.
        </div>
      </div>

      {/* Report Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : sectorReport ? (
        <div className="space-y-6">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Brands</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{sectorReport.stats?.total_brands}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Candidates Evaluated</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{sectorReport.stats?.total_candidates}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {sectorReport.stats?.social_candidates_analyzed} social • {sectorReport.stats?.app_candidates_analyzed} apps
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Potential Findings</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{sectorReport.stats?.total_findings}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Official Excluded Assets</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{sectorReport.stats?.official_excluded}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">False positives eliminated</div>
            </div>
          </div>

          {/* Breakdown Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Severity Breakdown</h3>
              <div className="space-y-2.5 text-xs">
                {Object.entries(sectorReport.stats?.severity_distribution || {}).map(([sev, count]) => (
                  <div key={sev} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">{sev}</span>
                    <span className="font-mono font-bold text-slate-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Case Status Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Triage Case Outcomes</h3>
              <div className="space-y-2.5 text-xs">
                {Object.entries(sectorReport.stats?.status_distribution || {}).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">{st}</span>
                    <span className="font-mono font-bold text-slate-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
