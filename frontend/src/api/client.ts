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
  SensorReading
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
  analyzePest: async (fieldId: string = 'field-indore-1', cropName: string = 'Tomato'): Promise<PestAnalysisResponse> => {
    const res = await apiClient.post('/analysis/pest', { field_id: fieldId, crop_name: cropName });
    return res.data;
  },

  // Nutrient Analysis
  analyzeNutrient: async (payload: any): Promise<NutrientAnalysisResponse> => {
    const res = await apiClient.post('/analysis/nutrient', payload);
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
  }
};
