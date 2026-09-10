// ── Parameter readings (wide-format pivoted ESS data) ──
export interface ParameterReadings {
  iddq_0h: number; iddq_24h: number; iddq_96h: number; iddq_168h: number;
  leakage_0h: number; leakage_24h: number; leakage_96h: number; leakage_168h: number;
  tpd_0h: number; tpd_24h: number; tpd_96h: number; tpd_168h: number;
}

// ── Decorrelated features (Section 3) ──
export interface DerivedFeatures {
  early_slope: number;
  mid_slope: number;
  late_slope: number;
  log_iddq_0h: number;
}

// ── Module A scores (Section 4 — IF + ECOD fusion) ──
export interface ModuleAScores {
  if_score: number;
  ecod_score: number;
  fused_score: number;
  ecod_per_feature: Record<string, number>;
}

// ── Module B scores (Section 5 — Arrhenius + XGBoost) ──
export interface ModuleBScores {
  physics_predicted_168h: number;
  xgb_residual: number;
  final_predicted_168h: number;
  predicted_slope: number;
  lot_mean_slope: number;
  lot_std_slope: number;
  slope_exceeds: boolean;
}

// ── SHAP-like attribution (Section 6) ──
export interface ShapAttribution {
  feature: string;
  value: number;
}

// ── Time-series point for charts ──
export interface TimeSeriesPoint {
  t: string;
  actual: number;
  predicted: number;
}

// ── Full part record ──
export interface Part {
  id: string;
  lotId: string;
  readings: ParameterReadings;
  derived: DerivedFeatures;
  moduleA: ModuleAScores;
  moduleB: ModuleBScores;
  shapValues: ShapAttribution[];
  status: "normal" | "warning" | "anomaly";
  lotPercentile: number;
  timeSeries: TimeSeriesPoint[];
}

// ── Lot summary ──
export interface Lot {
  id: string;
  name: string;
  date: string;
  totalParts: number;
  flaggedCount: number;
  warningCount: number;
  meanFusedScore: number;
  medianDrift: number;
  riskLevel: "low" | "medium" | "high";
  driftTrend: { t: string; value: number }[];
}

// ── Override audit entry ──
export interface OverrideEntry {
  id: string;
  partId: string;
  lotId: string;
  action: "accept" | "reject";
  operator: string;
  timestamp: string;
  reason: string;
}
