import React, { useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle2, Database, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface DemoBannerProps {
  onSeedSuccess?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onSeedSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.seedDemoData();
      setSuccessMsg(`Demo data seeded across 5 sectors: ${res.summary.brands_count} brands, ${res.summary.findings_count} findings.`);
      if (onSeedSuccess) {
        onSeedSuccess();
      }
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Error seeding demo data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-navy-900 via-sentinel-950 to-navy-900 text-white px-4 py-2.5 text-xs sm:text-sm border-b border-sentinel-800 shadow-inner flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div className="flex items-center gap-1.5 font-medium truncate">
          <span className="font-bold tracking-wider uppercase text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
            Demo Mode
          </span>
          <span className="text-slate-300 hidden md:inline truncate">
            Findings are based on synthetic demonstration data. No live external surveillance claimed.
          </span>
          <span className="text-slate-300 md:hidden truncate">
            Synthetic demo environment.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {successMsg && (
          <span className="text-emerald-400 text-xs flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successMsg}
          </span>
        )}
        <button
          onClick={handleSeed}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-sentinel-600 hover:bg-sentinel-500 active:bg-sentinel-700 text-white rounded font-medium text-xs transition-all shadow-sm border border-sentinel-400/30 disabled:opacity-50 cursor-pointer"
          title="Seed synthetic demonstration candidates across all 5 sectors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Seeding...' : 'Load Demo Data'}
        </button>
      </div>
    </div>
  );
};
