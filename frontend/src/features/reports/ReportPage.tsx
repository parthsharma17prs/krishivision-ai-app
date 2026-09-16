import React, { useState } from 'react';
import { api } from '../../api/client';
import { ReportOut } from '../../types';
import { FileText, Download, Sparkles, CheckCircle2 } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportOut | null>(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const res = await api.generateReport('farm-indore-001');
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>ReportLab Backend PDF Generator</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Diagnostic & Irrigation Reports</h1>
        <p className="text-slate-400 text-sm">Generate downloadable PDF field reports summarizing plant scans, moisture telemetry, and advisory actions.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-100 text-base">Generate New PDF Field Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Includes YOLOv11 diagnosis, soil telemetry, irrigation window, and risk factors.</p>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Generating PDF...' : 'Generate PDF Report'}</span>
          </button>
        </div>

        {report && (
          <div className="p-5 rounded-xl bg-slate-900 border border-emerald-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{report.title}</h3>
                <p className="text-xs text-slate-400">Generated: {new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>

            <a
              href={`/api${report.download_url}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
