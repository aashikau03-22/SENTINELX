import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, Globe, Smartphone,
  Network, ListChecks, FileBarChart, Database,
  Settings, Layers, PlusCircle, X, ChevronRight,
  Landmark, ShoppingCart, GraduationCap, Radio, Building2
} from 'lucide-react';
import { Sector } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  selectedSectorId: string | null;
  onSelectSector: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sectors,
  selectedSectorId,
  onSelectSector
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getSectorIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'landmark': return <Landmark className="w-3.5 h-3.5 text-emerald-400" />;
      case 'shoppingcart': return <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />;
      case 'graduationcap': return <GraduationCap className="w-3.5 h-3.5 text-amber-400" />;
      case 'radio': return <Radio className="w-3.5 h-3.5 text-purple-400" />;
      case 'building2': return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
      default: return <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const navItems = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Brand Profiles', path: '/brands', icon: Layers },
    { name: 'Social Threat Monitor', path: '/social-monitor', icon: Globe },
    { name: 'App Threat Monitor', path: '/app-monitor', icon: Smartphone },
    { name: 'Threat Intelligence Graph', path: '/threat-graph', icon: Network },
    { name: 'Investigation Queue', path: '/investigations', icon: ListChecks },
    { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart },
    { name: 'Data Sources', path: '/sources', icon: Database },
    { name: 'Custom Sector Builder', path: '/custom-sector', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-navy-900/40">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sentinel-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sentinel-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">SENTINEL<span className="text-sentinel-400">X</span></span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                Risk Protection
              </p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Core Platform
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sentinel-600 text-white shadow-sm shadow-sentinel-600/30 font-semibold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Five Sector Dashboards Direct Switcher */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <span>Industry Sectors</span>
              <span className="text-sentinel-400 font-mono text-[10px]">{sectors.length}</span>
            </div>
            <div className="space-y-1">
              {sectors.map((s) => {
                const isSectorActive = location.pathname === `/sector/${s.id}`;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSector(s.id);
                      onClose();
                      navigate(`/sector/${s.id}`);
                    }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isSectorActive
                        ? 'bg-slate-800 text-sentinel-300 border-l-2 border-sentinel-400 font-semibold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getSectorIcon(s.icon)}
                      <span className="truncate">{s.name}</span>
                    </div>
                    {s.high_critical_count && s.high_critical_count > 0 ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {s.high_critical_count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info: Tagline & Current Active Sector */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/50">
          <div className="text-[11px] text-slate-300 leading-relaxed mb-2 font-medium">
            One Platform. Five Sectors. Smarter Digital Protection.
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span>Active Domain:</span>
            <span className="font-semibold text-sentinel-400 truncate max-w-[120px]">
              {selectedSectorId ? sectors.find(s => s.id === selectedSectorId)?.name : 'Global View'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
