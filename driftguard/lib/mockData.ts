import type {
  Part, Lot, OverrideEntry, ParameterReadings, DerivedFeatures,
  ModuleAScores, ModuleBScores, ShapAttribution, TimeSeriesPoint,
} from "./types";

// ── Seeded PRNG (mulberry32) for deterministic data ──
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function randNormal(mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function randLogNormal(mu: number, sigma: number): number {
  return Math.exp(randNormal(mu, sigma));
}

function clampMin(v: number, min: number): number {
  return Math.max(v, min);
}

// ── Constants ──
const TIMESTAMPS = [0, 24, 96, 168];
const LOT_CONFIGS = [
  { id: "L-0401", name: "Lot L-0401", date: "2026-08-12", partCount: 48 },
  { id: "L-0402", name: "Lot L-0402", date: "2026-08-19", partCount: 52 },
  { id: "L-0403", name: "Lot L-0403", date: "2026-08-26", partCount: 45 },
  { id: "L-0404", name: "Lot L-0404", date: "2026-09-02", partCount: 55 },
  { id: "L-0405", name: "Lot L-0405", date: "2026-09-09", partCount: 50 },
];

const ANOMALY_RATE = 0.06;
const FEATURE_NAMES = [
  "leakage_96h", "early_slope", "mid_slope", "late_slope",
  "log_iddq_0h", "leakage_0h", "tpd_96h", "iddq_24h",
];

// ── Generate readings for one part ──
function generateReadings(isAnomaly: boolean, anomalyType: number): ParameterReadings {
  // Base Iddq: log-normal (physically grounded)
  const iddq0 = clampMin(randLogNormal(2.5, 0.15), 5);
  const leak0 = clampMin(randLogNormal(1.8, 0.12), 2);
  const tpd0 = clampMin(randNormal(12.0, 0.8), 8);

  // Drift exponent n̂
  let nIddq = randNormal(0.08, 0.02);
  let nLeak = randNormal(0.06, 0.015);
  let nTpd = randNormal(0.03, 0.01);

  if (isAnomaly) {
    if (anomalyType === 0) {
      // Type 1: Accelerated drift
      nIddq = randNormal(0.25, 0.05);
      nLeak = randNormal(0.20, 0.04);
    } else if (anomalyType === 1) {
      // Type 2: Non-monotonic jump at 96h (handled below)
      nIddq = randNormal(0.10, 0.02);
      nLeak = randNormal(0.08, 0.02);
    } else {
      // Type 3: Subtle multi-param drift
      nIddq = randNormal(0.16, 0.03);
      nLeak = randNormal(0.14, 0.03);
      nTpd = randNormal(0.10, 0.02);
    }
  }

  // Arrhenius drift: val(t) = val_0 * (max(t,1)/1)^n + noise
  const drift = (base: number, n: number, t: number) => {
    const raw = base * Math.pow(Math.max(t, 1), n);
    return clampMin(raw + randNormal(0, base * 0.005), base * 0.8);
  };

  let iddq_24 = drift(iddq0, nIddq, 24);
  let iddq_96 = drift(iddq0, nIddq, 96);
  let iddq_168 = drift(iddq0, nIddq, 168);

  let leak_24 = drift(leak0, nLeak, 24);
  let leak_96 = drift(leak0, nLeak, 96);
  let leak_168 = drift(leak0, nLeak, 168);

  let tpd_24 = drift(tpd0, nTpd, 24);
  let tpd_96 = drift(tpd0, nTpd, 96);
  let tpd_168 = drift(tpd0, nTpd, 168);

  // Anomaly type 2: inject spike at 96h
  if (isAnomaly && anomalyType === 1) {
    leak_96 *= 1 + randNormal(0.22, 0.05);
    iddq_96 *= 1 + randNormal(0.18, 0.04);
  }

  return {
    iddq_0h: +iddq0.toFixed(2), iddq_24h: +iddq_24.toFixed(2),
    iddq_96h: +iddq_96.toFixed(2), iddq_168h: +iddq_168.toFixed(2),
    leakage_0h: +leak0.toFixed(2), leakage_24h: +leak_24.toFixed(2),
    leakage_96h: +leak_96.toFixed(2), leakage_168h: +leak_168.toFixed(2),
    tpd_0h: +tpd0.toFixed(2), tpd_24h: +tpd_24.toFixed(2),
    tpd_96h: +tpd_96.toFixed(2), tpd_168h: +tpd_168.toFixed(2),
  };
}

// ── Compute derived features ──
function computeDerived(r: ParameterReadings): DerivedFeatures {
  return {
    early_slope: +(((r.leakage_24h - r.leakage_0h) / 24).toFixed(4)),
    mid_slope: +(((r.leakage_96h - r.leakage_24h) / 72).toFixed(4)),
    late_slope: +(((r.leakage_168h - r.leakage_96h) / 72).toFixed(4)),
    log_iddq_0h: +(Math.log(r.iddq_0h).toFixed(4)),
  };
}

// ── Compute physics baseline (Arrhenius extrapolation from 0h+24h) ──
function computePhysicsBaseline(r: ParameterReadings) {
  const delta = 0.1;
  const nHat = (Math.log(r.leakage_24h) - Math.log(r.leakage_0h + delta)) /
               (Math.log(24) - Math.log(delta));
  const predicted96 = r.leakage_0h * Math.pow(96 / Math.max(1, 1), nHat);
  const predicted168 = r.leakage_0h * Math.pow(168 / Math.max(1, 1), nHat);
  return { nHat, predicted96: +predicted96.toFixed(2), predicted168: +predicted168.toFixed(2) };
}

// ── Generate all parts for one lot ──
function generateLotParts(lotId: string, count: number): Part[] {
  const parts: Part[] = [];
  const anomalyCount = Math.round(count * ANOMALY_RATE) + (rng() > 0.5 ? 1 : 0);
  const anomalyIndices = new Set<number>();
  while (anomalyIndices.size < anomalyCount) {
    anomalyIndices.add(Math.floor(rng() * count));
  }

  const allReadings: ParameterReadings[] = [];
  const allDerived: DerivedFeatures[] = [];
  const isAnomalyArr: boolean[] = [];
  const anomalyTypes: number[] = [];

  // Generate raw readings
  for (let i = 0; i < count; i++) {
    const isAnomaly = anomalyIndices.has(i);
    const anomalyType = Math.floor(rng() * 3);
    isAnomalyArr.push(isAnomaly);
    anomalyTypes.push(anomalyType);
    const readings = generateReadings(isAnomaly, anomalyType);
    allReadings.push(readings);
    allDerived.push(computeDerived(readings));
  }

  // Compute lot-level stats for ECOD
  const featureVals: Record<string, number[]> = {};
  FEATURE_NAMES.forEach((f) => (featureVals[f] = []));
  allReadings.forEach((r, i) => {
    const d = allDerived[i];
    featureVals["leakage_96h"].push(r.leakage_96h);
    featureVals["early_slope"].push(d.early_slope);
    featureVals["mid_slope"].push(d.mid_slope);
    featureVals["late_slope"].push(d.late_slope);
    featureVals["log_iddq_0h"].push(d.log_iddq_0h);
    featureVals["leakage_0h"].push(r.leakage_0h);
    featureVals["tpd_96h"].push(r.tpd_96h);
    featureVals["iddq_24h"].push(r.iddq_24h);
  });

  // ECOD: empirical CDF → -log(min(F_left, F_right))
  function ecodScore(featureName: string, value: number): number {
    const sorted = [...featureVals[featureName]].sort((a, b) => a - b);
    const n = sorted.length;
    const rank = sorted.filter((v) => v <= value).length;
    const fLeft = Math.max(rank / n, 1 / (2 * n));
    const fRight = Math.max(1 - rank / n, 1 / (2 * n));
    return -Math.log(Math.min(fLeft, fRight));
  }

  // Lot slope stats for Module B
  const lotSlopes = allReadings.map((r) => (r.leakage_168h - r.leakage_24h) / 144);
  const lotMeanSlope = lotSlopes.reduce((a, b) => a + b, 0) / lotSlopes.length;
  const lotStdSlope = Math.sqrt(
    lotSlopes.reduce((a, b) => a + (b - lotMeanSlope) ** 2, 0) / lotSlopes.length
  );

  // Build each part
  const fusedScores: number[] = [];
  for (let i = 0; i < count; i++) {
    const r = allReadings[i];
    const d = allDerived[i];

    // ECOD per-feature
    const ecodPerFeature: Record<string, number> = {};
    let totalEcod = 0;
    FEATURE_NAMES.forEach((f) => {
      let val = 0;
      if (f === "leakage_96h") val = r.leakage_96h;
      else if (f === "early_slope") val = d.early_slope;
      else if (f === "mid_slope") val = d.mid_slope;
      else if (f === "late_slope") val = d.late_slope;
      else if (f === "log_iddq_0h") val = d.log_iddq_0h;
      else if (f === "leakage_0h") val = r.leakage_0h;
      else if (f === "tpd_96h") val = r.tpd_96h;
      else if (f === "iddq_24h") val = r.iddq_24h;
      const score = ecodScore(f, val);
      ecodPerFeature[f] = +score.toFixed(3);
      totalEcod += score;
    });

    // IF score: approximate
    const ifRaw = isAnomalyArr[i] ? 0.6 + rng() * 0.35 : rng() * 0.45;
    const ifScore = +ifRaw.toFixed(3);
    const ecodNorm = Math.min(totalEcod / 20, 1);
    const fusedScore = +(0.45 * ifScore + 0.55 * ecodNorm).toFixed(3);
    fusedScores.push(fusedScore);

    // Module B
    const physics = computePhysicsBaseline(r);
    const residual = +(r.leakage_168h - physics.predicted168).toFixed(2);
    const finalPred = +(physics.predicted168 + residual * 0.7).toFixed(2);
    const predSlope = +((finalPred - r.leakage_24h) / 144).toFixed(4);
    const slopeExceeds = predSlope >= lotMeanSlope + 2.0 * lotStdSlope;

    // SHAP: derive from ECOD per-feature + some noise
    const shapValues: ShapAttribution[] = Object.entries(ecodPerFeature)
      .map(([feature, val]) => ({
        feature,
        value: +((val - 1.5) * (0.8 + rng() * 0.4)).toFixed(3),
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);

    // Status
    let status: "normal" | "warning" | "anomaly" = "normal";
    if (fusedScore >= 0.75 || (slopeExceeds && fusedScore >= 0.5)) status = "anomaly";
    else if (fusedScore >= 0.45 || slopeExceeds) status = "warning";

    // Time series for physics curve
    const timeSeries: TimeSeriesPoint[] = [
      { t: "0h", actual: r.leakage_0h, predicted: r.leakage_0h },
      { t: "24h", actual: r.leakage_24h, predicted: +(r.leakage_0h * Math.pow(24, physics.nHat * 0.3)).toFixed(2) },
      { t: "96h", actual: r.leakage_96h, predicted: +(r.leakage_0h * Math.pow(96, physics.nHat * 0.3)).toFixed(2) },
      { t: "168h", actual: r.leakage_168h, predicted: physics.predicted168 },
    ];

    const partId = `${lotId.replace("L-", "")}-${String(i + 1).padStart(3, "0")}`;
    parts.push({
      id: partId,
      lotId,
      readings: r,
      derived: d,
      moduleA: {
        if_score: ifScore,
        ecod_score: +totalEcod.toFixed(2),
        fused_score: fusedScore,
        ecod_per_feature: ecodPerFeature,
      },
      moduleB: {
        physics_predicted_168h: physics.predicted168,
        xgb_residual: residual,
        final_predicted_168h: finalPred,
        predicted_slope: predSlope,
        lot_mean_slope: +lotMeanSlope.toFixed(4),
        lot_std_slope: +lotStdSlope.toFixed(4),
        slope_exceeds: slopeExceeds,
      },
      shapValues,
      status,
      lotPercentile: 0, // computed after all parts
      timeSeries,
    });
  }

  // Compute lot percentiles
  const sortedFused = [...fusedScores].sort((a, b) => a - b);
  parts.forEach((p) => {
    const rank = sortedFused.filter((s) => s <= p.moduleA.fused_score).length;
    p.lotPercentile = +((rank / count) * 100).toFixed(1);
  });

  return parts;
}

// ── Build all lots and parts ──
function buildData() {
  const allParts: Part[] = [];
  const lots: Lot[] = [];

  LOT_CONFIGS.forEach((cfg) => {
    const parts = generateLotParts(cfg.id, cfg.partCount);
    allParts.push(...parts);

    const flagged = parts.filter((p) => p.status === "anomaly").length;
    const warned = parts.filter((p) => p.status === "warning").length;
    const meanFused = +(parts.reduce((a, p) => a + p.moduleA.fused_score, 0) / parts.length).toFixed(3);
    const medianDrift = +(parts.map((p) => p.derived.late_slope)
      .sort((a, b) => a - b)[Math.floor(parts.length / 2)]).toFixed(4);

    const riskLevel: "low" | "medium" | "high" =
      flagged / cfg.partCount > 0.1 ? "high" : flagged / cfg.partCount > 0.04 ? "medium" : "low";

    const driftTrend = ["0h", "24h", "96h", "168h"].map((t) => {
      const key = `leakage_${t.replace("h", "")}h` as keyof ParameterReadings;
      const keyName = t === "0h" ? "leakage_0h" : t === "24h" ? "leakage_24h" : t === "96h" ? "leakage_96h" : "leakage_168h";
      const mean = parts.reduce((a, p) => a + (p.readings[keyName as keyof ParameterReadings] as number), 0) / parts.length;
      return { t, value: +mean.toFixed(2) };
    });

    lots.push({
      id: cfg.id,
      name: cfg.name,
      date: cfg.date,
      totalParts: cfg.partCount,
      flaggedCount: flagged,
      warningCount: warned,
      meanFusedScore: meanFused,
      medianDrift,
      riskLevel,
      driftTrend,
    });
  });

  return { lots, parts: allParts };
}

const { lots: LOTS, parts: ALL_PARTS } = buildData();

// ── Override log (pre-seeded) ──
const OVERRIDE_LOG: OverrideEntry[] = [
  { id: "ov-1", partId: "0401-012", lotId: "L-0401", action: "reject", operator: "Dr. Meera Krishnan", timestamp: "2026-08-14 09:22", reason: "Leakage spike at 96h confirmed via re-test — gate oxide degradation suspected" },
  { id: "ov-2", partId: "0401-034", lotId: "L-0401", action: "accept", operator: "Rajesh Iyer", timestamp: "2026-08-14 11:05", reason: "ECOD flag driven by tpd_96h outlier — tpd within spec on manual re-measure" },
  { id: "ov-3", partId: "0402-007", lotId: "L-0402", action: "reject", operator: "Dr. Meera Krishnan", timestamp: "2026-08-21 08:45", reason: "Multi-param drift (Type 3) — Iddq and leakage both trending up, early rejection" },
  { id: "ov-4", partId: "0402-041", lotId: "L-0402", action: "accept", operator: "Anil Sharma", timestamp: "2026-08-21 14:30", reason: "Borderline fused score (0.52) — physics curve stable, lot percentile 62nd — pass" },
  { id: "ov-5", partId: "0403-019", lotId: "L-0403", action: "reject", operator: "Priya Nair", timestamp: "2026-08-28 10:15", reason: "Slope exceeds 3σ lot threshold — predicted 168h value 42.1µA vs baseline 38.6µA" },
  { id: "ov-6", partId: "0404-023", lotId: "L-0404", action: "accept", operator: "Rajesh Iyer", timestamp: "2026-09-04 09:00", reason: "IF score high (0.68) but ECOD low (3.2) — isolated multivariate pattern, no single-param tail" },
  { id: "ov-7", partId: "0404-048", lotId: "L-0404", action: "reject", operator: "Dr. Meera Krishnan", timestamp: "2026-09-04 16:20", reason: "99.7th percentile in lot — leakage_96h contributed 8.2 of 11.4 total ECOD score" },
  { id: "ov-8", partId: "0405-015", lotId: "L-0405", action: "reject", operator: "Anil Sharma", timestamp: "2026-09-10 11:30", reason: "Non-monotonic jump at 96h checkpoint — classic latent defect activation signature" },
];

// ── Exports ──
export function getLots(): Lot[] { return LOTS; }
export function getLot(id: string): Lot | undefined { return LOTS.find((l) => l.id === id); }
export function getPartsForLot(lotId: string): Part[] { return ALL_PARTS.filter((p) => p.lotId === lotId); }
export function getAllParts(): Part[] { return ALL_PARTS; }
export function getFlaggedParts(): Part[] { return ALL_PARTS.filter((p) => p.status !== "normal"); }
export function getPart(id: string): Part | undefined { return ALL_PARTS.find((p) => p.id === id); }
export function getOverrideLog(): OverrideEntry[] { return OVERRIDE_LOG; }
export function getOverridesForPart(partId: string): OverrideEntry[] {
  return OVERRIDE_LOG.filter((o) => o.partId === partId);
}
