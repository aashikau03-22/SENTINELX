import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Globe, Smartphone, ShieldCheck, Plus, Trash2,
  ExternalLink, Layers, CheckCircle2, AlertTriangle, Fingerprint
} from 'lucide-react';
import { api } from '../services/api';
import { Brand } from '../types';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';

export const BrandDetail: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(null);

  // Quick Add Social Asset Modal
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState('Twitter');
  const [socialHandle, setSocialHandle] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  // Quick Add App Asset Modal
  const [showAddApp, setShowAddApp] = useState(false);
  const [appName, setAppName] = useState('');
  const [appStore, setAppStore] = useState('Google Play');
  const [appPackageId, setAppPackageId] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appDev, setAppDev] = useState('');

  const loadBrand = async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const data = await api.getBrand(parseInt(brandId, 10));
      setBrand(data);
    } catch (err) {
      console.error('Failed to load brand detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !socialHandle) return;
    try {
      await api.addSocialAsset(brand.id, {
        platform: socialPlatform,
        handle: socialHandle.replace('@', ''),
        profile_url: socialUrl || `https://${socialPlatform.toLowerCase()}.com/${socialHandle.replace('@', '')}`,
        is_primary: false
      });
      setShowAddSocial(false);
      setSocialHandle('');
      setSocialUrl('');
      loadBrand();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSocial = async (assetId: number) => {
    if (!brand) return;
    try {
      await api.deleteSocialAsset(brand.id, assetId);
      loadBrand();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !appPackageId) return;
    try {
      await api.addAppAsset(brand.id, {
        app_name: appName || `${brand.name} App`,
        store: appStore,
        package_id: appPackageId.trim(),
        app_url: appUrl || `https://play.google.com/store/apps/details?id=${appPackageId.trim()}`,
        developer_name: appDev || brand.official_developer || brand.name
      });
      setShowAddApp(false);
      setAppName('');
      setAppPackageId('');
      setAppUrl('');
      loadBrand();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApp = async (assetId: number) => {
    if (!brand) return;
    try {
      await api.deleteAppAsset(brand.id, assetId);
      loadBrand();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Brand profile not found.</p>
        <button onClick={() => navigate('/brands')} className="mt-4 text-sm text-sentinel-600 font-semibold">
          Return to Brands
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/brands')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Brands
        </button>
      </div>

      {/* Brand Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sentinel-50 text-sentinel-700 border border-sentinel-200">
                {brand.sector_id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active Protection
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{brand.name}</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">{brand.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/investigations?brand_id=${brand.id}`)}
              className="px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs"
            >
              View Associated Findings ({brand.findings_count || 0})
            </button>
          </div>
        </div>

        {/* Identity Fingerprint summary bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Primary Domain</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">{brand.official_website}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Official Developer Entity</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">{brand.official_developer || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-medium">Approved Whitelist Domains</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">{brand.approved_domains?.join(', ') || 'None'}</div>
          </div>
        </div>
      </div>

      {/* Two Column Asset Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Social Assets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sentinel-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Official Social Accounts</h3>
              </div>
              <button
                onClick={() => setShowAddSocial(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sentinel-700 bg-sentinel-50 hover:bg-sentinel-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Handle
              </button>
            </div>

            <div className="space-y-2.5">
              {brand.social_assets?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No official social accounts registered.</p>
              ) : (
                brand.social_assets?.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">@{s.handle}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {s.platform}
                        </span>
                        {s.is_primary && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Primary
                          </span>
                        )}
                      </div>
                      <a
                        href={s.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs font-mono"
                      >
                        {s.profile_url}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteSocial(s.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Remove asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Verified Mobile App Assets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Official Mobile Applications</h3>
              </div>
              <button
                onClick={() => setShowAddApp(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add App
              </button>
            </div>

            <div className="space-y-2.5">
              {brand.app_assets?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No official mobile apps registered.</p>
              ) : (
                brand.app_assets?.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{a.app_name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {a.store}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Package: <strong className="text-slate-800">{a.package_id}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Developer: {a.developer_name}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApp(a.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Remove asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Social Handle */}
      {showAddSocial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Add Official Social Asset</h3>
            <form onSubmit={handleAddSocial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Platform</label>
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Twitter">Twitter / X</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Telegram">Telegram</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Official Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="@brandname"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Profile URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSocial(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sentinel-600 text-white rounded-lg font-semibold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add App Asset */}
      {showAddApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Add Official Mobile App</h3>
            <form onSubmit={handleAddApp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Store</label>
                <select
                  value={appStore}
                  onChange={(e) => setAppStore(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Google Play">Google Play</option>
                  <option value="Apple App Store">Apple App Store</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Package Identifier / Bundle ID *</label>
                <input
                  type="text"
                  required
                  placeholder="com.brand.mobile"
                  value={appPackageId}
                  onChange={(e) => setAppPackageId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">App Display Name</label>
                <input
                  type="text"
                  placeholder={`${brand.name} Mobile Banking`}
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Official Publisher / Developer</label>
                <input
                  type="text"
                  placeholder={brand.official_developer || brand.name}
                  value={appDev}
                  onChange={(e) => setAppDev(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddApp(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Save App Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
