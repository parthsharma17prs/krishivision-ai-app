import os
import sys
import time
import json
import argparse
from typing import Dict, Any, List
import numpy as np
import onnxruntime as ort

# Add root directory to sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from edge.app.inference.disease import OnnxDiseaseClassifier
from edge.app.config.settings import edge_settings

def run_benchmark(
    model_path: str,
    iterations: int = 50,
    warmup: int = 10,
    batch_size: int = 1
) -> Dict[str, Any]:
    print("=" * 65)
    print("  KRISHIVISION AI — EDGE INFERENCE HARDWARE BENCHMARK")
    print("=" * 65)
    print(f"Model Path     : {model_path}")
    print(f"Iterations     : {iterations} runs (Warmup: {warmup})")
    print(f"Providers Avail: {ort.get_available_providers()}")

    classifier = OnnxDiseaseClassifier(model_path=model_path)
    if not classifier.is_loaded:
        raise RuntimeError(f"Failed to load model: {classifier.load_error}")

    print(f"Active Provider: {classifier.execution_provider}")
    print(f"Input Shape    : (1, 3, 224, 224) float32")
    print("-" * 65)

    # Generate synthetic input image (480, 640, 3) BGR
    test_frame = np.random.randint(0, 256, (480, 640, 3), dtype=np.uint8)

    # 1. Warmup
    print("Executing warmup cycles...")
    for _ in range(warmup):
        classifier.infer(test_frame)

    # 2. Timed Benchmark
    print("Running timed inference iterations...")
    latencies: List[float] = []

    for i in range(iterations):
        t0 = time.perf_counter()
        classifier.infer(test_frame)
        dt = (time.perf_counter() - t0) * 1000.0
        latencies.append(dt)

    lat_arr = np.array(latencies)
    p50 = float(np.percentile(lat_arr, 50))
    p90 = float(np.percentile(lat_arr, 90))
    p95 = float(np.percentile(lat_arr, 95))
    p99 = float(np.percentile(lat_arr, 99))
    mean_lat = float(np.mean(lat_arr))
    min_lat = float(np.min(lat_arr))
    max_lat = float(np.max(lat_arr))
    std_lat = float(np.std(lat_arr))
    throughput_fps = round(1000.0 / mean_lat, 2)

    results = {
        "model_path": model_path,
        "model_name": classifier.name,
        "execution_provider": classifier.execution_provider,
        "iterations": iterations,
        "warmup": warmup,
        "batch_size": batch_size,
        "latency_ms": {
            "mean": round(mean_lat, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "p95": round(p95, 2),
            "p99": round(p99, 2),
            "min": round(min_lat, 2),
            "max": round(max_lat, 2),
            "std": round(std_lat, 2)
        },
        "throughput_fps": throughput_fps,
        "timestamp": time.time(),
        "hardware_platform": sys.platform
    }

    print("-" * 65)
    print(f"Mean Latency   : {results['latency_ms']['mean']} ms (± {results['latency_ms']['std']} ms)")
    print(f"P50 Latency    : {results['latency_ms']['p50']} ms")
    print(f"P95 Latency    : {results['latency_ms']['p95']} ms")
    print(f"Min / Max      : {results['latency_ms']['min']} ms / {results['latency_ms']['max']} ms")
    print(f"Throughput     : {throughput_fps} inferences/sec (FPS)")
    print("=" * 65)

    # Save benchmark report to disk
    out_path = os.path.join(ROOT_DIR, "edge", "benchmark_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Benchmark report saved to: {out_path}")

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KrishiVision Edge Inference Benchmark")
    parser.add_argument("--model", type=str, default=edge_settings.models.disease_model_path)
    parser.add_argument("--iterations", type=int, default=50)
    parser.add_argument("--warmup", type=int, default=10)
    args = parser.parse_args()

    run_benchmark(model_path=args.model, iterations=args.iterations, warmup=args.warmup)
