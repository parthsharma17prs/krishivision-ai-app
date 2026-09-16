import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { WeatherIntelligenceResponse } from '../../types';
import { CloudSun, Sun, CloudRain, Wind, Droplets, Info } from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const [data, setData] = useState<WeatherIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      setLoading(true);
      const res = await api.getWeather('Indore, Madhya Pradesh');
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
      <div className="flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <CloudSun className="w-3.5 h-3.5" />
            <span>Weather Intelligence Abstraction</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Weather Intelligence</h1>
          <p className="text-slate-400 text-sm">{data.location} hyper-local agricultural weather forecast.</p>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${data.provider_mode === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
          Provider: {data.provider_mode}
        </span>
      </div>

      {/* Current Overview Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <Sun className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <span className="text-xs text-slate-400">Temperature</span>
          <p className="text-2xl font-bold text-white font-sans mt-0.5">{data.temperature_c}°C</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <Droplets className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
          <span className="text-xs text-slate-400">Humidity</span>
          <p className="text-2xl font-bold text-white font-sans mt-0.5">{data.humidity_pct}%</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <CloudRain className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <span className="text-xs text-slate-400">Rain Probability</span>
          <p className="text-2xl font-bold text-white font-sans mt-0.5">{data.rain_probability_pct}%</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <Wind className="w-6 h-6 text-teal-400 mx-auto mb-1" />
          <span className="text-xs text-slate-400">Wind Speed</span>
          <p className="text-2xl font-bold text-white font-sans mt-0.5">{data.wind_speed_kmh} km/h</p>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-semibold text-slate-200 text-sm">7-Day Daily Forecast</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {data.daily_forecast.map((d, i) => (
            <div key={i} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-slate-300 block">{d.day_name}</span>
              <span className="text-[10px] text-slate-500 block">{d.date}</span>
              <div className="my-2 flex justify-center">
                <CloudSun className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white">{d.max_temp_c}°C / <span className="text-slate-400">{d.min_temp_c}°C</span></p>
              <span className="text-[10px] text-cyan-400 font-semibold block">{d.rain_prob_pct}% Rain</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
