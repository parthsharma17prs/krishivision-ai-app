import React, { useState } from 'react';
import { api } from '../../api/client';
import { NutrientAnalysisResponse } from '../../types';
import { TestTube, Sparkles, Info, CheckCircle2 } from 'lucide-react';

export const NutrientPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutrientAnalysisResponse | null>(null);

  const runNutrientAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.analyzeNutrient({
        field_id: 'field-indore-1',
        crop_name: 'Tomato',
        growth_stage: 'Flowering & Fruit Setting',
        soil_ph: 6.8,
        npk_sensor: { N: 110, P: 45, K: 175 }
      });
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
            <TestTube className="w-3.5 h-3.5" />
            <span>Multimodal Assessment (NPK Telemetry + Growth Stage + pH)</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Nutrient Deficiency Analysis</h1>
          <p className="text-slate-400 text-sm">Analyze Nitrogen, Phosphorus, Potassium, Magnesium, Iron, and Zinc balance.</p>
        </div>

        <button
          onClick={runNutrientAnalysis}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Evaluating...' : 'Run Nutrient Assessment'}</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
        <Info className="w-5 h-5 shrink-0 text-teal-400" />
        <span>Preliminary AI assessment — confirm with soil or leaf petiole tissue lab testing before applying heavy chemical fertilizers.</span>
      </div>

      {result ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400">Primary Deficiency</span>
              <h3 className="text-xl font-bold text-teal-400">{result.likely_deficiency}</h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-400 font-sans">{result.confidence_pct}%</span>
              <span className="block text-xs text-slate-400">Confidence</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-3">Nutrient Deficit Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(result.deficiency_breakdown).map(([nut, val]) => (
                <div key={nut} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">{nut}</span>
                  <p className="text-base font-bold text-slate-100 font-sans mt-0.5">{val.toFixed(1)}% Deficit</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Supporting Multimodal Evidence</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800">
              {result.supporting_evidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <TestTube className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-300">Click 'Run Nutrient Assessment' to check NPK & pH balance</h3>
        </div>
      )}
    </div>
  );
};
