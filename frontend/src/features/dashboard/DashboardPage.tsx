import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DashboardOverviewResponse } from '../../types';
import {
  Activity,
  Droplets,
  Stethoscope,
  TestTube,
  CloudSun,
  ShieldAlert,
  TrendingUp,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard('farm-indore-001');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading Farm Telemetry & AI Intelligence...</p>
      </div>
    );
  }

  const { farm, health_score, health_score_breakdown, current_telemetry, weather, irrigation_summary, recent_scans, active_alerts, active_risks } = data;

  const moistureChartData = [
    { time: '00:00', moisture: 32 },
    { time: '04:00', moisture: 30 },
    { time: '08:00', moisture: 29 },
    { time: '12:00', moisture: 28 },
    { time: '16:00', moisture: 26 },
    { time: '20:00', moisture: 28 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-800/40 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time AI Farming Intelligence</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white font-sans">
              Good morning, <span className="text-emerald-400">Rajesh Patel</span>
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Field Status: <span className="text-slate-100 font-semibold">{farm.name}</span> ({farm.location}) — Crop: <span className="text-emerald-300 font-semibold">{farm.main_crop}</span>
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
            <div className="text-center px-3 border-r border-slate-800">
              <p className="text-xs text-slate-400">Temperature</p>
              <p className="text-xl font-bold text-amber-400">{current_telemetry.temperature_c}°C</p>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <p className="text-xs text-slate-400">Soil Moisture</p>
              <p className="text-xl font-bold text-emerald-400">{current_telemetry.soil_moisture_pct}%</p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs text-slate-400">Water Tank</p>
              <p className="text-xl font-bold text-teal-400">{current_telemetry.water_tank_pct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Health Score Banner & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between border border-emerald-800/30">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Farm Health Score</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">Optimal</span>
            </div>
            
            {/* Score Display */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center glow-emerald">
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-white font-sans">{health_score}</span>
                  <span className="text-xs text-slate-400 font-semibold block">/ 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2.5">
            {Object.entries(health_score_breakdown).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-400">{key}</span>
                  <span className="text-emerald-400 font-bold">{value}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Summary Feature Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Disease Risk */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-700/50 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Moderate Risk</span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Disease Risk Status</h3>
            <p className="text-xs text-slate-400 mt-1">Tomato Early Blight detected in latest leaf scan (91.4% confidence).</p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Action: Prune lower leaves</span>
              <a href="/disease" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">Scan Leaf <ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>

          {/* Card 2: Smart Irrigation */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-700/50 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Required</span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Irrigation Recommendation</h3>
            <p className="text-xs text-slate-400 mt-1">{irrigation_summary.recommended_window} (1,400 L/acre drip).</p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Moisture: 28% (Target 30%)</span>
              <a href="/irrigation" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">Schedule <ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>

          {/* Card 3: Nutrient Health */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-700/50 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <TestTube className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Nitrogen Low</span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Nutrient Health</h3>
            <p className="text-xs text-slate-400 mt-1">Nitrogen deficit detected during flowering stage. Foliar urea advisory generated.</p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>NPK Telemetry: 110-45-175</span>
              <a href="/nutrients" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">View NPK <ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>

          {/* Card 4: Weather Risk */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-700/50 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <CloudSun className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">Heat Warning</span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Weather Intelligence</h3>
            <p className="text-xs text-slate-400 mt-1">{weather.condition}, {weather.temperature_c}°C. Rain prob {weather.rain_probability_pct}%.</p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Forecast: Sunny till Friday</span>
              <a href="/weather" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">7-Day Forecast <ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Graph */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Soil Moisture Telemetry</h3>
              <p className="text-xs text-slate-400">Field A 24-Hour moisture curve (%)</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">Threshold 30%</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moistureChartData}>
                <defs>
                  <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[20, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#moistureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Weather Temperature & Rain Forecast */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-100 text-base">7-Day Rainfall & Heat Forecast</h3>
              <p className="text-xs text-slate-400">Indore, MP weather prediction</p>
            </div>
            <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2.5 py-1 rounded-lg">Demo Mode Data</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weather.daily_forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day_name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Bar dataKey="max_temp_c" name="Max Temp (°C)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rain_prob_pct" name="Rain Prob (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
