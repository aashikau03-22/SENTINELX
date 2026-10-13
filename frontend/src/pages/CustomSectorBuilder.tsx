import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, ShieldAlert, CheckCircle2, AlertCircle,
  Sliders, ArrowRight, Layers
} from 'lucide-react';
import { api } from '../services/api';

export const CustomSectorBuilder: React.FC = () => {
  const navigate = useNavigate();

  const [sectorName, setSectorName] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Shield');
  const [threatCategories, setThreatCategories] = useState('Counterfeit Goods, Unofficial Channels, Lookalike Apps');
  const [checklist, setChecklist] = useState('Verify commercial trademark license, Check publisher business address');
  
  // Custom Initial Detection Rule
  const [ruleName, setRuleName] = useState('Lookalike Domain & Trademark Mismatch');
  const [ruleWeight, setRuleWeight] = useState(1.2);
  const [ruleThreshold, setRuleThreshold] = useState(0.70);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setSectorName(val);
    if (!sectorId || sectorId === sectorName.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
      setSectorId(val.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName || !sectorId || !description) {
      setErrorMsg('Sector name, ID, and description are required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cats = threatCategories.split(',').map(c => c.trim()).filter(Boolean);
      const checks = checklist.split(',').map(c => c.trim()).filter(Boolean);

      const res = await api.createSector({
        id: sectorId.toLowerCase().trim(),
        name: sectorName.trim(),
        description: description.trim(),
        icon,
        threat_categories: cats,
        recommended_checklist: checks,
        is_active: true
      });

      setSuccessMsg(`Sector '${res.name}' created successfully! Instantly integrated with detection engine and navigation.`);
      setTimeout(() => {
        navigate(`/sector/${res.id}`);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create custom sector.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Custom Sector Builder
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dynamically register new industry domains (e.g. Healthcare, Aviation, Luxury Retail) without rebuilding frontend routes.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sector Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Healthcare & Pharmaceuticals"
              value={sectorName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sector Identifier (Slug) *</label>
            <input
              type="text"
              required
              placeholder="healthcare"
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-sentinel-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Sector Threat Scope & Description *</label>
          <textarea
            rows={2}
            required
            placeholder="Protection against counterfeit medicine portals, unverified telemedicine apps, and physician impersonation..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dashboard Icon</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Shield">Shield (Default Defense)</option>
              <option value="Landmark">Landmark (Institutions)</option>
              <option value="ShoppingCart">ShoppingCart (Retail)</option>
              <option value="GraduationCap">GraduationCap (Academic)</option>
              <option value="Radio">Radio (Telecommunications)</option>
              <option value="Building2">Building2 (Public Services)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Threat Categories (Comma-separated)</label>
            <input
              type="text"
              value={threatCategories}
              onChange={(e) => setThreatCategories(e.target.value)}
              placeholder="Counterfeit Drugs, Fake Doctor Profiles, Lookalike Store"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Recommended Investigation Steps</label>
          <input
            type="text"
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
            placeholder="Verify medical license board, Inspect pharmacy merchant account (comma-separated)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
          />
        </div>

        {/* Baseline Detection Rule */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
            <Sliders className="w-4 h-4 text-sentinel-600" />
            <span>Initial Sector Detection Rule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Heuristic Weight</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="2.5"
                value={ruleWeight}
                onChange={(e) => setRuleWeight(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Threshold ({(ruleThreshold * 100).toFixed(0)}%)</label>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={ruleThreshold}
                onChange={(e) => setRuleThreshold(parseFloat(e.target.value))}
                className="w-full mt-2 accent-sentinel-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <span>{saving ? 'Creating Sector...' : 'Create & Activate Sector'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
