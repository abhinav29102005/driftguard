"""
DriftGuard - Hybrid Kaggle SECOM + Physics ESS Burn-In Data Generator

Uses the real UCI SECOM dataset (Kaggle) for initial base measurements (0h) and 
anomaly labels, and simulates parametric drift using Arrhenius models for 
subsequent ESS checkpoints (24h, 96h, 168h).
"""

import os
import numpy as np
import pandas as pd
import requests
from typing import Dict, List, Tuple

TIMESTAMPS = [0, 24, 96, 168]
PARAMS = ["iddq", "leakage", "tpd"]

# Lot configurations matching the frontend
LOT_CONFIGS = [
    {"id": "L-0401", "name": "Lot L-0401", "date": "2026-08-12", "part_count": 48},
    {"id": "L-0402", "name": "Lot L-0402", "date": "2026-08-19", "part_count": 52},
    {"id": "L-0403", "name": "Lot L-0403", "date": "2026-08-26", "part_count": 45},
    {"id": "L-0404", "name": "Lot L-0404", "date": "2026-09-02", "part_count": 55},
    {"id": "L-0405", "name": "Lot L-0405", "date": "2026-09-09", "part_count": 50},
]

ANOMALY_RATE = 0.06  # Target anomaly rate

# Cache file paths
CACHE_DATA = "secom.data"
CACHE_LABELS = "secom_labels.data"

def fetch_secom_data() -> Tuple[pd.DataFrame, pd.Series]:
    """Downloads or loads the cached UCI SECOM dataset."""
    url_data = 'https://archive.ics.uci.edu/ml/machine-learning-databases/secom/secom.data'
    url_labels = 'https://archive.ics.uci.edu/ml/machine-learning-databases/secom/secom_labels.data'
    
    if not os.path.exists(CACHE_DATA):
        print("Downloading UCI SECOM dataset...")
        with open(CACHE_DATA, 'w') as f:
            f.write(requests.get(url_data).text)
        with open(CACHE_LABELS, 'w') as f:
            f.write(requests.get(url_labels).text)

    data = pd.read_csv(CACHE_DATA, sep=' ', header=None)
    labels = pd.read_csv(CACHE_LABELS, sep=' ', header=None)
    # labels[0] has -1 for normal, 1 for anomaly
    return data, labels[0]

def _scale_feature(series: pd.Series, target_mean: float, target_std: float) -> pd.Series:
    """Scales a SECOM feature to a target mean and standard deviation."""
    s_mean = series.mean()
    s_std = series.std()
    return ((series - s_mean) / s_std) * target_std + target_mean

def get_secom_sample(total_parts: int, anomaly_rate: float, seed: int = 42) -> pd.DataFrame:
    """Samples parts from SECOM to match the required total parts and anomaly rate."""
    data, labels = fetch_secom_data()
    
    # Extract features (cols 88, 115, 117 are known to be dense and positive in SECOM)
    # We use these as our base starting values for iddq, leakage, tpd
    df = pd.DataFrame({
        'iddq_raw': data[88],
        'leakage_raw': data[115],
        'tpd_raw': data[117],
        'is_anomaly': labels == 1
    })

    # Scale the raw Kaggle features to match realistic ranges for our UI
    df['iddq_0h'] = _scale_feature(df['iddq_raw'], target_mean=8.0, target_std=2.0).clip(lower=0.1)
    df['leakage_0h'] = _scale_feature(df['leakage_raw'], target_mean=20.0, target_std=5.0).clip(lower=0.1)
    df['tpd_0h'] = _scale_feature(df['tpd_raw'], target_mean=13.5, target_std=1.0).clip(lower=0.1)
    
    # Split anomalies and normal
    anomalies = df[df['is_anomaly']]
    normals = df[~df['is_anomaly']]
    
    rng = np.random.default_rng(seed)
    
    n_anomalies = max(1, int(total_parts * anomaly_rate))
    n_normals = total_parts - n_anomalies
    
    sampled_anomalies = anomalies.sample(n=n_anomalies, replace=True, random_state=seed)
    sampled_normals = normals.sample(n=n_normals, replace=False, random_state=seed)
    
    return pd.concat([sampled_anomalies, sampled_normals]).sample(frac=1, random_state=seed).reset_index(drop=True)


