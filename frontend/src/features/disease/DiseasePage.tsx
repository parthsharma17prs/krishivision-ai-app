import React, { useState } from 'react';
import { api } from '../../api/client';
import { DiseaseAnalysisResponse } from '../../types';
import {
  Upload,
  Camera,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Eye,
  Sliders,
  ShieldAlert,
  Info
} from 'lucide-react';

export const DiseasePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'original' | 'detection' | 'heatmap'>('analysis');
  const [cropName, setCropName] = useState('Tomato');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      const res = await api.analyzeDisease(selectedFile, cropName);
      setResult(res);
      setActiveTab('analysis');
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleImage = () => {
    setResult({
      scan_id: 'scan-sample-99',
      crop_cycle_id: 'cycle-indore-1',
      detected_plant: 'Tomato',
      primary_disease: 'Tomato Early Blight (Alternaria solani)',
      confidence_pct: 91.4,
      severity: 'Moderate',
      affected_area_pct: 18.0,
      bounding_box_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80',
      heatmap_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80',
      original_image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80',
      top_3_predictions: [
        { class_name: 'Tomato Early Blight', confidence_pct: 91.4, is_primary: true },
        { class_name: 'Tomato Late Blight', confidence_pct: 5.2, is_primary: false },
        { class_name: 'Tomato Septoria Leaf Spot', confidence_pct: 2.1, is_primary: false }
      ],
      advisory_actions: [
        'Prune infected lower leaves exhibiting brown concentric ring spots.',
        'Avoid overhead drip watering to maintain foliage dryness.',
        'Apply bio-fungicide (Trichoderma viride) or copper oxychloride under expert guidance.'
      ],
      mode: 'DEMO',
      model_version: 'YOLOv11+ViT-v1.0',
      processing_time_ms: 145,
      disclaimer: 'AI advisory model. Verify critical crop diagnoses with an agricultural extension officer.'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Two-Stage Pipeline: YOLOv11 Detector + ViT Base Classifier</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Plant Doctor</h1>
          <p className="text-slate-400 text-sm">Upload crop leaf photo for disease detection, bounding-box ROI, and Grad-CAM attention visualizer.</p>
        </div>

        <button
          onClick={loadSampleImage}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Load Demo Sample Leaf</span>
        </button>
      </div>

      {/* Main Scanner Workspace Grid */}
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
                <option value="Corn">Corn (Zea mays)</option>
                <option value="Apple">Apple (Malus domestica)</option>
                <option value="Cotton">Cotton (Gossypium)</option>
                <option value="Rice">Rice (Oryza sativa)</option>
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
                  <div className="relative w-full max-h-56 rounded-xl overflow-hidden mb-3 border border-slate-700">
                    <img src={previewUrl} alt="Leaf Preview" className="w-full h-full object-cover" />
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
                  <span>YOLOv11 ROI Detection & ViT Inferencing...</span>
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
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span>Model Status</span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">READY (PlantDoc 30 Classes)</span>
            </div>
            <p>Architecture: YOLOv11 Bounding Box + ViT Base Patch16 224</p>
            <p>Explainability: Grad-CAM Model Attention Map Generation</p>
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
                      {tab}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400">Time: <strong className="text-emerald-400">{result.processing_time_ms}ms</strong></span>
              </div>

              {/* Tab 1: Full Analysis Overview */}
              {activeTab === 'analysis' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Primary Diagnosis</span>
                      <h3 className="text-xl font-bold text-white mt-0.5">{result.primary_disease}</h3>
                      <p className="text-xs text-slate-400 mt-1">Target Crop: <span className="text-emerald-300 font-semibold">{result.detected_plant}</span></p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-emerald-400 font-sans">{result.confidence_pct}%</span>
                      <span className="block text-xs text-slate-400 font-semibold">Confidence</span>
                    </div>
                  </div>

                  {/* Confidence Breakdown Bars */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Top-3 Model Predictions</h4>
                    <div className="space-y-2">
                      {result.top_3_predictions.map((p, idx) => (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={p.is_primary ? 'font-bold text-emerald-400' : 'text-slate-300'}>{p.class_name}</span>
                            <span className="text-slate-400 font-semibold">{p.confidence_pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.is_primary ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${p.confidence_pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advisory Actions */}
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
                  <img src={previewUrl || result.original_image_url} alt="Original" className="max-h-96 object-contain" />
                </div>
              )}

              {/* Tab 3: Bounding Box ROI (YOLOv11) */}
              {activeTab === 'detection' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">YOLOv11 Leaf ROI Detection & Bounding Box Extractor:</p>
                  <div className="rounded-xl overflow-hidden border border-emerald-800/60 max-h-96 flex items-center justify-center bg-black">
                    <img src={previewUrl || result.original_image_url} alt="Bounding Box ROI" className="max-h-96 object-contain" />
                  </div>
                </div>
              )}

              {/* Tab 4: Grad-CAM Attention Heatmap */}
              {activeTab === 'heatmap' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Vision Transformer Grad-CAM Attention Heatmap Overlay:</p>
                  <div className="rounded-xl overflow-hidden border border-teal-800/60 max-h-96 flex items-center justify-center bg-black glow-emerald">
                    <img src={previewUrl || result.original_image_url} alt="Heatmap" className="max-h-96 object-contain" />
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
              <p className="text-xs text-slate-400 max-w-sm mt-1">Upload a leaf photo on the left or click "Load Demo Sample Leaf" to test the YOLOv11 + ViT inference pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
