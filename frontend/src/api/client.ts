import axios from 'axios';
import {
  DashboardOverviewResponse,
  DiseaseAnalysisResponse,
  PestAnalysisResponse,
  NutrientAnalysisResponse,
  IrrigationAnalysisResponse,
  WeatherIntelligenceResponse,
  RiskAnalysisResponse,
  AssistantChatResponse,
  ReportOut,
  ModelStatusItem,
  SensorReading,
  LiveFeedRecord,
  LiveFeedStats,
  LiveFeedStatus
} from '../types';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('krishivision_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Dashboard
  getDashboard: async (farmId: string = 'farm-indore-001'): Promise<DashboardOverviewResponse> => {
    const res = await apiClient.get(`/dashboard/${farmId}`);
    return res.data;
  },

  // AI Plant Doctor (Disease Detection)
  analyzeDisease: async (file: File, cropName: string = 'Tomato'): Promise<DiseaseAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_name', cropName);
    const res = await apiClient.post('/analysis/disease', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Pest Analysis
  analyzePest: async (file?: File, samplePath?: string, cropName: string = 'Corn (Maize)'): Promise<PestAnalysisResponse> => {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    if (samplePath) {
      formData.append('sample_path', samplePath);
    }
    formData.append('crop_name', cropName);

    const res = await apiClient.post('/analysis/pest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  analyzeNutrient: async (payload: any): Promise<NutrientAnalysisResponse> => {
    const res = await apiClient.post('/analysis/nutrient', payload);
    return res.data;
  },
  analyzeNutrientImage: async (file: File | Blob, params: any): Promise<NutrientAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file, 'leaf_capture.jpg');
    formData.append('crop_name', params.crop_name || 'Corn (Maize)');
    formData.append('growth_stage', params.growth_stage || 'Flowering & Fruit Setting');
    formData.append('soil_ph', (params.soil_ph || 7.8).toString());
    formData.append('npk_n', (params.npk_sensor?.N || 100).toString());
    formData.append('npk_p', (params.npk_sensor?.P || 40).toString());
    formData.append('npk_k', (params.npk_sensor?.K || 170).toString());
    formData.append('micro_mg', (params.micronutrient_sensor?.Mg || 2.1).toString());
    formData.append('micro_fe', (params.micronutrient_sensor?.Fe || 3.8).toString());
    formData.append('micro_zn', (params.micronutrient_sensor?.Zn || 0.7).toString());

    const res = await apiClient.post('/analysis/nutrient-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Irrigation Intelligence
  getIrrigation: async (farmId: string = 'farm-indore-001'): Promise<IrrigationAnalysisResponse> => {
    const res = await apiClient.get(`/irrigation/${farmId}`);
    return res.data;
  },
  analyzeIrrigation: async (params: any): Promise<IrrigationAnalysisResponse> => {
    const res = await apiClient.post('/irrigation/analyze', params);
    return res.data;
  },

  // Weather Intelligence
  getWeather: async (location: string = 'Indore, Madhya Pradesh'): Promise<WeatherIntelligenceResponse> => {
    const res = await apiClient.get(`/weather/current?location=${encodeURIComponent(location)}`);
    return res.data;
  },

  // Risk Assessment
  getRisk: async (farmId: string = 'farm-indore-001'): Promise<RiskAnalysisResponse> => {
    const res = await apiClient.get(`/risk/${farmId}`);
    return res.data;
  },

  // IoT Sensor Telemetry
  sendSensorReading: async (reading: { field_id: string; soil_moisture_pct: number; temperature_c: number; humidity_pct: number; water_tank_pct: number }): Promise<SensorReading> => {
    const res = await apiClient.post('/sensors/readings', reading);
    return res.data;
  },
  syncGsheets: async () => {
    const res = await apiClient.get('/sensors/gsheets-sync');
    return res.data;
  },

  // Assistant
  chatAssistant: async (query: string, language: string = 'English'): Promise<AssistantChatResponse> => {
    const res = await apiClient.post('/assistant/chat', {
      farm_id: 'farm-indore-001',
      query,
      language
    });
    return res.data;
  },

  // Reports
  generateReport: async (farmId: string = 'farm-indore-001'): Promise<ReportOut> => {
    const res = await apiClient.post(`/reports?farm_id=${farmId}`);
    return res.data;
  },

  // Models Status
  getModelsStatus: async (): Promise<ModelStatusItem[]> => {
    const res = await apiClient.get('/models/status');
    return res.data;
  },

  // Live Image Feed & Drive Pipeline
  getLiveFeedStatus: async (): Promise<LiveFeedStatus> => {
    const res = await apiClient.get('/live-feed/status');
    return res.data;
  },
  getLiveFeedStats: async (): Promise<LiveFeedStats> => {
    const res = await apiClient.get('/live-feed/stats');
    return res.data;
  },
  getLiveFeedRecords: async (crop?: string, severity?: string, limit: number = 50): Promise<LiveFeedRecord[]> => {
    const params = new URLSearchParams();
    if (crop) params.append('crop', crop);
    if (severity) params.append('severity', severity);
    params.append('limit', limit.toString());
    const res = await apiClient.get(`/live-feed/records?${params.toString()}`);
    return res.data;
  },
  getLatestLiveFeed: async (): Promise<LiveFeedRecord> => {
    const res = await apiClient.get('/live-feed/latest');
    return res.data;
  },
  pollDriveNow: async () => {
    const res = await apiClient.post('/live-feed/poll-now');
    return res.data;
  },
  toggleLiveFeedPolling: async (active?: boolean) => {
    const res = await apiClient.post('/live-feed/toggle', null, {
      params: active !== undefined ? { active } : {}
    });
    return res.data;
  },
  simulateLiveFeedCapture: async (sample?: string) => {
    const res = await apiClient.post('/live-feed/simulate-capture', null, {
      params: sample ? { sample } : {}
    });
    return res.data;
  },
  uploadLiveCameraCapture: async (file: File | Blob, filename: string = 'camera_capture.jpg') => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await apiClient.post('/live-feed/upload-capture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  triggerStuckSimulation: async () => {
    const res = await apiClient.post('/live-feed/trigger-stuck-simulation');
    return res.data;
  },
  triggerEmergencyCall: async () => {
    const res = await apiClient.post('/live-feed/trigger-emergency-call');
    return res.data;
  }
};
