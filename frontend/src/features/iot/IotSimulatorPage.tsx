import React, { useState } from 'react';
import { api } from '../../api/client';
import { IrrigationAnalysisResponse } from '../../types';
import { Sliders, RefreshCw, CheckCircle2, Droplets, Thermometer, Wind, Database } from 'lucide-react';

export const IotSimulatorPage: React.FC = () => {
  const [soilMoisture, setSoilMoisture] = useState(22);
  const [temperature, setTemperature] = useState(35);
  const [humidity, setHumidity] = useState(48);
  const [waterTank, setWaterTank] = useState(65);
  const [loading, setLoading] = useState(false);
  const [recalculated, setRecalculated] = useState<IrrigationAnalysisResponse | null>(null);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      // 1. Post new telemetry reading to backend
      await api.sendSensorReading({
        field_id: 'field-indore-1',
        soil_moisture_pct: soilMoisture,
        temperature_c: temperature,
        humidity_pct: humidity,
        water_tank_pct: waterTank
      });

      // 2. Trigger smart irrigation engine recalculation
      const irrigRes = await api.analyzeIrrigation({
        farm_id: 'farm-indore-001',
        soil_moisture_pct: soilMoisture,
        temperature_c: temperature,
        humidity_pct: humidity
      });

      setRecalculated(irrigRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Hardware Simulation Layer</span>
        </div>
        <h1 className="text-2xl font-bold text-white">IoT Sensor Telemetry Simulator</h1>
        <p className="text-slate-400 text-sm">Simulate live ESP32 sensor readings to test real-time recalculations in the irrigation engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-6 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="font-semibold text-slate-200 text-base">Adjust Telemetry Controls</h2>

          {/* Soil Moisture Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5"><Droplets className="w-4 h-4 text-emerald-400" /> Soil Moisture (%)</span>
              <span className="text-emerald-400 font-bold text-sm font-sans">{soilMoisture}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-amber-400" /> Temperature (°C)</span>
              <span className="text-amber-400 font-bold text-sm font-sans">{temperature}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="48"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Humidity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5"><Wind className="w-4 h-4 text-cyan-400" /> Relative Humidity (%)</span>
              <span className="text-cyan-400 font-bold text-sm font-sans">{humidity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Water Tank Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5"><Database className="w-4 h-4 text-teal-400" /> Water Tank Level (%)</span>
              <span className="text-teal-400 font-bold text-sm font-sans">{waterTank}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={waterTank}
              onChange={(e) => setWaterTank(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
            <span>Simulate Telemetry Reading</span>
          </button>
        </div>

        {/* Recalculated Output Panel */}
        <div className="lg:col-span-6">
          {recalculated ? (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-semibold text-slate-200 text-base">Irrigation Engine Output</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-bold border border-emerald-500/20">Recalculated</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Recommendation</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${recalculated.irrigate_required ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {recalculated.irrigate_required ? 'Irrigation Required' : 'No Irrigation'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Recommended Window</span>
                  <span className="text-xs font-semibold text-white">{recalculated.recommended_window}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Water Volume</span>
                  <span className="text-xs font-semibold text-emerald-400">{recalculated.estimated_water_liters_per_acre} L/acre</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Engine Reasoning:</h4>
                <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {recalculated.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center min-h-[350px]">
              <Sliders className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="font-semibold text-slate-300">Adjust sliders & click 'Simulate Telemetry Reading'</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
