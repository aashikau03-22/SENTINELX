import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertCircle, Radio,
  Server, Shield, KeyRound, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { DataSource } from '../types';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';

export const DataSources: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const loadSources = async () => {
    setLoading(true);
    try {
      const [srcData, statData] = await Promise.all([
        api.getDataSources(),
        api.getSourcesStatus()
      ]);
      setSources(srcData);
      setStatusInfo(statData);
    } catch (err) {
      console.error('Failed to load data sources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.seedDemoData();
      setSeedResult(`Demonstration dataset populated successfully: ${res.summary.brands_count} protected brands, ${res.summary.candidates_analyzed} candidates across all 5 sectors.`);
      loadSources();
    } catch (err) {
      console.error(err);
      setSeedResult('Failed to seed demo data.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Data Ingest Channels & Connectors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Status of synthetic test streams, mock app scrapers, and enterprise third-party API connectors.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding All Sectors...' : 'Re-Seed Demo Dataset'}
        </button>
      </div>

      {seedResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {seedResult}
        </div>
      )}

      {/* Demo Mode Notice Box */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Platform Monitoring Mode: Synthetic Demonstration</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-3xl">
              SentinelX is currently running in local demonstration mode using fictional brands and synthesized candidate records across Banking, E-commerce, Education, Telecom, and Government domains.
              Production third-party connectors (Twitter/X API, Meta Graph, Google Play Developer API) require licensed enterprise credentials before initiating live scraping.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
              <span>Ingested Candidates: <strong className="text-white">{statusInfo?.total_candidates_ingested || 0}</strong></span>
              <span>Active Feeds: <strong className="text-emerald-400">{statusInfo?.active_sources_count || 0}</strong> / {statusInfo?.total_sources_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connectors Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Configured Source Connectors</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Connector Name</th>
                  <th className="px-4 py-3">Source Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ingested Count</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3">Integration Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.status.includes('Active')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {s.records_count}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                      {s.last_sync ? new Date(s.last_sync).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs leading-relaxed">
                      {s.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
