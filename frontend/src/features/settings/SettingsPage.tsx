import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ModelStatusItem } from '../../types';
import { Settings, Cpu, ShieldCheck, Database, Server } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [models, setModels] = useState<ModelStatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const res = await api.getModelsStatus();
      setModels(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>System Configuration & Model Manifest Registry</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Settings & Status</h1>
        <p className="text-slate-400 text-sm">Inspect ML model status, provider adapters, and environment mode.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="font-semibold text-slate-200 text-base flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>Model Registry Status</span>
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400">Loading model manifest status...</p>
        ) : (
          <div className="space-y-3">
            {models.map((m) => (
              <div key={m.model_key} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm capitalize">{m.model_key} Model Adapter</h3>
                  <p className="text-xs text-slate-400">Architecture: {m.architecture}</p>
                  <p className="text-[11px] text-slate-500">Provider: {m.provider}</p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded border ${m.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {m.status.toUpperCase()} ({m.mode})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <p className="font-bold text-slate-200">Hackathon Demo Credentials:</p>
        <p>Email: <code className="text-emerald-400">farmer@demo.local</code> | Password: <code className="text-emerald-400">Demo@123</code></p>
        <p>Database: SQLite / PostgreSQL | Storage: Local Filesystem (`/uploads`)</p>
      </div>
    </div>
  );
};
