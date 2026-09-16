import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IrrigationAnalysisResponse } from '../../types';
import { Droplets, CheckCircle2, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export const IrrigationPage: React.FC = () => {
  const [data, setData] = useState<IrrigationAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIrrigation();
  }, []);

  const loadIrrigation = async () => {
    try {
      setLoading(true);
      const res = await api.getIrrigation('farm-indore-001');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Droplets className="w-3.5 h-3.5" />
          <span>Weather-Aware Evapotranspiration & Soil Moisture Model</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Smart Irrigation Intelligence</h1>
        <p className="text-slate-400 text-sm">Optimize water delivery windows, save irrigation costs, and prevent root crop stress.</p>
      </div>

      {/* Main Status Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs text-slate-400">Irrigation Recommendation Status</span>
            <h2 className="text-2xl font-bold text-white mt-1">
              {data.irrigate_required ? 'Irrigation Recommended' : 'Do Not Irrigate Now'}
            </h2>
            <p className="text-sm text-emerald-400 mt-1">Recommended Window: <strong>{data.recommended_window}</strong></p>
          </div>

          <div className="flex gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Water Volume</span>
              <p className="text-lg font-bold text-emerald-400 font-sans">{data.estimated_water_liters_per_acre} L/acre</p>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-xs text-slate-400">Urgency</span>
              <p className="text-lg font-bold text-amber-400 font-sans">{data.urgency}</p>
            </div>
          </div>
        </div>

        {/* Transparent Reasoning */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Transparent Model Reasoning</h3>
          <ul className="space-y-2 text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800">
            {data.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Water Saving Note */}
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs">
          <strong>Water Conservation Impact:</strong> {data.water_saving_explanation}
        </div>
      </div>
    </div>
  );
};
