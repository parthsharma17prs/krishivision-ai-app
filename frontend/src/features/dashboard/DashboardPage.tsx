import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  Radio,
  Camera,
  Pill,
  ExternalLink,
  ShieldCheck
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
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    loadDashboard();
    // Auto-poll live telemetry and Agribot feed every 5 seconds for real-time responsiveness
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const loadDashboard = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getDashboard('farm-indore-001');
      setData(res);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
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

  const { farm, health_score, health_score_breakdown, current_telemetry, weather, irrigation_summary, recent_scans, active_alerts, active_risks, latest_live_feed, live_feed_stats, telemetry_history } = data;

  const moistureChartData = (telemetry_history && telemetry_history.length > 0)
    ? telemetry_history
    : [
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Real-Time AI Farming Intelligence</span>
              </div>
              <a
                href="https://docs.google.com/spreadsheets/d/1dnLEKXHdmtnZHZSwXRdZ2RI2w9DTtPWOQFyAF3pBOuQ/edit?gid=0#gid=0"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>📊 Google Sheet Live Sync (From 9/18/2026 9:34:11)</span>
              </a>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white font-sans">
              Good morning, <span className="text-emerald-400">Rajesh Patel</span>
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Field Status: <span className="text-slate-100 font-semibold">{farm.name}</span> ({farm.location}) — Crop: <span className="text-emerald-300 font-semibold">{farm.main_crop}</span>
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-col gap-2 bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30 backdrop-blur-md min-w-[280px]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Telemetry
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Synced {lastSyncTime || 'Just now'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Soil Moisture</p>
                <p className="text-2xl font-black text-emerald-400">{current_telemetry.soil_moisture_pct}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Temperature</p>
                <p className="text-2xl font-black text-amber-400">{current_telemetry.temperature_c}°C</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Water Tank</p>
                <p className="text-2xl font-black text-teal-400">{current_telemetry.water_tank_pct}%</p>
              </div>
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
          {/* Card 1: Real-Time Live Disease Risk */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-700/50 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                latest_live_feed?.is_healthy
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : latest_live_feed?.severity === 'Critical'
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                {latest_live_feed ? `${latest_live_feed.severity} Risk` : 'Moderate Risk'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm truncate">
              {latest_live_feed ? `${latest_live_feed.crop}: ${latest_live_feed.disease_name}` : 'Disease Risk Status'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {latest_live_feed
                ? `Live Agribot stream diagnosed with ${latest_live_feed.confidence}% confidence. ${latest_live_feed.cause || ''}`
                : 'Continuous 10s plant pathology scanning active.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[170px]">
                {latest_live_feed?.pesticide_advisory?.should_spray ? 'Spray Alert Active' : 'Action: Routine checks'}
              </span>
              <Link to="/live-feed" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                Live Feed <ArrowUpRight className="w-3 h-3" />
              </Link>
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
              <span>Moisture: {current_telemetry.soil_moisture_pct}% (Target 30%)</span>
              <Link to="/irrigation" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">Schedule <ArrowUpRight className="w-3 h-3" /></Link>
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
              <Link to="/nutrients" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">View NPK <ArrowUpRight className="w-3 h-3" /></Link>
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
              <Link to="/weather" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">7-Day Forecast <ArrowUpRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Real-Time Agribot Field Stream Card */}
      {latest_live_feed && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Real-Time Agribot Field Stream</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  LIVE 10s FEED
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-semibold">T-{countdown}s sync</span>
              <span className="hidden md:inline">•</span>
              <span className="font-mono text-slate-400">{latest_live_feed.timestamp}</span>
              <Link
                to="/live-feed"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition"
              >
                <span>Open Live Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Thumbnail */}
            <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 group shadow-md">
              <img
                src={latest_live_feed.image_url}
                alt={latest_live_feed.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                {latest_live_feed.confidence}% Confidence
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-mono text-slate-300 truncate max-w-[200px]">
                {latest_live_feed.filename}
              </div>
            </div>

            {/* Analysis Details */}
            <div className="md:col-span-8 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 text-[11px] block">Target Crop Species & Condition</span>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{latest_live_feed.crop}:</span>
                    <span className="text-emerald-400">{latest_live_feed.disease_name}</span>
                  </h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  latest_live_feed.severity === 'Low'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : latest_live_feed.severity === 'Critical'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {latest_live_feed.severity} Severity
                </span>
              </div>

              {latest_live_feed.cause && (
                <p className="text-slate-300 line-clamp-2">
                  <strong className="text-slate-400 font-medium">Pathogen Cause:</strong> {latest_live_feed.cause}
                </p>
              )}

              {/* Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pesticide Spray Advisory</span>
                  </span>
                  {latest_live_feed.pesticide_advisory?.should_spray ? (
                    <p className="text-amber-300 font-semibold text-[11px]">
                      {latest_live_feed.pesticide_advisory.chemical_pesticide?.name || 'Chemical Spray Advised'}
                    </p>
                  ) : (
                    <p className="text-emerald-300 font-medium text-[11px]">
                      No chemical pesticide required (Safe threshold)
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cultural / Organic Action</span>
                  </span>
                  <p className="text-slate-200 text-[11px] truncate">
                    {latest_live_feed.cure || 'Maintain standard organic cultural practices.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Recent Real-Time Field Scans Section */}
      {recent_scans && recent_scans.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Recent Real-Time Field Captures</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {recent_scans.length} Scans Ingested
              </span>
            </div>
            <Link
              to="/live-feed"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>View All Scans</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent_scans.slice(0, 4).map((scan, idx) => (
              <div
                key={scan.scan_id || idx}
                className="rounded-xl p-3 bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition space-y-2 group"
              >
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-slate-800">
                  <img
                    src={scan.original_image_url || '/uploads/leaf_sample.jpg'}
                    alt={scan.detected_plant}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono text-emerald-400 font-bold">
                    {scan.confidence_pct}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{scan.detected_plant}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      scan.severity === 'Low'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : scan.severity === 'Critical'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {scan.severity}
                    </span>
                  </div>
                  <p className="font-bold text-slate-100 text-xs truncate mt-0.5">
                    {scan.primary_disease}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
