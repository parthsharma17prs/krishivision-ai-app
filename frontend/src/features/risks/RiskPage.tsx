import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import { RiskAnalysisResponse, RiskFactor } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  Radio,
  UserCheck,
  AlertOctagon,
  Sparkles
} from 'lucide-react';

export const RiskPage: React.FC = () => {
  const [data, setData] = useState<RiskAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-escalation countdown timer (in seconds)
  const [autoCallTimer, setAutoCallTimer] = useState<number>(60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Hold-to-call button state
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdTimeLeft, setHoldTimeLeft] = useState<number>(3.0); // 3 seconds hold requirement
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Call modal state
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeCallRisk, setActiveCallRisk] = useState<RiskFactor | null>(null);

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRisks();
  }, []);

  // Countdown timer for automatic emergency call escalation
  useEffect(() => {
    if (isTimerPaused || callStatus !== 'idle') return;

    const timer = setInterval(() => {
      setAutoCallTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerCall(data?.active_risks[0] || null, 'Auto-Timer Triggered');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, callStatus, data]);

  // Call duration counter when call is connected
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

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

  // Hold button logic
  const handleHoldStart = (risk?: RiskFactor) => {
    if (callStatus !== 'idle') return;
    setIsHolding(true);
    setHoldProgress(0);
    setHoldTimeLeft(3.0);

    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      const remaining = Math.max(0, (duration - elapsed) / 1000);

      setHoldProgress(progress);
      setHoldTimeLeft(remaining);

      if (elapsed >= duration) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(100);
        setHoldTimeLeft(0);
        triggerCall(risk || data?.active_risks[0] || null, 'Hold Button Triggered');
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (holdProgress < 100) {
      setIsHolding(false);
      setHoldProgress(0);
      setHoldTimeLeft(3.0);
    }
  };

  const triggerCall = (risk: RiskFactor | null, source: string = 'Manual') => {
    setActiveCallRisk(risk);
    setCallStatus('dialing');
    setCallDuration(0);

    // Simulate connection after 2.5 seconds
    setTimeout(() => {
      setCallStatus('connected');
    }, 2500);
  };

  const endCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
      setHoldProgress(0);
      setHoldTimeLeft(3.0);
    }, 1500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Running Risk Analysis Engine & Escalation Monitors...</p>
      </div>
    );
  }

  const primaryRisk = data.active_risks[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Real-Time Risk Monitoring & SOS Escalation System</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Agricultural Risk Analysis</h1>
          <p className="text-slate-400 text-sm">
            Continuous threat evaluation for Heatwaves, Droughts, Pest Swarms, and Crop Pathogens.
          </p>
        </div>

        {/* Top Overall Risk Badge */}
        <div className="flex items-center gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Farm Risk Score</span>
            <div className="text-base font-bold text-amber-400">
              {data.overall_farm_risk_level} RISK LEVEL
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY ESCALATION & TIMER CALL TRIGGER CARD */}
      <div className="glass-card rounded-2xl p-6 border-2 border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 shadow-2xl relative overflow-hidden">
        {/* Subtle background pulse animation */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Risk Warning Alert Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/40 uppercase tracking-wider">
                    High Alert Threat Detected
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: RISK-IN-2026</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {primaryRisk ? primaryRisk.title : 'Critical Soil Moisture Deficit & Heat Stress'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {primaryRisk ? primaryRisk.description : 'Risk score exceeds safe thresholds. Automated agronomist hotline dispatch timer is running.'}
                </p>
              </div>
            </div>

            {/* Countdown Escalation Timer */}
            <div className="bg-slate-950/90 border border-red-500/30 p-4 rounded-xl flex items-center gap-4 min-w-[240px] justify-between shadow-inner">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400 animate-spin" />
                  <span>Auto Call Dispatch Timer</span>
                </span>
                <span className="text-3xl font-black font-mono text-red-400 tracking-tight">
                  {formatTimer(autoCallTimer)}
                </span>
                <span className="text-[10px] text-slate-400 block">Dispatching Krishi SOS Call</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setIsTimerPaused(!isTimerPaused)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                >
                  {isTimerPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-[10px]">{isTimerPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={() => setAutoCallTimer(60)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  title="Reset Timer to 60s"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px]">Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* HOLD FOR CALL TRIGGER CONTROLS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Instant Emergency Agronomist Call Trigger</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Press and hold the button below for <strong>3 seconds</strong> to bypass timer and immediately place an SOS emergency call to Senior Agronomist (Dr. Ramesh Sharma) and Krishi Helpline.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 24/7 AI Voice Sync
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automatic Field Telemetry Relay
                </span>
              </div>
            </div>

            {/* THE HOLD BUTTON WITH LIVE TIMER */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full relative">
                <button
                  onMouseDown={() => handleHoldStart(primaryRisk)}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={() => handleHoldStart(primaryRisk)}
                  onTouchEnd={handleHoldEnd}
                  disabled={callStatus !== 'idle'}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-150 relative overflow-hidden select-none flex flex-col items-center justify-center shadow-xl border ${
                    isHolding
                      ? 'bg-red-600 text-white border-red-400 scale-[0.99] shadow-red-500/50'
                      : callStatus !== 'idle'
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white border-red-400/50 hover:from-red-500 hover:to-amber-500 active:scale-[0.98]'
                  }`}
                >
                  {/* Hold Fill Progress Bar */}
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-red-500/80 transition-all duration-75 ease-linear pointer-events-none"
                    style={{ width: `${holdProgress}%` }}
                  ></div>

                  {/* Button Content */}
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <PhoneCall className={`w-5 h-5 ${isHolding ? 'animate-bounce text-white' : ''}`} />
                    <div className="text-left">
                      <span className="block text-sm font-extrabold uppercase tracking-wider">
                        {isHolding ? 'HOLDING FOR EMERGENCY CALL...' : 'HOLD 3s FOR CALL TRIGGER'}
                      </span>
                      <span className="block text-[11px] font-mono text-red-100 font-medium">
                        {isHolding
                          ? `Timer: ${holdTimeLeft.toFixed(1)}s remaining (${Math.round(holdProgress)}%)`
                          : `Hold button 3.0s or Auto Call in ${formatTimer(autoCallTimer)}`}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Direct instant call fallback button */}
                <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
                  <span>Hold Safety Lock Active</span>
                  <button
                    onClick={() => triggerCall(primaryRisk, 'Instant Click')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
                  >
                    <span>Instant Call (1-Click)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALL ACTIVE FARM RISKS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Active Identified Risk Factors</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {data.active_risks.length} Threats Tracked
          </span>
        </div>

        {data.active_risks.map((risk, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    risk.risk_level === 'HIGH'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{risk.title}</h3>
                  <span className="text-xs text-slate-400 font-mono">{risk.risk_type}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg border font-mono ${
                    risk.risk_level === 'HIGH'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {risk.risk_level} ({risk.score_pct}% Severity)
                </span>

                {/* Per-risk call trigger hold button */}
                <button
                  onMouseDown={() => handleHoldStart(risk)}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={() => handleHoldStart(risk)}
                  onTouchEnd={handleHoldEnd}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hold to Call</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
              {risk.description}
            </p>

            {risk.mitigation_steps && risk.mitigation_steps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Action & Mitigation Steps:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {risk.mitigation_steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LIVE IVR SOS CALL MODAL */}
      {callStatus !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border-2 border-emerald-500/40 bg-slate-950 text-white shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Krishi Emergency SOS Line</span>
              </div>
              <h3 className="text-xl font-bold">
                {callStatus === 'dialing' ? 'Dialing Agronomist SOS...' : 'Connected to Krishi Expert'}
              </h3>
              <p className="text-xs text-slate-400">
                Target Risk: <span className="text-white font-semibold">{activeCallRisk?.title || 'Farm Risk Alert'}</span>
              </p>
            </div>

            {/* Call Avatar & Audio Visualizer */}
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg border-4 ${callStatus === 'connected' ? 'border-emerald-400 ring-4 ring-emerald-500/30 animate-pulse' : 'border-slate-700'}`}>
                  <UserCheck className="w-12 h-12 text-white" />
                </div>
                {callStatus === 'connected' && (
                  <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                  </span>
                )}
              </div>

              <div className="text-center">
                <h4 className="font-bold text-lg text-white">Dr. Ramesh Sharma</h4>
                <p className="text-xs text-slate-400">Senior Agricultural Advisor • MP District</p>
                <div className="mt-2 font-mono text-emerald-400 text-sm font-bold bg-slate-900 px-4 py-1 rounded-full border border-slate-800 inline-block">
                  {callStatus === 'dialing' ? 'Ringing...' : `Live Call: ${formatTimer(callDuration)}`}
                </div>
              </div>

              {/* Animated Voice Waveform */}
              {callStatus === 'connected' && (
                <div className="flex items-center gap-1.5 h-8">
                  <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                  <span className="w-1.5 h-7 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                </div>
              )}
            </div>

            {/* AI Call Transcript Box */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">
                Automated Telemetry Relay Transcript
              </span>
              <p className="text-slate-300 italic">
                {callStatus === 'dialing'
                  ? 'Connecting to agricultural distress responder...'
                  : '"Hello Rajesh, we received your automatic high heat risk signal for Farm Indore 001. Dispatching emergency irrigation advisory to your WhatsApp..."'}
              </p>
            </div>

            {/* Call Controls Bar */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full border transition ${isMuted ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 transition scale-105 active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                className="p-3.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
                title="Speakerphone"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

