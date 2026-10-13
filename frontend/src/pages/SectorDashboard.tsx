import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Sliders, CheckSquare, Download,
  Layers, AlertTriangle, Globe, Smartphone,
  ExternalLink, Search
} from 'lucide-react';
import { api } from '../services/api';
import { Sector, SectorRule, Brand, Finding } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../components/ui/LoadingSkeleton';

export const SectorDashboard: React.FC = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState<Sector | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [rules, setRules] = useState<SectorRule[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'findings' | 'rules' | 'checklist'>('findings');
  const [searchTerm, setSearchTerm] = useState('');

  const loadSectorData = async () => {
    if (!sectorId) return;
    setLoading(true);
    try {
      const [secData, brandData, findData] = await Promise.all([
        api.getSector(sectorId),
        api.getBrands({ sector_id: sectorId }),
        api.getFindings({ sector_id: sectorId })
      ]);
      setSector(secData);
      setRules(secData.rules || []);
      setBrands(brandData);
      setFindings(findData);
    } catch (err) {
      console.error('Failed to load sector data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectorData();
  }, [sectorId]);

  const handleRuleToggle = async (ruleId: number, currentEnabled: boolean) => {
    if (!sectorId) return;
    try {
      const updated = await api.updateSectorRule(sectorId, ruleId, { is_enabled: !currentEnabled });
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    } catch (err) {
      console.error('Failed to update rule', err);
    }
  };

  const handleRuleThresholdChange = async (ruleId: number, newThreshold: number) => {
    if (!sectorId) return;
    try {
      const updated = await api.updateSectorRule(sectorId, ruleId, { threshold: newThreshold });
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    } catch (err) {
      console.error('Failed to update threshold', err);
    }
  };

  const toggleChecklistItem = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Sector not found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-sentinel-600 text-white rounded-lg text-sm"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  const filteredFindings = findings.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.candidate_name?.toLowerCase().includes(term) ||
      f.candidate_url?.toLowerCase().includes(term) ||
      f.threat_category?.toLowerCase().includes(term) ||
      f.brand_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sector Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sentinel-50 text-sentinel-700 border border-sentinel-200">
                Industry Domain
              </span>
              {sector.is_custom && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Custom Sector
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {sector.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {sector.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={api.getExportCsvUrl({ sector_id: sector.id })}
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Sector CSV
            </a>
          </div>
        </div>

        {/* Threat Categories Badges */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Target Threat Categories Monitored
          </div>
          <div className="flex flex-wrap gap-2">
            {sector.threat_categories?.map((cat, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sector KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Brands</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{brands.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Protected in this sector</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Candidates</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(sector.social_candidates_count || 0) + (sector.app_candidates_count || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {sector.social_candidates_count || 0} social • {sector.app_candidates_count || 0} apps
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Potential Threats</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{findings.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Detection hypotheses</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>High/Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {findings.filter(f => ['High', 'Critical'].includes(f.severity) && !f.is_official_excluded).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Urgent triage items</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'findings'
              ? 'border-sentinel-600 text-sentinel-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Sector Findings ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-sentinel-600 text-sentinel-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configurable Detection Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'border-sentinel-600 text-sentinel-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Investigation Checklist</span>
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter sector findings..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sentinel-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredFindings.length} findings
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Candidate Identifier</th>
                  <th className="px-4 py-3">Threat Category</th>
                  <th className="px-4 py-3">Risk / Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No findings found for this sector.
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          f.candidate_type === 'social' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {f.candidate_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {f.brand_name || 'Brand'}
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
                          Triage Case
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Configurable Detection Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900">Sector Detection Rules & Weights</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust heuristic detection thresholds and sensitivity weights. These rules act as detection hypotheses requiring analyst investigation.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{rule.rule_name}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rule.rule_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {rule.description}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Threshold Slider */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Threshold:</span>
                    <input
                      type="range"
                      min="0.4"
                      max="0.95"
                      step="0.05"
                      value={rule.threshold}
                      onChange={(e) => handleRuleThresholdChange(rule.id, parseFloat(e.target.value))}
                      className="w-24 accent-sentinel-600"
                    />
                    <span className="font-mono font-bold text-slate-700 w-8 text-right">
                      {(rule.threshold * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Enable / Disable Switch */}
                  <button
                    onClick={() => handleRuleToggle(rule.id, rule.is_enabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.is_enabled ? 'bg-sentinel-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                        rule.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Recommended Investigation Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900">Standard Operating Procedure Checklist</h3>
            <p className="text-xs text-slate-500 mt-1">
              Sector-specific triage guidelines recommended prior to escalating takedown requests or issuing customer advisories.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {sector.recommended_checklist?.map((step, idx) => (
              <div
                key={idx}
                onClick={() => toggleChecklistItem(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  checkedItems[idx]
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[idx]}
                  onChange={() => toggleChecklistItem(idx)}
                  className="mt-0.5 rounded text-sentinel-600 focus:ring-sentinel-500 w-4 h-4 cursor-pointer"
                />
                <span className={`text-sm ${checkedItems[idx] ? 'line-through text-slate-500' : ''}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
