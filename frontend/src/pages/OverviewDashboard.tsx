import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, AlertOctagon, Clock,
  CheckCircle2, Users, ArrowUpRight,
  Landmark, ShoppingCart, GraduationCap, Radio, Building2,
  TrendingUp, BarChart3, ExternalLink, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, SectorStatItem, ThreatTrendItem, Finding } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../components/ui/LoadingSkeleton';

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sectors, setSectors] = useState<SectorStatItem[]>([]);
  const [trends, setTrends] = useState<ThreatTrendItem[]>([]);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, secData, trendData, recData] = await Promise.all([
        api.getDashboardSummary(),
        api.getSectorsSummary(),
        api.getThreatTrends(),
        api.getRecentFindings(8)
      ]);
      setSummary(sumData);
      setSectors(secData);
      setTrends(trendData);
      setRecentFindings(recData);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSectorIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'landmark': return <Landmark className="w-5 h-5 text-emerald-600" />;
      case 'shoppingcart': return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case 'graduationcap': return <GraduationCap className="w-5 h-5 text-amber-600" />;
      case 'radio': return <Radio className="w-5 h-5 text-purple-600" />;
      case 'building2': return <Building2 className="w-5 h-5 text-sky-600" />;
      default: return <ShieldCheck className="w-5 h-5 text-sentinel-600" />;
    }
  };

  const getSectorThreatFocus = (id: string) => {
    switch (id) {
      case 'banking': return 'Bank impersonation, fake loan apps, payment clones, support fraud';
      case 'ecommerce': return 'Fake shopping brands, cloned storefronts, counterfeit product channels';
      case 'education': return 'Fake admission portals, scholarship scams, student app clones';
      case 'telecom': return 'Customer care impersonation, recharge app lookalikes, SIM swap lures';
      case 'government': return 'Fake welfare portals, department lookalikes, unauthorized citizen apps';
      default: return 'Digital impersonation, brand clones, lookalike applications';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Digital Risk Protection Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global monitoring overview across all 5 registered industry sectors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards (6 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Protected Brands */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Brands</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.protected_brands ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active registered</div>
        </div>

        {/* Candidates Analysed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Analysed</span>
            <BarChart3 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.candidates_analysed ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Social & app profiles</div>
        </div>

        {/* Actionable Potential Threats */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Threats</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary?.potential_threats ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Potential risks</div>
        </div>

        {/* High / Critical Findings */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>High/Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{summary?.high_critical_findings ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">High priority alerts</div>
        </div>

        {/* Awaiting Review */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>In Triage</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{summary?.awaiting_review ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting review</div>
        </div>

        {/* Resolved / Whitelisted */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{summary?.resolved_findings ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Closed or verified</div>
        </div>
      </div>

      {/* Five Sector Prominent Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sector Protection Centers</h2>
            <p className="text-xs text-slate-500">
              Select a specialized industry sector to enter its dedicated monitoring and rule engine dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {sectors.map((s) => (
            <div
              key={s.sector_id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-sentinel-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getSectorIcon(s.icon)}
                  </div>
                  {s.high_critical_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {s.high_critical_count} High
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-sentinel-600 transition-colors">
                  {s.sector_name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {getSectorThreatFocus(s.sector_id)}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Brands: <strong className="text-slate-900">{s.brand_count}</strong></span>
                  <span>Findings: <strong className="text-slate-900">{s.findings_count}</strong></span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/sector/${s.sector_id}`)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-sentinel-600 text-slate-700 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-200 hover:border-sentinel-600 cursor-pointer"
              >
                <span>Monitor Threats</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics: Threat Trends & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sentinel-600" />
                Detection Velocity (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthetic candidate findings correlated across social platforms and app stores.
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f76e2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f76e2" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="social_threats" name="Social Threats" stroke="#4f76e2" fillOpacity={1} fill="url(#colorSocial)" />
                <Area type="monotone" dataKey="app_threats" name="Mobile App Threats" stroke="#10b981" fillOpacity={1} fill="url(#colorApp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sentinel-500"></span> Social Threats
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Mobile App Threats
            </span>
          </div>
        </div>

        {/* Sector Comparison Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Findings by Sector
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cross-sector threat volume comparison.
            </p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectors} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="sector_name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(val) => val.split(' ')[0]}
                    width={65}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="findings_count" name="Total Findings" fill="#4f76e2" radius={[0, 4, 4, 0]}>
                    {sectors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f76e2' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 text-center italic mt-2">
            Note: Sectors with more simulated candidates reflect higher demo volume.
          </div>
        </div>
      </div>

      {/* Recent Triage Findings Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Recent Priority Findings</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest suspicious candidates requiring analyst assessment.
            </p>
          </div>
          <button
            onClick={() => navigate('/investigations')}
            className="text-xs font-semibold text-sentinel-600 hover:text-sentinel-700 flex items-center gap-1"
          >
            <span>View All Queue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Candidate Asset</th>
                <th className="px-4 py-3">Threat Category</th>
                <th className="px-4 py-3">Risk / Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {recentFindings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No findings recorded. Click "Load Demo Data" above to populate candidates.
                  </td>
                </tr>
              ) : (
                recentFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.candidate_type === 'social' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {f.candidate_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {f.brand_name || 'Apex Bank'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 truncate max-w-xs">
                        {f.candidate_name || 'Candidate'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                        {f.candidate_url}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.threat_category}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={f.severity} isExcluded={f.is_official_excluded} score={f.risk_score} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/investigations?id=${f.id}`)}
                        className="px-2.5 py-1 text-xs font-medium text-sentinel-600 hover:text-sentinel-700 hover:bg-sentinel-50 rounded transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
