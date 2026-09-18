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

export interface ChemicalPesticide {
  name?: string;
  dosage?: string;
  brand_examples?: string;
}

export interface OrganicAlternative {
  name?: string;
  dosage?: string;
}

export interface PesticideAdvisory {
  status?: string;
  should_spray?: boolean;
  threshold_met?: boolean;
  confidence?: number;
  crop?: string;
  disease_name?: string;
  pathogen_type?: string;
  recommendation_title?: string;
  chemical_pesticide?: ChemicalPesticide;
  organic_alternative?: OrganicAlternative;
  application_guide?: string;
  safety_notes?: string;
  message?: string;
  advice?: string;
}

export interface NutrientDeficiencyItem {
  nutrient: string;
  role?: string;
  deficiency_cause?: string;
  symptoms?: string;
  supplement?: string;
  dosage?: string;
}

export interface NutrientAnalysis {
  status?: string;
  ai_source?: string;
  crop?: string;
  disease?: string;
  nutrients_lacking?: NutrientDeficiencyItem[];
  nutrient_recovery_plan?: string;
  soil_advice?: string;
  ai_pesticide_advice?: {
    chemical_spray?: string;
    organic_spray?: string;
    spray_timing?: string;
  };
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
  cause?: string;
  cure?: string;
  raw_name?: string;
  pesticide_advisory?: PesticideAdvisory;
  nutrient_analysis?: NutrientAnalysis;
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
  severity?: string;
  class_id?: number;
}

export interface PestAnalysisResponse {
  scan_id: string;
  detected_pests: PestDetectionItem[];
  pest_count?: number;
  overall_severity: string;
  economic_threshold_status?: string;
  recommended_control: string[];
  ipm_recommendations?: {
    biological?: string[];
    cultural_mechanical?: string[];
    chemical?: string[];
  };
  annotated_image_url?: string;
  mode: string;
  label_notice: string;
  processing_time_ms?: number;
}

export interface NutrientDetailItem {
  code: string;
  name: string;
  status: string;
  deficit_pct: number;
  current_level: number;
  target_level: number;
  unit: string;
  symptoms?: string;
  prescription?: string;
  foliar_spray?: string;
  organic_alternative?: string;
}

export interface NutrientAnalysisResponse {
  field_id: string;
  likely_deficiency: string;
  confidence_pct: number;
  health_score?: number;
  deficiency_breakdown: Record<string, number>;
  nutrients_detail?: NutrientDetailItem[];
  ph_bioavailability_impact?: string;
  supporting_evidence: string[];
  recommended_fertilizer_advisory: string[];
  fertilizer_recipe?: {
    primary_chemical?: string;
    primary_foliar?: string;
    organic_bio?: string;
    secondary_foliar?: string;
  };
  recommended_soil_test: string;
  annotated_heatmap_url?: string;
  original_image_url?: string;
  image_cv_analysis?: {
    yellow_chlorosis_pct: number;
    brown_necrotic_pct: number;
    green_canopy_pct: number;
    likely_visual_deficiency: string;
    annotated_heatmap_url?: string;
    processing_time_ms?: number;
  };
  mode: string;
  notice: string;
  processing_time_ms?: number;
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
  latest_live_feed?: LiveFeedRecord;
  live_feed_stats?: LiveFeedStats;
  telemetry_history?: Array<{ time: string; moisture: number; temperature: number; tank: number }>;
}

export interface ModelStatusItem {
  model_key: string;
  architecture: string;
  provider: string;
  status: string;
  mode: string;
}

export interface LiveFeedPestAnalysis {
  is_pest_detected: boolean;
  pest_count: number;
  overall_severity: string;
  economic_threshold_status: string;
  detected_pests: PestDetectionItem[];
  ipm_recommendations: {
    biological?: string[];
    cultural_mechanical?: string[];
    chemical?: string[];
  };
  recommended_control: string[];
  annotated_image_url?: string;
  processing_time_ms?: number;
}

// Live Image Feed & Google Drive Pipeline
export interface LiveFeedRecord {
  id: string;
  file_id: string;
  filename: string;
  image_url: string;
  timestamp: string;
  crop: string;
  disease_name: string;
  raw_name?: string;
  confidence: number;
  severity: string;
  is_healthy: boolean;
  cause?: string;
  cure?: string;
  pesticide_advisory?: PesticideAdvisory;
  nutrient_analysis?: NutrientAnalysis;
  top_predictions?: PredictionItem[];
  pest_analysis?: LiveFeedPestAnalysis;
}

export interface DiseaseHistogramItem {
  disease: string;
  count: number;
  is_healthy: boolean;
}

export interface SeverityBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface TimelineItem {
  time: string;
  confidence: number;
  disease: string;
  crop: string;
  is_healthy: number;
}

export interface CropDistributionItem {
  crop: string;
  count: number;
}

export interface LiveFeedStats {
  total_scanned: number;
  healthy_count: number;
  diseased_count: number;
  spray_recommended_count: number;
  healthy_rate_pct: number;
  avg_confidence: number;
  disease_histogram: DiseaseHistogramItem[];
  severity_breakdown: SeverityBreakdownItem[];
  timeline: TimelineItem[];
  crop_distribution: CropDistributionItem[];
}

export interface LiveFeedStatus {
  is_connected: boolean;
  is_polling_active: boolean;
  poll_interval_seconds: number;
  target_folder_name: string;
  target_folder_id?: string;
  account_email?: string;
  total_processed: number;
  last_poll_time?: string;
  last_error?: string;
  is_rover_stuck?: boolean;
  stuck_frame_count?: number;
  stuck_location?: string;
  stuck_alert_message?: string;
}
