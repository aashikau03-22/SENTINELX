import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Search, Download, Plus, Filter,
  ExternalLink, RefreshCw, X, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { SocialCandidate, Sector, Brand } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AiModelBadge } from '../components/ui/AiModelBadge';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';

export const SocialThreatMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<SocialCandidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filters
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Analyze Candidate Modal
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [newPlatform, setNewPlatform] = useState('Twitter');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newProfileUrl, setNewProfileUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBrandId, setNewBrandId] = useState<number | ''>('');
  const [newSectorId, setNewSectorId] = useState('banking');
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [candData, secData, brandData] = await Promise.all([
        api.getSocialCandidates({
          sector_id: selectedSector || undefined,
          brand_id: selectedBrand ? parseInt(selectedBrand, 10) : undefined,
          platform: selectedPlatform || undefined,
          severity: selectedSeverity || undefined,
          search: searchQuery || undefined,
          limit: 100
        }),
        api.getSectors(),
        api.getBrands()
      ]);
      setCandidates(candData.items || []);
      setTotalCount(candData.total || 0);
      setSectors(secData);
      setBrands(brandData);
    } catch (err) {
      console.error('Failed to load social candidates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSector, selectedBrand, selectedPlatform, selectedSeverity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle || !newDisplayName) return;
    setAnalyzing(true);
    try {
      await api.analyzeSocial({
        platform: newPlatform,
        display_name: newDisplayName,
        handle: newHandle.replace('@', ''),
        profile_url: newProfileUrl || `https://${newPlatform.toLowerCase()}.com/${newHandle.replace('@', '')}`,
        description: newDescription,
        brand_id: newBrandId ? Number(newBrandId) : undefined,
        sector_id: newSectorId,
        source_type: 'manual'
      });
      setShowAnalyzeModal(false);
      setNewDisplayName('');
      setNewHandle('');
      setNewProfileUrl('');
      setNewDescription('');
      loadData();
    } catch (err) {
      console.error('Error analyzing candidate', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Social Media Threat Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detect and triage lookalike accounts, fraudulent support handles, and profile impersonation.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={api.getExportCsvUrl({ candidate_type: 'social', sector_id: selectedSector || undefined })}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </a>
          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sentinel-600 hover:bg-sentinel-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Analyze Profile
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter handle or name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sentinel-500"
            />
          </form>

          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Industry Sectors</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Brand filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Protected Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Social Platforms</option>
            <option value="Twitter">Twitter / X</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Telegram">Telegram</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">No social candidates found matching criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Handle & Display Name</th>
                  <th className="px-4 py-3">Matched Brand</th>
                  <th className="px-4 py-3">Threat Category</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">AI Prediction</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {candidates.map((c) => {
                  const finding = c.finding;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {c.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          @{c.handle}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {c.display_name}
                        </div>
                        {c.profile_url && (
                          <a
                            href={c.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sentinel-600 hover:underline flex items-center gap-1 font-mono truncate max-w-xs mt-0.5"
                          >
                            {c.profile_url}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {c.brand_name || 'Apex Bank'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {finding?.threat_category || 'Suspected Lookalike Profile'}
                      </td>
                      <td className="px-4 py-3">
                        {finding ? (
                          <SeverityBadge
                            severity={finding.severity}
                            isExcluded={finding.is_official_excluded}
                            score={finding.risk_score}
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">Unassessed</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AiModelBadge
                          prediction={finding?.ai_prediction?.prediction}
                          confidence={finding?.ai_prediction?.confidence}
                          fakeProbability={finding?.ai_prediction?.fake_probability}
                          isExcluded={finding?.is_official_excluded}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {finding ? (
                          <StatusBadge status={finding.status} />
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {finding ? (
                          <button
                            onClick={() => navigate(`/investigations?id=${finding.id}`)}
                            className="px-2.5 py-1 text-xs font-semibold text-sentinel-600 hover:text-sentinel-700 hover:bg-sentinel-50 rounded transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Analyze Candidate */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Analyze Social Candidate</h3>
              <button onClick={() => setShowAnalyzeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAnalyzeSubmit} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Twitter">Twitter / X</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Telegram">Telegram</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Sector</label>
                  <select
                    value={newSectorId}
                    onChange={(e) => setNewSectorId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Bank 24/7 Support"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Profile Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="@apexbank_support"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Profile Bio / Description</label>
                <textarea
                  rows={2}
                  placeholder="Official refund desk and support helpline..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAnalyzeModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="px-4 py-1.5 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {analyzing ? 'Evaluating...' : 'Run Detection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
