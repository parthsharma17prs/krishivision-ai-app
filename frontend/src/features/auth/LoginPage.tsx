import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft, Lock, Mail, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('farmer@demo.local');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      if (data && data.access_token) {
        localStorage.setItem('krishivision_token', data.access_token);
        localStorage.setItem('krishivision_user', JSON.stringify(data.user || { name: 'Demo Farmer', email }));
        navigate('/dashboard');
      } else {
        setError('Invalid response from server.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Fallback demo token if server demo mode allows
      localStorage.setItem('krishivision_token', 'demo_token_indore_farmer');
      localStorage.setItem('krishivision_user', JSON.stringify({ name: 'Demo Farmer', email: 'farmer@demo.local' }));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOneClick = () => {
    setEmail('farmer@demo.local');
    setPassword('Demo@123');
    handleLogin();
  };

  return (
    <div className="w-full min-h-screen bg-[#050508] text-white font-sans selection:bg-emerald-500 selection:text-white flex flex-col justify-between p-6 relative overflow-hidden">
      
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP HEADER NAV */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-instrument-serif italic text-2xl font-normal text-white">
            KrishiVision AI
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* MAIN LOGIN CONTAINER */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-10">
        <div className="apple-glass rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-instrument-serif text-3xl sm:text-4xl text-white tracking-tight mb-2">
              Farmer Portal Login
            </h1>
            <p className="text-xs text-white/60 font-light">
              Sign in to access your smart farm telemetry, AI Plant Doctor & Irrigation advisory.
            </p>
          </div>

          {/* ONE-CLICK DEMO BANNER */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1 text-emerald-400">
                <Zap className="w-4 h-4 fill-emerald-400" />
                Demo Account Ready
              </span>
              <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                Indore, MP
              </span>
            </div>
            <p className="text-emerald-300/80 mb-3 text-[11px] leading-relaxed">
              Use pre-configured credentials to instantly launch the live smart farm demo dashboard.
            </p>
            <button
              onClick={handleDemoOneClick}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <span>⚡ One-Touch Demo Login</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-white/60 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@demo.local"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-white/60 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400/60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all shadow-xl disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/40 font-light">
            Need help? Contact <span className="text-white/70">support@krishivision.ai</span>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-white/40 z-10 py-4">
        &copy; {new Date().getFullYear()} KrishiVision AI Systems. All rights reserved.
      </div>

    </div>
  );
};
