import os
import sys
import httpx

def main():
    print("=" * 60)
    print("  KrishiVision AI — Automated E2E System Smoke Test")
    print("=" * 60)

    base_url = "http://localhost:8000/api"
    passed = 0
    total = 8

    client = httpx.Client(timeout=10.0)

    # Test 1: Backend Health
    try:
        r = client.get(f"{base_url}/health")
        if r.status_code == 200:
            print("[1/8] Backend Health: PASS")
            passed += 1
        else:
            print(f"[1/8] Backend Health: FAIL ({r.status_code})")
    except Exception as e:
        print(f"[1/8] Backend Health: FAIL ({e})")

    # Test 2: System Mode
    try:
        r = client.get(f"{base_url}/system/mode")
        if r.status_code == 200:
            print("[2/8] System Mode: PASS")
            passed += 1
        else:
            print(f"[2/8] System Mode: FAIL ({r.status_code})")
    except Exception as e:
        print(f"[2/8] System Mode: FAIL ({e})")

    # Test 3: Models Status
    try:
        r = client.get(f"{base_url}/models/status")
        if r.status_code == 200:
            print("[3/8] Models Status: PASS")
            passed += 1
        else:
            print(f"[3/8] Models Status: FAIL ({r.status_code})")
    except Exception as e:
        print(f"[3/8] Models Status: FAIL ({e})")

    # Test 4: Dashboard Overview
    try:
        r = client.get(f"{base_url}/dashboard/farm-indore-001")
        if r.status_code == 200 and "health_score" in r.json():
            print("[4/8] Dashboard API: PASS")
            passed += 1
        else:
            print(f"[4/8] Dashboard API: FAIL")
    except Exception as e:
        print(f"[4/8] Dashboard API: FAIL ({e})")

    # Test 5: Irrigation Engine
    try:
        r = client.post(f"{base_url}/irrigation/analyze", json={"farm_id": "farm-indore-001", "soil_moisture_pct": 22.0})
        if r.status_code == 200 and "irrigate_required" in r.json():
            print("[5/8] Smart Irrigation Engine: PASS")
            passed += 1
        else:
            print(f"[5/8] Smart Irrigation Engine: FAIL")
    except Exception as e:
        print(f"[5/8] Smart Irrigation Engine: FAIL ({e})")

    # Test 6: Risk Assessment Engine
    try:
        r = client.get(f"{base_url}/risk/farm-indore-001")
        if r.status_code == 200 and "overall_farm_risk_level" in r.json():
            print("[6/8] Agricultural Risk Engine: PASS")
            passed += 1
        else:
            print(f"[6/8] Agricultural Risk Engine: FAIL")
    except Exception as e:
        print(f"[6/8] Agricultural Risk Engine: FAIL ({e})")

    # Test 7: Weather Intelligence
    try:
        r = client.get(f"{base_url}/weather/current")
        if r.status_code == 200 and "temperature_c" in r.json():
            print("[7/8] Weather Intelligence: PASS")
            passed += 1
        else:
            print(f"[7/8] Weather Intelligence: FAIL")
    except Exception as e:
        print(f"[7/8] Weather Intelligence: FAIL ({e})")

    # Test 8: Report Generation
    try:
        r = client.post(f"{base_url}/reports?farm_id=farm-indore-001")
        if r.status_code == 200 and "download_url" in r.json():
            print("[8/8] PDF Report Generation: PASS")
            passed += 1
        else:
            print(f"[8/8] PDF Report Generation: FAIL")
    except Exception as e:
        print(f"[8/8] PDF Report Generation: FAIL ({e})")

    print("\n" + "=" * 60)
    print(f" Smoke Test Result: {passed}/{total} Passed")
    print("=" * 60)

    if passed < total:
        sys.exit(1)

if __name__ == "__main__":
    main()
