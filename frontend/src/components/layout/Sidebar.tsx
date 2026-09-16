import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Bug,
  TestTube,
  Droplets,
  CloudSun,
  ShieldAlert,
  Bot,
  Sliders,
  FileText,
  Settings,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  demoMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ demoMode = true }) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'AI Plant Doctor', path: '/disease', icon: Stethoscope, badge: 'YOLOv11+ViT' },
    { name: 'Pest Scanner', path: '/pests', icon: Bug },
    { name: 'Nutrient Health', path: '/nutrients', icon: TestTube },
    { name: 'Irrigation Intelligence', path: '/irrigation', icon: Droplets },
    { name: 'Weather Intelligence', path: '/weather', icon: CloudSun },
    { name: 'Risk Alerts', path: '/risks', icon: ShieldAlert },
    { name: 'AI Farm Assistant', path: '/assistant', icon: Bot },
    { name: 'IoT Telemetry Panel', path: '/iot-simulator', icon: Sliders, badge: 'Live Sim' },
    { name: 'Diagnostic Reports', path: '/reports', icon: FileText },
    { name: 'Settings & Status', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 z-30">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white font-sans tracking-tight leading-tight">KrishiVision<span className="text-emerald-400">.AI</span></h1>
            <p className="text-[11px] text-emerald-400/90 font-medium">Smart Agri Intelligence</p>
          </div>
        </div>
      </div>

      {/* Demo / Live Status Badge */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          System Mode
        </span>
        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${demoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {demoMode ? 'DEMO MODE' : 'LIVE AI'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-700 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-emerald-300 font-bold flex items-center justify-center border border-emerald-600/40 text-xs">
              RP
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Rajesh Patel</p>
              <p className="text-[10px] text-slate-400 truncate">Indore, MP (5.0 Acres)</p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </aside>
  );
};
