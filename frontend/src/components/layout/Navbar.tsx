import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, User, Shield, CheckCircle,
  Landmark, ShoppingCart, GraduationCap, Radio, Building2, ChevronDown
} from 'lucide-react';
import { Sector } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  sectors: Sector[];
  selectedSectorId: string | null;
  onSelectSector: (id: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  sectors,
  selectedSectorId,
  onSelectSector
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/investigations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getSectorIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'landmark': return <Landmark className="w-4 h-4 text-emerald-500" />;
      case 'shoppingcart': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'graduationcap': return <GraduationCap className="w-4 h-4 text-amber-500" />;
      case 'radio': return <Radio className="w-4 h-4 text-purple-500" />;
      case 'building2': return <Building2 className="w-4 h-4 text-sky-500" />;
      default: return <Shield className="w-4 h-4 text-sentinel-500" />;
    }
  };

  const activeSector = sectors.find(s => s.id === selectedSectorId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search protected brands, candidates, package IDs..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sentinel-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Right: Sector Switcher, Notifications, Analyst Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Active Sector Quick Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 transition-colors"
            >
              {activeSector ? (
                <>
                  {getSectorIcon(activeSector.icon)}
                  <span className="hidden sm:inline font-semibold">{activeSector.name}</span>
                  <span className="sm:hidden font-semibold">{activeSector.name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-sentinel-600" />
                  <span className="font-semibold">All 5 Sectors</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Sector Dashboard
                </div>
                <button
                  onClick={() => { onSelectSector(null); setDropdownOpen(false); navigate('/'); }}
                  className="w-full text-left px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Global Overview (All Sectors)</span>
                </button>
                {sectors.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSector(s.id);
                      setDropdownOpen(false);
                      navigate(`/sector/${s.id}`);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center justify-between ${
                      selectedSectorId === s.id ? 'bg-sentinel-50 text-sentinel-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {getSectorIcon(s.icon)}
                      <span className="truncate">{s.name}</span>
                    </span>
                    {selectedSectorId === s.id && <CheckCircle className="w-3.5 h-3.5 text-sentinel-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analyst Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sentinel-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SC
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-900">Sarah Chen</div>
              <div className="text-[11px] text-slate-500">Lead SOC Analyst</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
