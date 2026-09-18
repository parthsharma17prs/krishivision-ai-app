import React, { useState } from 'react';
import { api } from '../../api/client';
import { DiseaseAnalysisResponse } from '../../types';
import {
  Upload,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  FlaskConical,
  Leaf,
  ShieldCheck,
  ShieldAlert,
  Droplet,
  Pill
} from 'lucide-react';

const DEMO_SAMPLES = [
  {
    name: 'Potato Early Blight',
    crop: 'Potato',
    file: '/samples/potato_early_blight.jpg',
    badge: '🥔 Potato Blight'
  },
  {
    name: 'Apple Scab',
    crop: 'Apple',
    file: '/samples/apple_scab.jpg',
    badge: '🍎 Apple Scab'
  },
  {
    name: 'Corn Common Rust',
    crop: 'Corn',
    file: '/samples/corn_common_rust.jpg',
    badge: '🌽 Corn Rust'
  },
  {
    name: 'Healthy Tomato',
    crop: 'Tomato',
    file: '/samples/tomato_healthy.jpg',
    badge: '🍅 Healthy Tomato'
  }
];

export const DiseasePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'original' | 'detection' | 'heatmap'>('analysis');
  const [cropName, setCropName] = useState('Tomato');
  const [activeSampleName, setActiveSampleName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setActiveSampleName(null);
    }
  };

  const executeDiagnosis = async (fileToAnalyze: File, crop: string) => {
    try {
      setLoading(true);
      const res = await api.analyzeDisease(fileToAnalyze, crop);
      setResult(res);
      setActiveTab('analysis');
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await executeDiagnosis(selectedFile, cropName);
  };

  const loadSampleLeaf = async (sample: typeof DEMO_SAMPLES[0]) => {
    try {
      setLoading(true);
      setActiveSampleName(sample.name);
      setCropName(sample.crop);

      // Fetch the actual sample image from public folder
      const response = await fetch(sample.file);
      const blob = await response.blob();
      const filename = sample.file.split('/').pop() || 'sample.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      setSelectedFile(file);
      setPreviewUrl(sample.file);

      // Execute actual ML inference through backend
      await executeDiagnosis(file, sample.crop);
    } catch (err) {
      console.error('Failed to load demo sample:', err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>MobileNetV2 ONNX Pathology & Agronomy Engine (parthsharma17prs)</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Plant Doctor</h1>
          <p className="text-slate-400 text-sm">
            Upload crop leaf photo for real-time ONNX disease detection, ROI bounding box, attention heatmap, pesticide advisory, and AI nutrient deficiency analysis.
          </p>
        </div>

        {/* Quick Demo Sample Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Test Samples:</span>
          </span>
          {DEMO_SAMPLES.map((sample) => (
            <button
              key={sample.name}
              onClick={() => loadSampleLeaf(sample)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                activeSampleName === sample.name
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>{sample.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h2 className="font-semibold text-slate-200 text-base mb-4">Upload Crop Leaf Image</h2>

            {/* Crop Selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Crop Species</label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Tomato">Tomato (Solanum lycopersicum)</option>
                <option value="Potato">Potato (Solanum tuberosum)</option>
                <option value="Apple">Apple (Malus domestica)</option>
                <option value="Corn">Corn / Maize (Zea mays)</option>
                <option value="Grape">Grape (Vitis vinifera)</option>
                <option value="Bell Pepper">Bell Pepper (Capsicum annuum)</option>
                <option value="Cherry">Cherry (Prunus avium)</option>
                <option value="Peach">Peach (Prunus persica)</option>
                <option value="Strawberry">Strawberry (Fragaria)</option>
                <option value="Soybean">Soybean (Glycine max)</option>
                <option value="Squash">Squash (Cucurbita)</option>
                <option value="Orange">Orange / Citrus (Citrus sinensis)</option>
                <option value="Blueberry">Blueberry (Vaccinium)</option>
                <option value="Raspberry">Raspberry (Rubus idaeus)</option>
              </select>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-6 text-center transition bg-slate-950/40 group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="leaf-upload-input"
              />
              <label htmlFor="leaf-upload-input" className="cursor-pointer flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative w-full max-h-56 rounded-xl overflow-hidden mb-3 border border-slate-700 bg-black">
                    <img src={previewUrl} alt="Leaf Preview" className="w-full h-56 object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                )}

                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or Drag leaf photo here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP (Max 10MB)</p>
              </label>
            </div>

            {/* Run Diagnosis Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
                !selectedFile || loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ONNX Inference & Agronomy Processing...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Run AI Disease Diagnosis</span>
                </>
              )}
            </button>
          </div>

          {/* Model Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>Integrated ML Pipeline</span>
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE (38 Classes)
              </span>
            </div>
            <p className="text-slate-300 font-medium">Model: MobileNetV2 ONNX Classifier</p>
            <p className="text-slate-400">
              Coverage: 38 pathological classes across 14 crops (Apple, Potato, Tomato, Corn, Grape, Pepper, etc.)
            </p>
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Pesticide Logic:</span>
                <span className="text-slate-300 font-semibold">&gt;60% Confidence Rule</span>
              </div>
              <div>
                <span className="text-slate-500 block">Agronomy Engine:</span>
                <span className="text-slate-300 font-semibold">Nutrient Deficiency AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Results & Explainability Viewers */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
              {/* Header Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex gap-2">
                  {(['analysis', 'original', 'detection', 'heatmap'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        activeTab === tab
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'analysis' && 'Diagnostic Report'}
                      {tab === 'original' && 'Original Leaf'}
                      {tab === 'detection' && 'Leaf ROI (Box)'}
                      {tab === 'heatmap' && 'Attention Heatmap'}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400">
                  Time: <strong className="text-emerald-400">{result.processing_time_ms}ms</strong>
                </span>
              </div>

              {/* Tab 1: Full Analysis Overview */}
              {activeTab === 'analysis' && (
                <div className="space-y-5">
                  {/* Primary Diagnosis Header Card */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-medium">Primary Condition:</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            result.severity === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : result.severity === 'Critical'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {result.severity} Severity
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{result.primary_disease}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Diagnosed Crop:{' '}
                        <span className="text-emerald-300 font-semibold">{result.detected_plant}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-emerald-400 font-sans">
                        {result.confidence_pct}%
                      </span>
                      <span className="block text-xs text-slate-400 font-semibold">AI Confidence</span>
                    </div>
                  </div>

                  {/* Pathological Cause & Cure */}
                  {(result.cause || result.cure) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.cause && (
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pathological Cause</span>
                          </h4>
                          <p className="text-xs text-slate-300">{result.cause}</p>
                        </div>
                      )}
                      {result.cure && (
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pathological Cure</span>
                          </h4>
                          <p className="text-xs text-slate-300">{result.cure}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top-3 Model Probability Predictions */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Top Model Predictions (Softmax Distribution)</h4>
                    <div className="space-y-2">
                      {result.top_3_predictions.map((p, idx) => (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={p.is_primary ? 'font-bold text-emerald-400' : 'text-slate-300'}>
                              {p.class_name}
                            </span>
                            <span className="text-slate-400 font-semibold">{p.confidence_pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.is_primary ? 'bg-emerald-500' : 'bg-slate-600'}`}
                              style={{ width: `${Math.max(p.confidence_pct, 1)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🧪 Pesticide Spray Advisory Section (>60% rule) */}
                  {result.pesticide_advisory && (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Pesticide & Spray Advisory (&gt;60% Confidence Rule)
                          </h4>
                        </div>
                        {result.pesticide_advisory.should_spray ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Spray Recommended</span>
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>No Chemical Spray Needed</span>
                          </span>
                        )}
                      </div>

                      {result.pesticide_advisory.should_spray ? (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Chemical Pesticide */}
                            {result.pesticide_advisory.chemical_pesticide && (
                              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-amber-400 font-semibold block text-[11px]">
                                  🧪 Recommended Chemical Spray
                                </span>
                                <p className="font-medium text-slate-200">
                                  {result.pesticide_advisory.chemical_pesticide.name}
                                </p>
                                <p className="text-slate-400">
                                  <strong className="text-slate-300">Dosage:</strong>{' '}
                                  {result.pesticide_advisory.chemical_pesticide.dosage}
                                </p>
                                {result.pesticide_advisory.chemical_pesticide.brand_examples && (
                                  <p className="text-slate-400">
                                    <strong className="text-slate-300">Commercial Brands:</strong>{' '}
                                    {result.pesticide_advisory.chemical_pesticide.brand_examples}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Organic Alternative */}
                            {result.pesticide_advisory.organic_alternative && (
                              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-emerald-400 font-semibold block text-[11px]">
                                  🌿 Organic Alternative
                                </span>
                                <p className="font-medium text-slate-200">
                                  {result.pesticide_advisory.organic_alternative.name}
                                </p>
                                <p className="text-slate-400">
                                  <strong className="text-slate-300">Dosage:</strong>{' '}
                                  {result.pesticide_advisory.organic_alternative.dosage}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Application Guide & Safety Notes */}
                          {result.pesticide_advisory.application_guide && (
                            <div className="text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-slate-400 font-medium block mb-0.5">Application Schedule:</span>
                              {result.pesticide_advisory.application_guide}
                            </div>
                          )}

                          {result.pesticide_advisory.safety_notes && (
                            <div className="text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                              <span className="font-semibold block mb-0.5">⚠️ Safety & PPE Precautions:</span>
                              {result.pesticide_advisory.safety_notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-300 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                          <p className="font-medium text-emerald-300 mb-1">
                            {result.pesticide_advisory.recommendation_title || 'Healthy Crop Guidance'}
                          </p>
                          <p>{result.pesticide_advisory.advice}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🌿 AI Nutrient Deficiency Analysis Section */}
                  {result.nutrient_analysis && (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Agronomy Nutrient Deficiency Analysis
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Source: <strong className="text-emerald-400">{result.nutrient_analysis.ai_source || 'Agronomy AI'}</strong>
                        </span>
                      </div>

                      {result.nutrient_analysis.nutrients_lacking && result.nutrient_analysis.nutrients_lacking.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {result.nutrient_analysis.nutrients_lacking.map((item, i) => (
                              <div key={i} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-400">{item.nutrient}</span>
                                  {item.role && (
                                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                                      {item.role}
                                    </span>
                                  )}
                                </div>
                                {item.deficiency_cause && (
                                  <p className="text-slate-400">
                                    <strong className="text-slate-300">Why Deficient:</strong> {item.deficiency_cause}
                                  </p>
                                )}
                                {item.symptoms && (
                                  <p className="text-slate-400">
                                    <strong className="text-slate-300">Foliar Symptoms:</strong> {item.symptoms}
                                  </p>
                                )}
                                {item.supplement && (
                                  <div className="pt-1 border-t border-slate-800/80 text-emerald-300">
                                    <strong>Fertilizer Supplement:</strong> {item.supplement} {item.dosage ? `(${item.dosage})` : ''}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Recovery Plan */}
                          {result.nutrient_analysis.nutrient_recovery_plan && (
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                              <span className="text-emerald-400 font-semibold block mb-1">🎯 Nutrient Recovery Plan:</span>
                              <p>{result.nutrient_analysis.nutrient_recovery_plan}</p>
                            </div>
                          )}

                          {/* Soil Advice */}
                          {result.nutrient_analysis.soil_advice && (
                            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                              <span className="text-cyan-400 font-semibold block mb-1">🌱 Soil & Root Management:</span>
                              <p>{result.nutrient_analysis.soil_advice}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
                          <p className="text-emerald-400 font-medium">
                            🌿 All essential plant nutrients in optimal equilibrium; no critical deficiency detected.
                          </p>
                          {result.nutrient_analysis.nutrient_recovery_plan && (
                            <p className="text-slate-400">{result.nutrient_analysis.nutrient_recovery_plan}</p>
                          )}
                          {result.nutrient_analysis.soil_advice && (
                            <p className="text-slate-400">{result.nutrient_analysis.soil_advice}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Advisory Actions List */}
                  {result.advisory_actions && result.advisory_actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Recommended Advisory Actions</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        {result.advisory_actions.map((act, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer Notice */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{result.disclaimer}</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Original Image */}
              {activeTab === 'original' && (
                <div className="rounded-xl overflow-hidden border border-slate-800 max-h-96 flex items-center justify-center bg-black">
                  <img
                    src={previewUrl || result.original_image_url}
                    alt="Original"
                    className="max-h-96 object-contain"
                  />
                </div>
              )}

              {/* Tab 3: Bounding Box ROI */}
              {activeTab === 'detection' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Leaf Region-of-Interest (ROI) Contour & Bounding Box:</p>
                  <div className="rounded-xl overflow-hidden border border-emerald-800/60 max-h-96 flex items-center justify-center bg-black">
                    <img
                      src={result.bounding_box_url || previewUrl || result.original_image_url}
                      alt="Bounding Box ROI"
                      className="max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Grad-CAM Attention Heatmap */}
              {activeTab === 'heatmap' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Attention Heatmap (Model Saliency / Focus Area):</p>
                  <div className="rounded-xl overflow-hidden border border-teal-800/60 max-h-96 flex items-center justify-center bg-black glow-emerald">
                    <img
                      src={result.heatmap_url || previewUrl || result.original_image_url}
                      alt="Heatmap"
                      className="max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-200 text-base">No Leaf Image Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Upload a leaf photo on the left or click any of the "Quick Test Samples" above to run live MobileNetV2 ONNX inference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
