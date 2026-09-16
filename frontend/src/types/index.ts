export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  state: string;
  district: string;
  total_area_acres: number;
  main_crop: string;
  health_score: number;
  fields: Field[];
  created_at: string;
}

export interface Field {
  id: string;
  name: string;
  area_acres: number;
  soil_type: string;
  irrigation_type: string;
}

export interface SensorReading {
  id: string;
  field_id: string;
  soil_moisture_pct: number;
  temperature_c: number;
  humidity_pct: number;
  water_tank_pct: number;
  timestamp: string;
}

export interface PredictionItem {
  class_name: string;
  confidence_pct: number;
  is_primary: boolean;
}

export interface DiseaseAnalysisResponse {
  scan_id: string;
  crop_cycle_id: string;
  detected_plant: string;
  primary_disease: string;
  confidence_pct: number;
  severity: string;
  affected_area_pct?: number;
  bounding_box_url?: string;
  heatmap_url?: string;
  original_image_url: string;
  top_3_predictions: PredictionItem[];
  advisory_actions: string[];
  mode: string;
  model_version: string;
  processing_time_ms: number;
  disclaimer: string;
}

export interface PestDetectionItem {
  pest_name: string;
  confidence_pct: number;
  bounding_box: number[];
}

export interface PestAnalysisResponse {
  scan_id: string;
  detected_pests: PestDetectionItem[];
  overall_severity: string;
  recommended_control: string[];
  mode: string;
  label_notice: string;
}

export interface NutrientAnalysisResponse {
  field_id: string;
  likely_deficiency: string;
  confidence_pct: number;
  deficiency_breakdown: Record<string, number>;
  supporting_evidence: string[];
  recommended_fertilizer_advisory: string[];
  recommended_soil_test: string;
  mode: string;
  notice: string;
}

export interface IrrigationAnalysisResponse {
  farm_id: string;
  field_name: string;
  crop_name: string;
  irrigate_required: boolean;
  urgency: string;
  recommended_window: string;
  estimated_water_liters_per_acre: number;
  current_soil_moisture_pct: number;
  optimal_moisture_range_pct: string;
  reasoning: string[];
  water_saving_explanation: string;
  mode: string;
}

export interface HourlyForecastItem {
  time: string;
  temp_c: number;
  humidity_pct: number;
  rain_prob_pct: number;
}

export interface DailyForecastItem {
  date: string;
  day_name: string;
  max_temp_c: number;
  min_temp_c: number;
  rain_prob_pct: number;
  condition: string;
  icon: string;
}

export interface WeatherIntelligenceResponse {
  location: string;
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  rain_probability_pct: number;
  wind_speed_kmh: number;
  condition: string;
  heat_risk_level: string;
  heavy_rain_risk_level: string;
  hourly_forecast: HourlyForecastItem[];
  daily_forecast: DailyForecastItem[];
  provider_mode: string;
}

export interface RiskFactor {
  risk_type: string;
  risk_level: string;
  score_pct: number;
  title: string;
  description: string;
  mitigation_steps: string[];
}

export interface RiskAnalysisResponse {
  farm_id: string;
  overall_farm_risk_level: string;
  assessment_date: string;
  active_risks: RiskFactor[];
  mode: string;
  disclaimer: string;
}

export interface AssistantChatResponse {
  farm_id: string;
  user_query: string;
  response_text: string;
  detected_language: string;
  suggested_followups: string[];
  mode: string;
}

export interface ReportOut {
  id: string;
  farm_id: string;
  report_type: string;
  title: string;
  file_path: string;
  download_url: string;
  created_at: string;
}

export interface DashboardOverviewResponse {
  farm: Farm;
  health_score: number;
  health_score_breakdown: Record<string, number>;
  current_telemetry: SensorReading;
  weather: WeatherIntelligenceResponse;
  irrigation_summary: IrrigationAnalysisResponse;
  recent_scans: DiseaseAnalysisResponse[];
  active_alerts: any[];
  active_risks: RiskFactor[];
}

export interface ModelStatusItem {
  model_key: string;
  architecture: string;
  provider: string;
  status: string;
  mode: string;
}
