import React from 'react';
import { MapPin, Bell, Sun, Sparkles, RefreshCw, UserCheck } from 'lucide-react';

interface NavbarProps {
  farmName?: string;
  location?: string;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  farmName = 'Farm 01 — Indore',
  location = 'Indore, Madhya Pradesh',
  onRefresh
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Mobile Title Branding */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white">KrishiVision AI</h1>
          <p className="text-[10px] text-emerald-400">Indore, MP</p>
        </div>
      </div>

      {/* Desktop Farm Selector & Title */}
      <div className="hidden lg:flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-800/70 border border-slate-700/60 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-200">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>{farmName}</span>
          <span className="text-xs text-slate-400">({location})</span>
        </div>
        <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-semibold">
          Active Crop: Tomato (Solanum lycopersicum)
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="relative">
          <button className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-200 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>
        </div>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>farmer@demo.local</span>
          </div>
        </div>
      </div>
    </header>
  );
};
