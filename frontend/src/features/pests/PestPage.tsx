import React, { useState } from 'react';
import { api } from '../../api/client';
import { PestAnalysisResponse } from '../../types';
import { Bug, Sparkles, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

export const PestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PestAnalysisResponse | null>(null);

  const runPestScan = async () => {
    try {
      setLoading(true);
      const res = await api.analyzePest('field-indore-1', 'Tomato');
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Bug className="w-3.5 h-3.5" />
            <span>Modular Adapter Interface Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Pest Scanner Service</h1>
          <p className="text-slate-400 text-sm">Detect insect pest infestations (Helicoverpa armigera, Whiteflies, Aphids).</p>
        </div>

        <button
          onClick={runPestScan}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Scanning...' : 'Run Pest Scan'}</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
        <Info className="w-5 h-5 shrink-0 text-amber-400" />
        <div>
          <p className="font-bold">Adapter Interface Notice</p>
          <p className="text-amber-200/80">Demo inference — replace with trained YOLO pest model for field deployment. The UI and API contract remain unchanged when swapping model adapters.</p>
        </div>
      </div>

      {/* Results View */}
      {result ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400">Scan Severity</span>
              <h3 className="text-xl font-bold text-amber-400">{result.overall_severity}</h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">Mode: {result.mode}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-3">Detected Pests</h4>
            <div className="space-y-3">
              {result.detected_pests.map((pest, i) => (
                <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm">{pest.pest_name}</h5>
                    <p className="text-xs text-slate-400">Bounding Box ROI: [{pest.bounding_box.join(', ')}]</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400 font-sans">{pest.confidence_pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Recommended Control Measures</h4>
            <ul className="space-y-2 text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800">
              {result.recommended_control.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <Bug className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-300">Click 'Run Pest Scan' to evaluate crop infestation</h3>
        </div>
      )}
    </div>
  );
};
