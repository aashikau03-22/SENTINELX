import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListChecks, Search, Download, Filter, Eye,
  ShieldCheck, AlertTriangle, Clock, CheckCircle2,
  X, MessageSquare, History, User, Send, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Finding, FindingEvidence, ReviewNote, ReviewHistory, Sector } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';

export const InvestigationQueue: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFindingId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Finding Dossier Modal
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('Needs Review');
  const [analystNote, setAnalystNote] = useState('');
  const [addToApproved, setAddToApproved] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadFindings = async () => {
    setLoading(true);
    try {
      const [fData, secData] = await Promise.all([
        api.getFindings({
          status: selectedStatus || undefined,
          severity: selectedSeverity || undefined,
          sector_id: selectedSector || undefined,
          limit: 100
        }),
        api.getSectors()
      ]);
      setFindings(fData);
      setSectors(secData);

      // Auto-open if query param is set
      if (initialFindingId) {
        openFindingModal(parseInt(initialFindingId, 10));
      }
    } catch (err) {
      console.error('Failed to load findings queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [selectedStatus, selectedSeverity, selectedSector]);

  const openFindingModal = async (id: number) => {
    setModalLoading(true);
    try {
      const data = await api.getFinding(id);
      setSelectedFinding(data);
      setNewStatus(data.status);
      setAnalystNote('');
      setAddToApproved(false);
    } catch (err) {
      console.error('Failed to load finding dossier', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.updateFindingStatus(selectedFinding.id, {
        status: newStatus,
        analyst: 'Sarah Chen (SOC Lead)',
        notes: analystNote,
        add_to_approved_assets: newStatus === 'False Positive' ? addToApproved : false
      });
      setSelectedFinding(updated);
      setAnalystNote('');
      loadFindings();
    } catch (err) {
      console.error('Failed to update case status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = findings.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.candidate_name?.toLowerCase().includes(term) ||
      f.candidate_url?.toLowerCase().includes(term) ||
      f.brand_name?.toLowerCase().includes(term) ||
      f.threat_category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Investigation Queue & Case Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review suspicious findings, verify explainable heuristic signals, assign statuses, and maintain audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl({
              status: selectedStatus || undefined,
              severity: selectedSeverity || undefined,
              sector_id: selectedSector || undefined
            })}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Cases to CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search finding candidates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sentinel-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Case Statuses</option>
            <option value="New">New</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Confirmed Impersonation">Confirmed Impersonation</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>

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

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Cases Queue Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">No cases match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Target Brand</th>
                  <th className="px-4 py-3">Candidate Identifier</th>
                  <th className="px-4 py-3">Threat Category</th>
                  <th className="px-4 py-3">Risk Assessment</th>
                  <th className="px-4 py-3">Case Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-400 text-xs">
                      #{f.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.candidate_type === 'social' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {f.candidate_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {f.brand_name || 'Protected Brand'}
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
                        onClick={() => openFindingModal(f.id)}
                        className="px-3 py-1 bg-sentinel-50 hover:bg-sentinel-100 text-sentinel-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Open Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finding Detail Dossier Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-400">CASE #{selectedFinding.id}</span>
                  <SeverityBadge
                    severity={selectedFinding.severity}
                    isExcluded={selectedFinding.is_official_excluded}
                    score={selectedFinding.risk_score}
                  />
                  <StatusBadge status={selectedFinding.status} />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {selectedFinding.candidate_name || 'Candidate Investigation'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-6 text-xs sm:text-sm">
              {/* Target Brand & Candidate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 text-xs">Target Brand</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedFinding.brand_name} ({selectedFinding.sector_id})</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Candidate Distribution URL</div>
                  <div className="font-mono text-slate-800 mt-0.5 truncate">{selectedFinding.candidate_url}</div>
                </div>
              </div>

              {/* Exclusion Notice if Applicable */}
              {selectedFinding.is_official_excluded && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Verified Official Asset Exclusion</strong>
                    {selectedFinding.exclusion_reason}
                  </div>
                </div>
              )}

              {/* Explainable Evidence Signals Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3">
                  Transparent Heuristic Evidence Signals ({selectedFinding.evidence?.length || 0})
                </h4>
                <div className="space-y-2.5">
                  {selectedFinding.evidence?.map((ev) => (
                    <div key={ev.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">{ev.signal_name}</span>
                        <span className="font-mono text-slate-500 font-semibold">
                          Score: <strong className="text-slate-900">{ev.score}</strong> • Weight: {ev.weight}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ev.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Steps Checklist */}
              {selectedFinding.recommended_steps?.length > 0 && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider mb-2">
                    Recommended Analyst Playbook
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-800 list-disc list-inside">
                    {selectedFinding.recommended_steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Analyst Decision & Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Update Case Status & Add Reviewer Notes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      <option value="New">New</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Confirmed Impersonation">Confirmed Impersonation</option>
                      <option value="False Positive">False Positive</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {newStatus === 'False Positive' && (
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="whitelist"
                        checked={addToApproved}
                        onChange={(e) => setAddToApproved(e.target.checked)}
                        className="rounded text-sentinel-600"
                      />
                      <label htmlFor="whitelist" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Add to approved whitelist
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">Analyst Notes & Rationale</label>
                  <textarea
                    rows={2}
                    placeholder="Enter investigation notes, domain WHOIS findings, or takedown reference ticket..."
                    value={analystNote}
                    onChange={(e) => setAnalystNote(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {updatingStatus ? 'Saving Case...' : 'Commit Status & Log Note'}
                  </button>
                </div>
              </form>

              {/* Review History Trail */}
              {selectedFinding.history && selectedFinding.history.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Case Audit History
                  </h4>
                  <div className="space-y-2">
                    {selectedFinding.history.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-lg border border-slate-100 bg-white text-xs flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {h.analyst} changed status to <strong className="text-sentinel-600">{h.new_status}</strong>
                          </div>
                          {h.notes && <p className="text-slate-500 mt-0.5">{h.notes}</p>}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
