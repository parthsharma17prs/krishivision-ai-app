import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  LiveFeedRecord,
  LiveFeedStats,
  LiveFeedStatus
} from '../../types';
import {
  Radio,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Sparkles,
  Camera,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Search,
  ShieldAlert,
  HardDrive,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  Layers,
  SlidersHorizontal,
  Flame,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';

export const LiveImageDashboardPage: React.FC = () => {
  const [status, setStatus] = useState<LiveFeedStatus | null>(null);
  const [stats, setStats] = useState<LiveFeedStats | null>(null);
  const [records, setRecords] = useState<LiveFeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item modal
  const [inspectRecord, setInspectRecord] = useState<LiveFeedRecord | null>(null);

  // 10-second real-time countdown & new arrival badge
  const [countdown, setCountdown] = useState<number>(10);
  const [lastIngestedId, setLastIngestedId] = useState<string>('');
  const [isFreshScan, setIsFreshScan] = useState<boolean>(false);

  // Live camera modal states
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState<boolean>(false);

  const startCamera = async () => {
    setCameraError(null);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError(err?.message || 'Could not access device camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      setCapturing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const filename = `camera_live_${Date.now()}.jpg`;
          const res = await api.uploadLiveCameraCapture(blob, filename);
          stopCamera();
          await fetchDashboardData();
          if (res?.record) {
            setInspectRecord(res.record);
          }
        } catch (e: any) {
          console.error('Failed to upload captured snapshot:', e);
          setCameraError(e?.message || 'Failed to analyze captured frame');
        } finally {
          setCapturing(false);
        }
      }, 'image/jpeg', 0.92);
    } catch (err: any) {
      console.error('Snapshot capture failed:', err);
      setCapturing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionLoading(true);
      const res = await api.uploadLiveCameraCapture(file, file.name);
      await fetchDashboardData();
      if (res?.record) {
        setInspectRecord(res.record);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statusRes, statsRes, recordsRes] = await Promise.all([
        api.getLiveFeedStatus(),
        api.getLiveFeedStats(),
        api.getLiveFeedRecords(selectedCrop, selectedSeverity, 50)
      ]);
      setStatus(statusRes);
      setStats(statsRes);
      setRecords(recordsRes);

      if (recordsRes.length > 0) {
        if (lastIngestedId && recordsRes[0].id !== lastIngestedId) {
          setIsFreshScan(true);
          setTimeout(() => setIsFreshScan(false), 4500);
        }
        setLastIngestedId(recordsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch live feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCrop, selectedSeverity]);

  // 1-second ticker for exact 10-second real-time cycle
  useEffect(() => {
    if (!autoRefresh) return;
    const ticker = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [autoRefresh, selectedCrop, selectedSeverity, lastIngestedId]);

  const handlePollNow = async () => {
    try {
      setActionLoading(true);
      await api.pollDriveNow();
      await fetchDashboardData();
    } catch (err) {
      console.error('Manual poll failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoPoll = async () => {
    try {
      if (!status) return;
      const res = await api.toggleLiveFeedPolling(!status.is_polling_active);
      setStatus((prev) => prev ? { ...prev, is_polling_active: res.is_polling_active } : null);
    } catch (err) {
      console.error('Toggle polling failed:', err);
    }
  };

  const handleSimulateCapture = async (sampleType?: string) => {
    try {
      setActionLoading(true);
      await api.simulateLiveFeedCapture(sampleType);
      await fetchDashboardData();
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered records for table
  const filteredRecords = records.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchFile = r.filename.toLowerCase().includes(q);
      const matchDisease = r.disease_name.toLowerCase().includes(q);
      const matchCrop = r.crop.toLowerCase().includes(q);
      if (!matchFile && !matchDisease && !matchCrop) return false;
    }
    return true;
  });

  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Continuous 10s Ingestion Pipeline • MobileNetV2 ONNX Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Live Image Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              LIVE STREAM
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Continuous Google Drive image ingestion from Agribot/field cameras, real-time ONNX disease diagnostics, histograms, and pathology trends.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Snap Live from Camera */}
          <button
            onClick={startCamera}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition flex items-center gap-1.5 shadow-sm"
            title="Snap a photo using your laptop or phone camera directly"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Snap from Camera</span>
          </button>

          {/* Upload Field Photo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5 shadow-sm"
            title="Upload a field leaf photo directly to the live feed"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Photo</span>
          </button>

          {/* Poll Drive Now Button */}
          <button
            onClick={handlePollNow}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-600/50 bg-emerald-700/80 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Poll Drive Now</span>
          </button>
        </div>
      </div>

      {/* Live Pipeline Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status?.is_connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status?.is_connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-300 font-semibold">
              {status?.is_connected ? 'Google Drive Connected' : 'Connecting to Drive...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Folder:</span>
            <strong className="text-emerald-400 font-mono">{status?.target_folder_name || 'Agribotimage'}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Account:</span>
            <strong className="text-slate-200">{status?.account_email || 'sihsymbiosis2026@gmail.com'}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Interval:</span>
            <strong className="text-slate-200">Every {status?.poll_interval_seconds || 10}s</strong>
          </div>
        </div>

        {/* Auto Polling Toggle & Countdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">Next Ingest:</span>
            <span className="font-mono text-emerald-300 font-bold w-5 text-center">{countdown}s</span>
            <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
          </div>

          {status?.last_poll_time && (
            <span className="text-slate-400 text-xs hidden sm:inline">
              Last check: <span className="text-slate-200">{status.last_poll_time.split(' ')[1] || status.last_poll_time}</span>
            </span>
          )}
          <button
            onClick={handleToggleAutoPoll}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              status?.is_polling_active
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status?.is_polling_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>{status?.is_polling_active ? 'Auto-Polling ON (10s)' : 'Auto-Polling Paused'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scanned */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Drive Ingestions</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans">{stats?.total_scanned ?? 0}</div>
          <p className="text-[11px] text-slate-400">Continuous feed images analyzed</p>
        </div>

        {/* Card 2: Active Diseases */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Active Pathogen Detections</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-sans">{stats?.diseased_count ?? 0}</div>
          <p className="text-[11px] text-slate-400">Pathology confirmed by MobileNetV2</p>
        </div>

        {/* Card 3: Healthy Rate */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Crop Health Index</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-sans">{stats?.healthy_rate_pct ?? 100}%</div>
          <p className="text-[11px] text-slate-400">Optimal equilibrium leaf samples</p>
        </div>

        {/* Card 4: Spray Advisories */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Chemical Spray Advisories</span>
            <Pill className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-sans">{stats?.spray_recommended_count ?? 0}</div>
          <p className="text-[11px] text-slate-400">&gt;60% safety rule triggered</p>
        </div>
      </div>

      {/* Main Grid: Latest Ingested Image + Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Latest Incoming Image Card (4 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-sm">Latest Live Feed Capture</span>
              {isFreshScan && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold animate-pulse">
                  ⚡ JUST ANALYZED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                T-{countdown}s
              </span>
              {latestRecord && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {latestRecord.timestamp.split(' ')[1] || latestRecord.timestamp}
                </span>
              )}
            </div>
          </div>

          {latestRecord ? (
            <div className="space-y-4">
              {/* Photo View */}
              <div className={`relative rounded-xl overflow-hidden border transition-all duration-500 bg-black aspect-video flex items-center justify-center group ${
                isFreshScan ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
              }`}>
                <img
                  src={latestRecord.image_url}
                  alt={latestRecord.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  {latestRecord.confidence}% Confidence
                </div>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-slate-200 font-mono">
                  {latestRecord.filename}
                </div>
              </div>

              {/* Diagnosis Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Diagnosis</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                      latestRecord.severity === 'Low'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : latestRecord.severity === 'Critical'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {latestRecord.severity} Severity
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{latestRecord.disease_name}</h3>
                <p className="text-xs text-slate-400">
                  Crop: <strong className="text-emerald-300">{latestRecord.crop}</strong>
                </p>
              </div>

              {/* Pathological Cause & Cure */}
              {latestRecord.cause && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pathological Cause:</span>
                  </span>
                  <p className="text-slate-400">{latestRecord.cause}</p>
                </div>
              )}

              {/* Pesticide Recommendation Banner */}
              {latestRecord.pesticide_advisory && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    latestRecord.pesticide_advisory.should_spray
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <span className="font-bold block mb-0.5">
                    {latestRecord.pesticide_advisory.should_spray ? '⚠️ Chemical Spray Recommended' : '✅ No Chemical Spray Needed'}
                  </span>
                  <p className="text-[11px] opacity-90">
                    {latestRecord.pesticide_advisory.chemical_pesticide?.name || latestRecord.pesticide_advisory.advice}
                  </p>
                </div>
              )}

              <button
                onClick={() => setInspectRecord(latestRecord)}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <span>Inspect Full Diagnostic Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <Camera className="w-10 h-10 mb-2 opacity-30" />
              <span>Waiting for Google Drive image upload...</span>
              <button
                onClick={() => handleSimulateCapture()}
                className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold"
              >
                Simulate Camera Capture Now
              </button>
            </div>
          )}
        </div>

        {/* Right: Rich Graphical Dashboards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chart 1: Disease Occurrence Histogram */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Disease Occurrence Histogram</span>
                </h3>
                <p className="text-[11px] text-slate-400">Distribution of diagnosed pathologies from Google Drive images</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">MobileNetV2</span>
            </div>

            <div className="h-56 w-full">
              {stats?.disease_histogram && stats.disease_histogram.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.disease_histogram} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="disease"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {stats.disease_histogram.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.is_healthy ? '#10b981' : index % 2 === 0 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No histogram data collected yet.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2 & 3: Two side-by-side charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity Distribution Donut */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Severity Distribution</span>
                </h4>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {stats?.severity_breakdown && stats.severity_breakdown.some((s) => s.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.severity_breakdown.filter((s) => s.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.severity_breakdown.map((entry, index) => (
                          <Cell key={`slice-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-slate-500 text-xs">No severity metrics available</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Healthy: {stats?.healthy_count ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Moderate: {stats?.severity_breakdown?.find((s) => s.name.includes('Moderate'))?.value ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>High: {stats?.severity_breakdown?.find((s) => s.name.includes('High'))?.value ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Critical: {stats?.severity_breakdown?.find((s) => s.name.includes('Critical'))?.value ?? 0}</span>
                </div>
              </div>
            </div>

            {/* AI Confidence & Scan Timeline Area Chart */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Confidence Timeline</span>
                </h4>
              </div>

              <div className="h-44 w-full">
                {stats?.timeline && stats.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeline} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#confGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No timeline points recorded.
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Avg Confidence:{' '}
                <strong className="text-emerald-400">{stats?.avg_confidence ?? 0}%</strong> across scanned samples
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Scans Log Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Drive Ingested Historical Scan Log</span>
            </h3>
            <p className="text-[11px] text-slate-400">Complete inspection history with pathology diagnoses and spray status</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file, crop, disease..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>

            {/* Crop Filter */}
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Crops</option>
              <option value="Tomato">Tomato</option>
              <option value="Potato">Potato</option>
              <option value="Apple">Apple</option>
              <option value="Orange">Orange</option>
              <option value="Peach">Peach</option>
              <option value="Corn">Corn</option>
              <option value="Pepper, bell">Bell Pepper</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="Low">Low (Healthy)</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Crop & Condition</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Spray Advisory</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                        <img
                          src={rec.image_url}
                          alt={rec.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {rec.timestamp}
                    </td>

                    {/* Filename */}
                    <td className="py-2.5 px-4 font-mono text-slate-300 max-w-[140px] truncate" title={rec.filename}>
                      {rec.filename}
                    </td>

                    {/* Crop & Disease */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-white">{rec.disease_name}</div>
                      <div className="text-[11px] text-emerald-400">{rec.crop}</div>
                    </td>

                    {/* Confidence Progress Bar */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{rec.confidence}%</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rec.is_healthy ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${rec.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.severity === 'Low'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : rec.severity === 'Critical'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {rec.severity}
                      </span>
                    </td>

                    {/* Spray Advisory */}
                    <td className="py-2.5 px-4">
                      {rec.pesticide_advisory?.should_spray ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px] inline-flex items-center gap-1">
                          <Pill className="w-3 h-3 text-amber-400" />
                          <span>Spray Advised</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold text-[11px] inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>No Spray</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setInspectRecord(rec)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-semibold"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No images match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-2xl w-full rounded-2xl border border-slate-700 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Diagnostic Report:</span>
                  <span className="text-emerald-400">{inspectRecord.disease_name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  File: <span className="font-mono text-slate-300">{inspectRecord.filename}</span> • Ingested: {inspectRecord.timestamp}
                </p>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo & Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                <img
                  src={inspectRecord.image_url}
                  alt={inspectRecord.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Target Crop Species</span>
                  <p className="text-base font-bold text-emerald-400">{inspectRecord.crop}</p>
                  <p className="text-slate-400">
                    Confidence:{' '}
                    <strong className="text-white font-sans">{inspectRecord.confidence}%</strong>
                  </p>
                  <p className="text-slate-400">
                    Severity: <strong className="text-amber-400">{inspectRecord.severity}</strong>
                  </p>
                </div>

                {inspectRecord.cause && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-semibold">Pathological Cause</span>
                    <p className="text-slate-200">{inspectRecord.cause}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cure & Pesticide Advisory */}
            {inspectRecord.cure && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cultural & Biological Cure:</span>
                </span>
                <p className="text-slate-300">{inspectRecord.cure}</p>
              </div>
            )}

            {inspectRecord.pesticide_advisory && (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 text-xs space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  <span>Pesticide Spray Advisory</span>
                </h4>
                {inspectRecord.pesticide_advisory.should_spray ? (
                  <div className="space-y-2 text-slate-300">
                    {inspectRecord.pesticide_advisory.chemical_pesticide && (
                      <p>
                        <strong className="text-amber-300">Chemical Spray:</strong>{' '}
                        {inspectRecord.pesticide_advisory.chemical_pesticide.name} (
                        {inspectRecord.pesticide_advisory.chemical_pesticide.dosage})
                      </p>
                    )}
                    {inspectRecord.pesticide_advisory.organic_alternative && (
                      <p>
                        <strong className="text-emerald-300">Organic Alternative:</strong>{' '}
                        {inspectRecord.pesticide_advisory.organic_alternative.name} (
                        {inspectRecord.pesticide_advisory.organic_alternative.dosage})
                      </p>
                    )}
                    {inspectRecord.pesticide_advisory.application_guide && (
                      <p className="text-slate-400">
                        <strong>Schedule:</strong> {inspectRecord.pesticide_advisory.application_guide}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-emerald-300">{inspectRecord.pesticide_advisory.advice}</p>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="text-right pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-xl rounded-3xl border border-slate-700/80 p-6 space-y-4 shadow-2xl relative bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-bold text-white text-base">Live Camera Snapshot & Diagnosis</h3>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                <p className="font-bold mb-1">Camera Access Notice</p>
                <p>{cameraError}</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-emerald-400/40 pointer-events-none rounded-2xl m-4 border-dashed" />
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE CAMERA FEED</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-400">
                Align leaf inside frame and snap for instant MobileNetV2 pathology analysis.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptureSnapshot}
                  disabled={capturing || !!cameraError}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <Camera className={`w-4 h-4 ${capturing ? 'animate-spin' : ''}`} />
                  <span>{capturing ? 'Diagnosing...' : 'Snap & Analyze'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
