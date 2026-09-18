#!/usr/bin/env python3
"""
KrishiVision AI — ESP32 & Google Sheets Live Telemetry Integration Guide

Why your Google Sheet is currently blank on rows 2+:
--------------------------------------------------
Google Sheets acts as a cloud database buffer. The Google Sheet stores rows sent to it by:
  1. An ESP32 / Arduino Microcontroller with WiFi
  2. A Google Apps Script Webhook
  3. Manual row entry in Google Sheets

When rows 2+ are empty, KrishiVision AI automatically provides live baseline telemetry
(Temperature: 32.5°C | Soil Moisture: 28% | Water Tank: 70%) so your UI is never blank.

As soon as rows are added to the Google Sheet, KrishiVision AI's background worker
(scripts/gsheets_live_sync.py) reads the newest row every 5-10 seconds and updates the main UI!
"""

import urllib.request
import csv
import io

SPREADSHEET_ID = "1NqyKaMTO9777tPJL_sjxJVxJocgogj0eby3a3Wqd6RQ"
CSV_URL = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid=0"

def inspect_google_sheet():
    print(f"Checking Google Sheet ID: {SPREADSHEET_ID}")
    try:
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            rows = list(csv.reader(io.StringIO(content)))
            print(f"Total Rows in Sheet: {len(rows)}")
            for i, r in enumerate(rows):
                print(f"  Row {i+1}: {r}")
            if len(rows) <= 1:
                print("\n[NOTE] Row 2+ is currently empty in the Google Sheet.")
                print("To add data live into Google Sheets, follow the 3 options provided in KrishiVision AI.")
    except Exception as e:
        print(f"Error checking Google Sheet: {e}")

if __name__ == "__main__":
    inspect_google_sheet()
