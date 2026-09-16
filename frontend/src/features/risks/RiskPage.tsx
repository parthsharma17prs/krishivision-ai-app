import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { RiskAnalysisResponse } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const RiskPage: React.FC = () => {
  const [data, setData] = useState<RiskAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    try {
      setLoading(true);
      const res = await api.getRisk('farm-indore-001');
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Agricultural Risk Assessment Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Agricultural Risk Alerts</h1>
        <p className="text-slate-400 text-sm">Early warning risk monitoring for Heat Waves, Droughts, Floods, and Disease Outbreaks.</p>
      </div>

      {/* Overall Level Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-400">Overall Farm Risk Assessment</span>
          <h2 className="text-2xl font-bold text-amber-400 mt-1">{data.overall_farm_risk_level} RISK</h2>
        </div>
        <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">Mode: {data.mode}</span>
      </div>

      {/* Risk Factors Grid */}
      <div className="space-y-4">
        {data.active_risks.map((risk, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${risk.risk_level === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{risk.title}</h3>
                  <span className="text-xs text-slate-400">{risk.risk_type}</span>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${risk.risk_level === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {risk.risk_level} ({risk.score_pct}%)
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">{risk.description}</p>

            {risk.mitigation_steps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Recommended Mitigation Steps:</h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {risk.mitigation_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
