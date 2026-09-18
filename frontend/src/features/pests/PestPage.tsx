import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { PestAnalysisResponse, LiveFeedRecord, LiveFeedStatus } from '../../types';
import {
  Bug,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Layers,
  ShieldAlert,
  Info,
  RefreshCw,
  FlaskConical,
  Sprout,
  Activity,
  HardDrive,
  Play,
  Eye,
  Clock
} from 'lucide-react';

export const PestPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PestAnalysisResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('/samples/pests/fall_armyworm_maize.jpg');
  const [activeTab, setActiveTab] = useState<'all' | 'bio' | 'cultural' | 'chem'>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('Corn (Maize)');
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Live Google Drive Feed state
  const [driveRecords, setDriveRecords] = useState<LiveFeedRecord[]>([]);
  const [driveStatus, setDriveStatus] = useState<LiveFeedStatus | null>(null);
  const [fetchingDrive, setFetchingDrive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sampleImages = [
    { name: 'Fall Armyworm (Maize)', path: '/samples/pests/fall_armyworm_maize.jpg', crop: 'Corn (Maize)' },
    { name: 'Flea Beetle (Leaf Damage)', path: '/samples/pests/beetle_pest.jpg', crop: 'Vegetable Crop' },
    { name: 'Corn Rust & Foliar Damage', path: '/samples/corn_common_rust.jpg', crop: 'Corn (Maize)' },
    { name: 'Healthy Crop Foliage', path: '/samples/tomato_healthy.jpg', crop: 'Tomato' }
  ];

  const fetchDriveData = async () => {
    try {
      setFetchingDrive(true);
      const [recs, stat] = await Promise.all([
        api.getLiveFeedRecords(undefined, undefined, 12),
        api.getLiveFeedStatus()
      ]);
      setDriveRecords(recs);
      setDriveStatus(stat);
    } catch (err) {
      console.error('Failed to fetch Drive live feed:', err);
    } finally {
      setFetchingDrive(false);
    }
  };

  useEffect(() => {
    fetchDriveData();
    // Auto-refresh drive telemetry every 10 seconds
    const interval = setInterval(fetchDriveData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      runScan(file, undefined);
    }
  };

  const handleSampleSelect = (sample: typeof sampleImages[0]) => {
    setSelectedFile(null);
    setPreviewUrl(sample.path);
    setSelectedCrop(sample.crop);
    runScan(undefined, sample.path);
  };

  const runScan = async (file?: File, samplePath?: string) => {
    try {
      setLoading(true);
      const res = await api.analyzePest(file || selectedFile || undefined, samplePath || (selectedFile ? undefined : previewUrl), selectedCrop);
      setResult(res);
    } catch (err) {
      console.error('Pest scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDrivePoll = async () => {
    try {
      setLoading(true);
      await api.pollDriveNow();
      await fetchDriveData();
    } catch (err) {
      console.error('Drive poll failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const simulateDriveTick = async () => {
    try {
      setLoading(true);
      const sim = await api.simulateLiveFeedCapture('fall_armyworm');
      if (sim && sim.record) {
        inspectDriveRecord(sim.record);
      }
      await fetchDriveData();
    } catch (err) {
      console.error('Simulate capture failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const inspectDriveRecord = (record: LiveFeedRecord) => {
    const p = record.pest_analysis;
    const pestCount = p ? p.pest_count : 0;
    const detectedPests = p ? p.detected_pests : [];
    const chemAdv = record.pesticide_advisory?.chemical_pesticide?.name
      ? [record.pesticide_advisory.chemical_pesticide.name]
      : [];

    const ipm = p ? p.ipm_recommendations : {
      biological: [],
      cultural_mechanical: [],
      chemical: chemAdv
    };

    const adaptedResult: PestAnalysisResponse = {
      scan_id: record.id || `drive-${Date.now()}`,
      pest_count: pestCount,
      overall_severity: p?.overall_severity || record.severity,
      economic_threshold_status: p?.economic_threshold_status || (pestCount > 0 ? 'APPROACHING_ECONOMIC_THRESHOLD' : 'BELOW_ECONOMIC_THRESHOLD'),
      detected_pests: detectedPests,
      ipm_recommendations: {
        biological: ipm.biological || [],
        cultural_mechanical: ipm.cultural_mechanical || [],
        chemical: ipm.chemical || []
      },
      recommended_control: p?.recommended_control || (record.cure ? [record.cure] : ['No chemical intervention required.']),
      annotated_image_url: p?.annotated_image_url || '',
      mode: 'Google Drive Ingestion Pipeline (Agribotimage)',
      label_notice: `Live Google Drive Ingested Image (${record.filename})`,
      processing_time_ms: p?.processing_time_ms || 18.5
    };

    setSelectedCrop(record.crop || 'Corn (Maize)');
    const imgPath = p?.annotated_image_url
      ? (p.annotated_image_url.startsWith('http') ? p.annotated_image_url : `http://localhost:8000${p.annotated_image_url}`)
      : (record.image_url.startsWith('http') ? record.image_url : `http://localhost:8000${record.image_url}`);

    setPreviewUrl(imgPath);
    setResult(adaptedResult);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const capturedFile = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            stopCamera();
            runScan(capturedFile, undefined);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const getSeverityBadge = (severity: string) => {
    if (severity.includes('Critical') || severity.includes('High')) {
      return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
    } else if (severity.includes('Moderate')) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2 font-mono">
            <Bug className="w-3.5 h-3.5" />
            <span>Real-Time YOLOv8 ONNX Agricultural Pest Detector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Pest Scanner & IPM Station
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Spatial object detection for Fall Armyworm (*Spodoptera frugiperda*), Flea Beetles, Aphids, and Whiteflies with Economic Thresholding (ETL/EIL) and Integrated Pest Management protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Crop Image</span>
          </button>

          <button
            onClick={startCamera}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 transition"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Live Camera Scan</span>
          </button>

          <button
            onClick={() => runScan(selectedFile || undefined, selectedFile ? undefined : previewUrl)}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing ONNX...' : 'Run Pest Scan'}</span>
          </button>
        </div>
      </div>

      {/* Sample Image Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
          <Layers className="w-4 h-4 text-emerald-400" /> Test Demo Field Samples:
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleImages.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleSelect(sample)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                previewUrl === sample.path
                  ? 'bg-emerald-950/80 border-emerald-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Modal */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" /> Field Scanner Camera
              </h3>
              <button onClick={stopCamera} className="text-slate-400 hover:text-white text-sm font-mono">✕</button>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={stopCamera} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
              <button onClick={capturePhoto} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Capture & Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Image Inspector + Pest Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Image Inspection Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-semibold text-white text-sm">Spatial Visual Inspector</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                YOLOv8 ONNX • 640x640
              </span>
            </div>

            <div className="relative bg-slate-950 min-h-[360px] flex items-center justify-center p-2">
              {loading ? (
                <div className="flex flex-col items-center space-y-3 text-slate-400 py-16">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-sm font-medium">Executing ONNX Non-Maximum Suppression...</p>
                </div>
              ) : result?.annotated_image_url ? (
                <img
                  src={result.annotated_image_url.startsWith('http') ? result.annotated_image_url : `http://localhost:8000${result.annotated_image_url}`}
                  alt="Annotated Pest Scan"
                  className="w-full h-auto max-h-[500px] object-contain rounded-xl border border-slate-800"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Crop Preview"
                  className="w-full h-auto max-h-[500px] object-contain rounded-xl border border-slate-800"
                />
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Target Crop: {selectedCrop}</span>
              <span>Processing Latency: {result?.processing_time_ms || 15.0} ms</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Diagnostic Results & IPM Protocol */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              {/* Scan Severity Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Infestation Severity</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{result.overall_severity}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${getSeverityBadge(result.overall_severity)}`}>
                  Pests Count: {result.pest_count || result.detected_pests.length}
                </span>
              </div>

              {/* Economic Threshold (ETL/EIL) Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  ECONOMIC ACTION THRESHOLD (ETL/EIL)
                </span>
                <p className="text-xs font-semibold text-slate-200">
                  Status: <span className="font-mono text-amber-400">{result.economic_threshold_status || 'BELOW_ECONOMIC_THRESHOLD'}</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-snug mt-1">
                  {result.pest_count && result.pest_count > 0
                    ? 'Larval population density requires structured IPM interventions to prevent economic yield reduction.'
                    : 'Pest density remains below action threshold. Continue routine scouting.'}
                </p>
              </div>

              {/* Detected Pests List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Detected Organisms ({result.detected_pests.length})
                </h4>
                {result.detected_pests.length > 0 ? (
                  <div className="space-y-2">
                    {result.detected_pests.map((pest, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-slate-100 text-xs">{pest.pest_name}</h5>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Bounding Box: [{pest.bounding_box.join(', ')}]
                          </p>
                        </div>
                        <span className="text-sm font-bold font-mono text-emerald-400">{pest.confidence_pct}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 text-center">
                    No active pest organisms detected in current canopy scan.
                  </div>
                )}
              </div>

              {/* IPM Control Directives & Pesticide Prescriptions */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" /> IPM & Pesticide Prescriptions
                  </h4>
                  <div className="flex gap-1">
                    {(['all', 'bio', 'cultural', 'chem'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                          activeTab === tab ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-56 overflow-y-auto">
                  {result.ipm_recommendations ? (
                    <>
                      {(activeTab === 'all' || activeTab === 'bio') && result.ipm_recommendations.biological && (
                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block">🧬 Biological Controls:</span>
                          {result.ipm_recommendations.biological.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                              <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(activeTab === 'all' || activeTab === 'cultural') && result.ipm_recommendations.cultural_mechanical && (
                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono block">🚜 Cultural / Mechanical Controls:</span>
                          {result.ipm_recommendations.cultural_mechanical.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(activeTab === 'all' || activeTab === 'chem') && result.ipm_recommendations.chemical && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase font-mono block">🧪 Recommended Pesticide Spray:</span>
                          {result.ipm_recommendations.chemical.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                              <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      {result.recommended_control.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 space-y-3">
              <Bug className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">Select a sample image or upload a crop photo to execute YOLOv8 ONNX pest scan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Real-Time Ingestion & Telemetry Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Google Drive Live Pipeline (Agribotimage)</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>10s Auto-Polling</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Field images uploaded to Google Drive target folder <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">Agribotimage</code> ({driveStatus?.account_email || 'sihsymbiosis2026@gmail.com'}) are automatically processed by both Disease Diagnosis & YOLOv8 Pest Models.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={triggerDrivePoll}
              disabled={loading || fetchingDrive}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${fetchingDrive ? 'animate-spin' : ''}`} />
              <span>Poll Drive Now</span>
            </button>

            <button
              onClick={simulateDriveTick}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Agribot Capture</span>
            </button>
          </div>
        </div>

        {/* Live Drive Feed Records Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Incoming Drive Scans ({driveRecords.length})
            </span>
            <span className="text-[11px] text-slate-500">Click any record to load pest annotations & pesticide prescriptions</span>
          </div>

          {driveRecords.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
              No Drive feed images ingested yet. Click "Simulate Agribot Capture" or upload files to Agribotimage folder.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {driveRecords.slice(0, 6).map((rec) => {
                const pestInfo = rec.pest_analysis;
                const hasPest = pestInfo?.is_pest_detected;
                const imgDisplay = pestInfo?.annotated_image_url
                  ? (pestInfo.annotated_image_url.startsWith('http') ? pestInfo.annotated_image_url : `http://localhost:8000${pestInfo.annotated_image_url}`)
                  : (rec.image_url.startsWith('http') ? rec.image_url : `http://localhost:8000${rec.image_url}`);

                return (
                  <div
                    key={rec.id}
                    onClick={() => inspectDriveRecord(rec)}
                    className={`group bg-slate-950 border rounded-xl overflow-hidden hover:border-emerald-500/60 transition cursor-pointer flex flex-col justify-between ${
                      hasPest ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={imgDisplay}
                        alt={rec.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        {hasPest ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950/90 text-red-400 border border-red-500/50 flex items-center gap-1">
                            <Bug className="w-3 h-3 text-red-400 animate-pulse" />
                            <span>PEST DETECTED ({pestInfo?.pest_count})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>CLEAN CANOPY</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {rec.crop}
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                          {hasPest && pestInfo?.detected_pests?.[0]?.pest_name
                            ? pestInfo.detected_pests[0].pest_name
                            : rec.disease_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.timestamp.split(' ')[1] || rec.timestamp}
                        </span>
                      </div>

                      {hasPest ? (
                        <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300 space-y-0.5">
                          <div className="font-semibold text-[10px] uppercase font-mono text-amber-400">Pesticide Recommendation:</div>
                          <p className="line-clamp-2 text-[10px] leading-tight text-slate-300">
                            {pestInfo?.recommended_control?.[0] || 'Spray Emamectin Benzoate 5% SG @ 0.4 g/L'}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-[10px] text-emerald-400">
                          No pesticide spray required. Healthy canopy.
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                        <span className="font-mono text-slate-500 truncate max-w-[140px]">{rec.filename}</span>
                        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Inspect Bounding Boxes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
