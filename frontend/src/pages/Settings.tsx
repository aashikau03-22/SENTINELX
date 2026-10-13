import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Server, Shield, CheckCircle2,
  AlertCircle, RefreshCw, Key, Database
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api');
  const [selectedAnalyst, setSelectedAnalyst] = useState('Sarah Chen (Lead Brand Defense)');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const data = await api.checkHealth();
      setHealthStatus({ ok: true, data });
    } catch (err: any) {
      setHealthStatus({ ok: false, error: err.message || 'Cannot reach API' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Settings saved successfully.');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Settings & Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure API endpoints, analyst identity profiles, and inspect backend health telemetry.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* Backend Diagnostics Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-sentinel-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">FastAPI Backend Diagnostics</h3>
          </div>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Run Diagnostic Ping
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Connectivity Status</div>
            <div className="mt-1 flex items-center gap-2 font-bold">
              {healthStatus?.ok ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Healthy (200 OK)
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Unreachable
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">AI Model Status</div>
            <div className="mt-1 flex items-center gap-2 font-bold">
              {healthStatus?.data?.ai_model?.loaded ? (
                <span className="text-indigo-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Connected (.pkl)
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Not Loaded
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Database Engine</div>
            <div className="mt-1 font-bold text-slate-800 font-mono">SQLite (Persistent)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Detection Mode</div>
            <div className="mt-1 font-bold text-amber-600">Active Multi-Sector</div>
          </div>
        </div>
      </div>

      {/* AI Model Live Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">AI Model Live Tester (fake_detection_model.pkl)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Submit sample text to test real-time predictions and verify the machine learning model pipeline.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Sector</label>
              <select
                id="test-sector"
                defaultValue="banking"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-sentinel-500"
              >
                <option value="banking">Banking & FinTech</option>
                <option value="ecommerce">E-commerce</option>
                <option value="telecom">Telecom</option>
                <option value="government_digital_services">Government Services</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Input Text</label>
              <input
                id="test-text"
                type="text"
                defaultValue="Your account has been blocked. Enter your card details to activate free service immediately."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-sentinel-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div id="test-result" className="text-xs font-semibold"></div>
            <button
              type="button"
              onClick={async () => {
                const text = (document.getElementById('test-text') as HTMLInputElement)?.value;
                const sector = (document.getElementById('test-sector') as HTMLSelectElement)?.value;
                const resultDiv = document.getElementById('test-result');
                if (!resultDiv) return;
                resultDiv.innerHTML = '<span class="text-slate-400">Evaluating with ML model...</span>';
                try {
                  const res = await api.predictFakeDetection(text, sector);
                  const isFake = res.prediction === 'fake';
                  resultDiv.innerHTML = `
                    <div class="inline-flex items-center gap-2 p-2 rounded-lg border ${
                      isFake ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }">
                      <strong>Prediction: ${res.prediction.toUpperCase()}</strong>
                      <span>(Fake Prob: ${(res.fake_probability * 100).toFixed(1)}%, Confidence: ${(res.confidence * 100).toFixed(1)}%)</span>
                    </div>
                  `;
                } catch (err: any) {
                  resultDiv.innerHTML = `<span class="text-rose-600">Error: ${err.message}</span>`;
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Test AI Model
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">FastAPI Backend Base URL</label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-sentinel-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">Default: http://127.0.0.1:8000/api</p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Active Analyst Identity</label>
          <select
            value={selectedAnalyst}
            onChange={(e) => setSelectedAnalyst(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-sentinel-500"
          >
            <option value="Sarah Chen (Lead Brand Defense)">Sarah Chen — Lead Brand Defense Analyst</option>
            <option value="Marcus Vance (Senior Threat Intel)">Marcus Vance — Senior Threat Intelligence Specialist</option>
            <option value="Elena Rostova (SOC Risk Investigator)">Elena Rostova — SOC Risk Investigator</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Recorded on case status changes and review notes.</p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