def generate_all_lots(
    lot_configs: List[Dict] = None,
    anomaly_rate: float = ANOMALY_RATE,
    seed: int = 42,
) -> Tuple[pd.DataFrame, Dict[str, List[bool]]]:
    """
    Generate hybrid SECOM + Physics ESS data for all lots.
    """
    if lot_configs is None:
        lot_configs = LOT_CONFIGS

    rng = np.random.default_rng(seed)
    total_parts = sum(c["part_count"] for c in lot_configs)
    
    # 1. Fetch real 0h data and labels from Kaggle SECOM
    secom_df = get_secom_sample(total_parts, anomaly_rate, seed)
    
    all_dfs = []
    anomaly_map = {}
    current_idx = 0
    
    for cfg in lot_configs:
        n_parts = cfg["part_count"]
        lot_id = cfg["id"]
        
        # Get the slice of SECOM parts for this lot
        lot_secom = secom_df.iloc[current_idx : current_idx + n_parts].copy()
        current_idx += n_parts
        
        is_anomaly = lot_secom['is_anomaly'].tolist()
        anomaly_map[lot_id] = is_anomaly
        
        records = []
        for i in range(n_parts):
            row_data = lot_secom.iloc[i]
            part_id = f"{lot_id.replace('L-', '')}-{str(i+1).zfill(3)}"
            anom = row_data['is_anomaly']
            anom_type = rng.integers(0, 3) if anom else -1

            row = {"part_id": part_id, "lot_id": lot_id, "is_anomaly": anom}
            
            # 2. Base 0h values from SECOM
            iddq_0 = row_data['iddq_0h']
            leak_0 = row_data['leakage_0h']
            tpd_0 = row_data['tpd_0h']
            
            row["iddq_0h"] = round(iddq_0, 4)
            row["leakage_0h"] = round(leak_0, 4)
            row["tpd_0h"] = round(tpd_0, 4)
            
            # 3. Simulate physics drift for 24h, 96h, 168h
            
            # Iddq drift
            drift_rate_iddq = rng.uniform(0.001, 0.003)
            if anom and anom_type in (0, 2):
                drift_rate_iddq *= rng.uniform(3.0, 8.0)
                
            for t in [24, 96, 168]:
                val = iddq_0 * np.exp(drift_rate_iddq * t)
                val += rng.normal(0, 0.05)
                if anom and anom_type == 1 and t == 96:
                    val *= rng.uniform(1.3, 1.8)
                row[f"iddq_{t}h"] = max(0.01, round(val, 4))
                
            # Leakage Arrhenius drift
            n_hat = rng.uniform(0.02, 0.06)
            if anom and anom_type in (0, 2):
                n_hat *= rng.uniform(2.5, 6.0)
                
            for t in [24, 96, 168]:
                val = leak_0 * (1.0 + n_hat * np.log(1.0 + t))
                val += rng.normal(0, 0.1)
                if anom and anom_type == 1 and t == 96:
                    val *= rng.uniform(1.4, 2.0)
                row[f"leakage_{t}h"] = max(0.01, round(val, 4))
                
            # Tpd drift
            drift_rate_tpd = rng.uniform(0.0005, 0.002)
            if anom and anom_type == 2:
                drift_rate_tpd *= rng.uniform(3.0, 7.0)
                
            for t in [24, 96, 168]:
                val = tpd_0 * (1.0 + drift_rate_tpd * t)
                val += rng.normal(0, 0.08)
                if anom and anom_type == 1 and t == 96:
                    val *= rng.uniform(1.1, 1.3)
                row[f"tpd_{t}h"] = max(0.1, round(val, 4))

            records.append(row)

        all_dfs.append(pd.DataFrame(records))

    combined = pd.concat(all_dfs, ignore_index=True)
    return combined, anomaly_map


if __name__ == "__main__":
    print("Generating hybrid Kaggle SECOM + Physics dataset...")
    df, anomaly_map = generate_all_lots()
    total = len(df)
    total_anom = df["is_anomaly"].sum()
    print(f"Generated {total} parts across {len(LOT_CONFIGS)} lots")
    print(f"Injected anomalies: {total_anom} ({100*total_anom/total:.1f}%)")
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nSample (first 3 rows):")
    print(df.head(3).to_string(index=False))
