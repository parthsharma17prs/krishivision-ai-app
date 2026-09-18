import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { NutrientAnalysisResponse, NutrientDetailItem, LiveFeedRecord } from '../../types';
import {
  TestTube,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Layers,
  FlaskConical,
  Sprout,
  Activity,
  Sliders,
  HelpCircle,
  Gauge,
  RotateCcw,
  Zap,
  Leaf,
  Camera,
  Upload,
  RefreshCw,
  Eye,
  Scan,
  Cpu,
  Radio,
  Check,
  ImageIcon
} from 'lucide-react';

export const NutrientPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<NutrientAnalysisResponse | null>(null);

  // Real-Time Image & Telemetry State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  const [activeSamplePath, setActiveSamplePath] = useState<string | null>(null);
  const [isFetchingLiveImage, setIsFetchingLiveImage] = useState<boolean>(false);
  const [isSyncingSensors, setIsSyncingSensors] = useState<boolean>(false);
  const [latestFeedRecord, setLatestFeedRecord] = useState<LiveFeedRecord | null>(null);

  // Configurator parameters
  const [selectedCrop, setSelectedCrop] = useState<string>('Corn (Maize)');
  const [growthStage, setGrowthStage] = useState<string>('Flowering & Fruit Setting');
  const [soilPh, setSoilPh] = useState<number>(7.8);
  const [npk, setNpk] = useState<{ N: number; P: number; K: number }>({ N: 100, P: 40, K: 170 });
  const [micro, setMicro] = useState<{ Mg: number; Fe: number; Zn: number }>({ Mg: 2.1, Fe: 3.8, Zn: 0.7 });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Yellowing of lower leaves',
    'Little leaf / white striping'
  ]);
  const [activeTab, setActiveTab] = useState<'all' | 'n' | 'p' | 'k' | 'micro'>('all');
  const [prescriptionTab, setPrescriptionTab] = useState<'chemical' | 'foliar' | 'organic'>('chemical');

  const cropOptions = ['Corn (Maize)', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Apple', 'Cotton'];
  const stageOptions = [
    'Vegetative',
    'Flowering & Fruit Setting',
    'Fruit Development / Grain Filling'
  ];

  const symptomOptions = [
    { label: 'Yellowing of lower leaves', nutrient: 'Nitrogen (N)' },
    { label: 'Purple undersides of leaves', nutrient: 'Phosphorus (P)' },
    { label: 'Marginal leaf scorch & brown edges', nutrient: 'Potassium (K)' },
    { label: 'Interveinal chlorosis on lower leaves', nutrient: 'Magnesium (Mg)' },
    { label: 'Interveinal chlorosis on upper leaves', nutrient: 'Iron (Fe)' },
    { label: 'Little leaf / white striping', nutrient: 'Zinc (Zn)' }
  ];

  const sampleLeafImages = [
    {
      label: 'Maize Zinc Deficit',
      crop: 'Corn (Maize)',
      path: '/samples/pests/fall_armyworm_maize.jpg',
      stage: 'Flowering & Fruit Setting',
      ph: 7.8,
      symptoms: ['Yellowing of lower leaves', 'Little leaf / white striping']
    },
    {
      label: 'Potato Early Blight / Potassium Scorch',
      crop: 'Potato',
      path: '/samples/potato_early_blight.jpg',
      stage: 'Fruit Development / Grain Filling',
      ph: 6.2,
      symptoms: ['Marginal leaf scorch & brown edges']
    },
    {
      label: 'Apple Chlorosis',
      crop: 'Apple',
      path: '/samples/apple_scab.jpg',
      stage: 'Flowering & Fruit Setting',
      ph: 5.4,
      symptoms: ['Interveinal chlorosis on lower leaves']
    },
    {
      label: 'Tomato Canopy',
      crop: 'Tomato',
      path: '/samples/tomato_healthy.jpg',
      stage: 'Vegetative',
      ph: 8.2,
      symptoms: ['Interveinal chlorosis on upper leaves']
    }
  ];

  const presets = [
    {
      name: 'Maize Nitrogen & Zinc Deficit (Alkaline Soil)',
      crop: 'Corn (Maize)',
      stage: 'Flowering & Fruit Setting',
      ph: 7.8,
      npk: { N: 95, P: 42, K: 165 },
      micro: { Mg: 2.4, Fe: 4.2, Zn: 0.7 },
      symptoms: ['Yellowing of lower leaves', 'Little leaf / white striping'],
      samplePath: '/samples/pests/fall_armyworm_maize.jpg'
    },
    {
      name: 'Tomato Iron Chlorosis (Calcareous Soil)',
      crop: 'Tomato',
      stage: 'Vegetative',
      ph: 8.2,
      npk: { N: 125, P: 50, K: 195 },
      micro: { Mg: 3.2, Fe: 2.8, Zn: 1.1 },
      symptoms: ['Interveinal chlorosis on upper leaves'],
      samplePath: '/samples/tomato_healthy.jpg'
    },
    {
      name: 'Potato Potassium Scorch (High Demand)',
      crop: 'Potato',
      stage: 'Fruit Development / Grain Filling',
      ph: 6.2,
      npk: { N: 115, P: 58, K: 140 },
      micro: { Mg: 2.7, Fe: 5.8, Zn: 1.3 },
      symptoms: ['Marginal leaf scorch & brown edges'],
      samplePath: '/samples/potato_early_blight.jpg'
    },
    {
      name: 'Apple Magnesium Interveinal Chlorosis',
      crop: 'Apple',
      stage: 'Flowering & Fruit Setting',
      ph: 5.4,
      npk: { N: 110, P: 35, K: 180 },
      micro: { Mg: 1.6, Fe: 6.8, Zn: 1.5 },
      symptoms: ['Interveinal chlorosis on lower leaves'],
      samplePath: '/samples/apple_scab.jpg'
    }
  ];

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setSelectedCrop(preset.crop);
    setGrowthStage(preset.stage);
    setSoilPh(preset.ph);
    setNpk(preset.npk);
    setMicro(preset.micro);
    setSelectedSymptoms(preset.symptoms);
    if (preset.samplePath) {
      setSelectedFile(null);
      setActiveImagePreview(preset.samplePath);
      setActiveSamplePath(preset.samplePath);
    }
  };

  const fetchLatestLiveAgribotImage = async () => {
    try {
      setIsFetchingLiveImage(true);
      const record = await api.getLatestLiveFeed();
      if (record && record.image_url) {
        setLatestFeedRecord(record);
        setSelectedFile(null);
        setActiveImagePreview(record.image_url);
        setActiveSamplePath(null);
        if (record.crop && record.crop !== 'Unknown') {
          setSelectedCrop(record.crop);
        }
        await executeAnalysis({
          file: null,
          imageUrl: record.image_url,
          samplePath: null
        });
      }
    } catch (err) {
      console.error('Failed to fetch latest live feed image:', err);
    } finally {
      setIsFetchingLiveImage(false);
    }
  };

  const syncLiveSensors = async () => {
    try {
      setIsSyncingSensors(true);
      const dash = await api.getDashboard();
      if (dash && dash.current_telemetry) {
        const t = dash.current_telemetry;
        setNpk((prev) => ({
          ...prev,
          N: Math.round(t.soil_moisture_pct * 3.8 + 20),
          K: Math.round(t.temperature_c * 4.5 + 40)
        }));
      }
    } catch (err) {
      console.error('Sensor sync notice:', err);
    } finally {
      setIsSyncingSensors(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setActiveImagePreview(previewUrl);
      setActiveSamplePath(null);
      executeAnalysis({ file, imageUrl: null, samplePath: null });
    }
  };

  const executeAnalysis = async (override?: { file?: File | null; imageUrl?: string | null; samplePath?: string | null }) => {
    try {
      setLoading(true);

      const targetFile = override?.file !== undefined ? override.file : selectedFile;
      const targetUrl = override?.imageUrl !== undefined ? override.imageUrl : activeImagePreview;
      const targetSample = override?.samplePath !== undefined ? override.samplePath : activeSamplePath;

      const params = {
        field_id: 'field-indore-1',
        crop_name: selectedCrop,
        growth_stage: growthStage,
        soil_ph: soilPh,
        npk_sensor: npk,
        micronutrient_sensor: micro,
        symptoms_observed: selectedSymptoms,
        image_url: targetUrl || undefined,
        sample_path: targetSample || undefined
      };

      let res: NutrientAnalysisResponse;
      if (targetFile) {
        res = await api.analyzeNutrientImage(targetFile, params);
      } else {
        res = await api.analyzeNutrient(params);
      }

      setResult(res);

      // Auto-sync derived symptoms from computer vision if present
      if (res.image_cv_analysis) {
        const cv = res.image_cv_analysis;
        const newSyms = [...selectedSymptoms];
        if (cv.yellow_chlorosis_pct > 12.0 && !newSyms.includes('Yellowing of lower leaves')) {
          newSyms.push('Yellowing of lower leaves');
        }
        if (cv.brown_necrotic_pct > 8.0 && !newSyms.includes('Marginal leaf scorch & brown edges')) {
          newSyms.push('Marginal leaf scorch & brown edges');
        }
        setSelectedSymptoms(newSyms);
      }
    } catch (err) {
      console.error('Nutrient analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial analysis & load latest Agribot live image
    fetchLatestLiveAgribotImage();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CRITICAL DEFICIT':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'DEFICIENT':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MILD DEFICIT':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getPhBadge = (ph: number) => {
    if (ph > 7.5) {
      return { text: 'Alkaline (Fe & Zn Lockup)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    } else if (ph < 5.8) {
      return { text: 'Acidic (P & Mg Fixation)', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    }
    return { text: 'Optimal Range (Balanced Uptake)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Real-Time Computer Vision Leaf Analysis + Sensor Bioavailability Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Nutrient Deficiency Analysis Station
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Combines real-time leaf image processing (chlorosis & necrosis color space quantification) with live IoT sensor telemetry (N-P-K-Mg-Fe-Zn), soil pH bioavailability rules, and foliar symptom correlation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => executeAnalysis()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing ML & Vision...' : 'Run Real-Time Evaluation'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Image & Live Feed Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Real-Time Field Leaf Image Ingestion</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE VISION
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchLatestLiveAgribotImage}
              disabled={isFetchingLiveImage}
              className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isFetchingLiveImage ? 'animate-spin' : ''}`} />
              <span>Fetch Latest Agribot Image</span>
            </button>

            <button
              onClick={syncLiveSensors}
              disabled={isSyncingSensors}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSensors ? 'animate-spin' : ''}`} />
              <span>Sync Sensors</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Leaf Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
        </div>

        {/* Sample Leaf Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" /> Real Leaf Samples:
          </span>
          {sampleLeafImages.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedCrop(s.crop);
                setGrowthStage(s.stage);
                setSoilPh(s.ph);
                setSelectedSymptoms(s.symptoms);
                setSelectedFile(null);
                setActiveImagePreview(s.path);
                setActiveSamplePath(s.path);
                executeAnalysis({ file: null, imageUrl: null, samplePath: s.path });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                activeImagePreview === s.path
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-400" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Active Leaf Image & OpenCV Chlorosis Heatmap View */}
        {activeImagePreview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            {/* Original Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-teal-400" /> Active Field Leaf Image
                </span>
                {latestFeedRecord && activeImagePreview === latestFeedRecord.image_url && (
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                    Live Agribot Feed ({latestFeedRecord.timestamp})
                  </span>
                )}
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-800 aspect-video bg-black/60 flex items-center justify-center">
                <img
                  src={activeImagePreview}
                  alt="Active crop leaf"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* OpenCV Chlorosis Heatmap / CV Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-300 font-mono flex items-center gap-1">
                  <Scan className="w-3.5 h-3.5 text-emerald-400" /> Chlorosis & Necrosis Heatmap
                </span>
                {result?.image_cv_analysis && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                    OpenCV Processed ({result.image_cv_analysis.processing_time_ms} ms)
                  </span>
                )}
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-800 aspect-video bg-black/60 flex items-center justify-center">
                {result?.annotated_heatmap_url ? (
                  <img
                    src={result.annotated_heatmap_url}
                    alt="Chlorosis Heatmap"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                    <Scan className="w-8 h-8 animate-pulse text-teal-400" />
                    <span className="text-xs">Processing leaf color histogram & chlorosis index...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vision Metrics Bar */}
        {result?.image_cv_analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-mono font-semibold text-amber-400">Chlorosis Index (Yellowing)</div>
              <div className="text-lg font-bold text-white mt-0.5">{result.image_cv_analysis.yellow_chlorosis_pct}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-mono font-semibold text-red-400">Necrotic Scorch (Browning)</div>
              <div className="text-lg font-bold text-white mt-0.5">{result.image_cv_analysis.brown_necrotic_pct}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-mono font-semibold text-emerald-400">Healthy Canopy</div>
              <div className="text-lg font-bold text-white mt-0.5">{result.image_cv_analysis.green_canopy_pct}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-mono font-semibold text-teal-400">Vision Inferred Condition</div>
              <div className="text-xs font-semibold text-teal-200 mt-1 truncate">{result.image_cv_analysis.likely_visual_deficiency}</div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Quick Selectors */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
          <Zap className="w-4 h-4 text-teal-400" /> Agronomic Field Scenario Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                applyPreset(p);
                executeAnalysis({
                  file: null,
                  imageUrl: null,
                  samplePath: p.samplePath
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic & Telemetry Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Matrix Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Live Parameter Matrix
              </h3>
            </div>

            {/* Target Crop & Growth Stage */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Crop</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  {cropOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Growth Stage</label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  {stageOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Soil pH Bioavailability */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                    Soil pH Level:
                  </label>
                  <span className="text-sm font-mono font-bold text-white">{soilPh}</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="9.0"
                  step="0.1"
                  value={soilPh}
                  onChange={(e) => setSoilPh(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Acidic (4.5)</span>
                  <span>Neutral (7.0)</span>
                  <span>Alkaline (9.0)</span>
                </div>
                {soilPh && (
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded border mt-1 ${getPhBadge(soilPh).color}`}>
                    {getPhBadge(soilPh).text}
                  </div>
                )}
              </div>

              {/* Primary NPK Telemetry */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-teal-400 font-mono flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> PRIMARY NPK SENSOR TELEMETRY (MG/KG)
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Nitrogen (N)</span>
                      <span className="font-mono text-white">{npk.N} mg/kg</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="220"
                      value={npk.N}
                      onChange={(e) => setNpk({ ...npk, N: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Phosphorus (P)</span>
                      <span className="font-mono text-white">{npk.P} mg/kg</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={npk.P}
                      onChange={(e) => setNpk({ ...npk, P: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Potassium (K)</span>
                      <span className="font-mono text-white">{npk.K} mg/kg</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={npk.K}
                      onChange={(e) => setNpk({ ...npk, K: parseInt(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Micronutrient Telemetry */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> MICRONUTRIENT TELEMETRY (PPM / MEQ)
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mg (meq)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={micro.Mg}
                      onChange={(e) => setMicro({ ...micro, Mg: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Fe (ppm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={micro.Fe}
                      onChange={(e) => setMicro({ ...micro, Fe: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Zn (ppm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={micro.Zn}
                      onChange={(e) => setMicro({ ...micro, Zn: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Symptoms Checklist */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" /> VISUAL LEAF SYMPTOMS OBSERVED
                </span>

                <div className="space-y-1.5">
                  {symptomOptions.map((sym, idx) => {
                    const isChecked = selectedSymptoms.includes(sym.label);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleSymptom(sym.label)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition border text-xs ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-amber-500"
                        />
                        <div className="flex-1">
                          <span className="block font-medium leading-tight">{sym.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">[{sym.nutrient}]</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => executeAnalysis()}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Update Analysis Matrix</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Analysis Output */}
        <div className="lg:col-span-8 space-y-6">
          {result ? (
            <>
              {/* Primary Deficiency Summary Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-semibold text-slate-400 uppercase">Primary Crop Deficiency</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
                      <span className="text-amber-400">{result.likely_deficiency}</span>
                      <span className="text-base font-normal font-mono text-slate-400">({result.confidence_pct}%)</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Nutritional Health</div>
                      <div className="text-xl font-bold text-emerald-400 font-mono">{result.health_score}%</div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${getStatusBadgeClass(result.confidence_pct > 65 ? 'CRITICAL DEFICIT' : 'DEFICIENT')}`}>
                      {result.confidence_pct > 65 ? 'CRITICAL DEFICIT' : 'DEFICIENT'}
                    </div>
                  </div>
                </div>

                {/* pH Bioavailability Warning */}
                {result.ph_bioavailability_impact && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{result.ph_bioavailability_impact}</span>
                  </div>
                )}
              </div>

              {/* 6-Nutrient Balance Matrix Grid (N-P-K-Mg-Fe-Zn) */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" /> 6-Nutrient Balance Matrix (N-P-K-Mg-Fe-Zn)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Target Baselines vs Current</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.nutrients_detail?.map((nut) => (
                    <div
                      key={nut.code}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-teal-300 font-bold font-mono text-xs flex items-center justify-center">
                            {nut.code}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{nut.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Current: {nut.current_level} {nut.unit} | Target: {nut.target_level} {nut.unit}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getStatusBadgeClass(nut.status)}`}>
                          {nut.status}
                        </span>
                      </div>

                      {/* Deficit Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Deficit Index</span>
                          <span className="font-bold text-white">{nut.deficit_pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              nut.deficit_pct > 65
                                ? 'bg-red-500'
                                : nut.deficit_pct > 35
                                ? 'bg-amber-500'
                                : nut.deficit_pct > 15
                                ? 'bg-cyan-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, nut.deficit_pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agronomic Fertilizer Prescriptions */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" /> Agronomic Fertilizer Prescriptions
                  </h3>

                  <div className="flex gap-1.5">
                    {(['chemical', 'foliar', 'organic'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setPrescriptionTab(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                          prescriptionTab === tab
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  {prescriptionTab === 'chemical' && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-400 font-mono uppercase block">
                        🧪 Targeted Soil Application / Fertigation Recipe:
                      </span>
                      <p className="leading-relaxed">
                        {result.fertilizer_recipe?.primary_chemical || result.recommended_fertilizer_advisory[0]}
                      </p>
                    </div>
                  )}

                  {prescriptionTab === 'foliar' && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-teal-400 font-mono uppercase block">
                        🍃 Immediate Foliar Spray Corrective:
                      </span>
                      <p className="leading-relaxed">
                        {result.fertilizer_recipe?.primary_foliar || result.recommended_fertilizer_advisory[1]}
                      </p>
                    </div>
                  )}

                  {prescriptionTab === 'organic' && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-amber-400 font-mono uppercase block">
                        🌱 Bio-Fertilizer & Organic Alternative:
                      </span>
                      <p className="leading-relaxed">
                        {result.fertilizer_recipe?.organic_bio || 'Apply Vermicompost @ 2 tonnes/acre inoculated with Bio-fertilizers.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wide">
                  Supporting Agronomic Evidence ({result.supporting_evidence.length})
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {result.supporting_evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
              <TestTube className="w-10 h-10 text-teal-400 animate-pulse mx-auto" />
              <h3 className="text-lg font-bold text-white">Initializing Diagnostic Engine...</h3>
              <p className="text-slate-400 text-xs">Processing leaf color histograms and soil telemetry matrix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
