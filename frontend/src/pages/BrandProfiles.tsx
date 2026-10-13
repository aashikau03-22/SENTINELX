import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Plus, Search, Globe, Smartphone, ShieldCheck,
  Trash2, ExternalLink, AlertCircle, X, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Brand, Sector } from '../types';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';

export const BrandProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Register Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [sectorId, setSectorId] = useState('banking');
  const [description, setDescription] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [approvedDomains, setApprovedDomains] = useState('');
  const [officialDeveloper, setOfficialDeveloper] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('Twitter');
  const [appPackageId, setAppPackageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [brandData, secData] = await Promise.all([
        api.getBrands(),
        api.getSectors()
      ]);
      setBrands(brandData);
      setSectors(secData);
    } catch (err) {
      console.error('Failed to load brands', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !officialWebsite) {
      setErrorMsg('Brand name and official website are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const domainsList = approvedDomains.split(',').map(d => d.trim()).filter(Boolean);
      const socialAssets = socialHandle ? [{
        platform: socialPlatform,
        handle: socialHandle.replace('@', ''),
        profile_url: `https://${socialPlatform.toLowerCase()}.com/${socialHandle.replace('@', '')}`,
        is_primary: true
      }] : [];

      const appAssets = appPackageId ? [{
        app_name: `${brandName} Mobile`,
        store: 'Google Play',
        package_id: appPackageId.trim(),
        app_url: `https://play.google.com/store/apps/details?id=${appPackageId.trim()}`,
        developer_name: officialDeveloper || brandName
      }] : [];

      await api.createBrand({
        name: brandName,
        sector_id: sectorId,
        description,
        official_website: officialWebsite,
        approved_domains: domainsList,
        official_developer: officialDeveloper,
        social_assets: socialAssets,
        app_assets: appAssets,
        monitoring_status: 'active'
      });

      setIsModalOpen(false);
      // Reset form
      setBrandName('');
      setDescription('');
      setOfficialWebsite('');
      setApprovedDomains('');
      setOfficialDeveloper('');
      setSocialHandle('');
      setAppPackageId('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create brand.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: number, brandName: string) => {
    if (!confirm(`Are you sure you want to delete brand '${brandName}'?`)) return;
    try {
      await api.deleteBrand(brandId, true);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error deleting brand.');
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSector = selectedSector === 'all' || b.sector_id === selectedSector;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.official_website.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Protected Brand Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain official brand identities, verified domains, legitimate social handles, and authorized mobile apps.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register New Brand
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brand profiles..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sentinel-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSector === 'all'
                ? 'bg-sentinel-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sectors
          </button>
          {sectors.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSector(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSector === s.id
                  ? 'bg-sentinel-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500">No protected brands matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrands.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {b.sector_id}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Monitoring
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{b.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {b.description || 'Enterprise protected entity.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Official Website:</span>
                    <a
                      href={b.official_website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sentinel-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                    >
                      {b.official_website.replace('https://', '')}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Official Assets:</span>
                    <span className="font-medium text-slate-800">
                      {b.social_assets.length} social • {b.app_assets.length} apps
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Findings Linked:</span>
                    <span className="font-semibold text-rose-600">
                      {b.findings_count || 0} alerts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`/brands/${b.id}`)}
                  className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-sentinel-50 text-sentinel-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-sentinel-300 text-center cursor-pointer"
                >
                  Identity Dossier
                </button>
                <button
                  onClick={() => handleDeleteBrand(b.id, b.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Brand Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register New Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Register Protected Brand</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBrand} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Acme FinTech Corp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sector *</label>
                  <select
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500 bg-white"
                  >
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Website *</label>
                  <input
                    type="url"
                    required
                    value={officialWebsite}
                    onChange={(e) => setOfficialWebsite(e.target.value)}
                    placeholder="https://acmepay.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Alternative Domains</label>
                <input
                  type="text"
                  value={approvedDomains}
                  onChange={(e) => setApprovedDomains(e.target.value)}
                  placeholder="acmepay.com, acme-online.com (comma separated)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Mobile Developer Name</label>
                <input
                  type="text"
                  value={officialDeveloper}
                  onChange={(e) => setOfficialDeveloper(e.target.value)}
                  placeholder="e.g. Acme Technologies Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-semibold text-slate-800 text-xs">Initial Assets for Identity Fingerprint</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Primary Social Handle</label>
                    <input
                      type="text"
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      placeholder="@acmepay"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Official Package ID</label>
                    <input
                      type="text"
                      value={appPackageId}
                      onChange={(e) => setAppPackageId(e.target.value)}
                      placeholder="com.acme.pay"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brand description and commercial focus..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sentinel-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Brand Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
