"""
DriftGuard — FastAPI Backend Server

Endpoints:
  POST /run-pipeline  — Triggers live ML pipeline execution
  GET  /results       — Returns pre-computed results
  GET  /health        — Health check
"""

import json
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline import run_full_pipeline

app = FastAPI(
    title="DriftGuard ML Backend",
    description="AI-Driven Anomaly Detection in Component Burn-In & Screening",
    version="1.0.0",
)

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRECOMPUTED_PATH = Path(__file__).parent / "precomputed" / "results.json"


class PipelineRequest(BaseModel):
    seed: int = 42
    anomaly_rate: float = 0.06


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "driftguard-backend",
        "precomputed_available": PRECOMPUTED_PATH.exists(),
    }


@app.post("/run-pipeline")
async def run_pipeline(req: PipelineRequest = PipelineRequest()):
    """
    Execute the full ML pipeline: data generation → feature engineering →
    Module A (IF+ECOD) → Module B (Arrhenius+XGBoost) → SHAP.
    
    Returns the complete results including parts, lots, overrides, and metrics.
    """
    try:
        results = run_full_pipeline(
            seed=req.seed,
            anomaly_rate=req.anomaly_rate,
        )

        # Also save as precomputed for future GET /results calls
        PRECOMPUTED_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(PRECOMPUTED_PATH, "w") as f:
            json.dump(results, f)

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/results")
async def get_results():
    """
    Return pre-computed pipeline results for instant dashboard loading.
    Falls back to running the pipeline if no precomputed results exist.
    """
    if PRECOMPUTED_PATH.exists():
        with open(PRECOMPUTED_PATH) as f:
            return json.load(f)

    # No precomputed results — run the pipeline
    try:
        results = run_full_pipeline(seed=42)
        PRECOMPUTED_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(PRECOMPUTED_PATH, "w") as f:
            json.dump(results, f)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
