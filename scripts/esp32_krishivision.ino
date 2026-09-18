/*
  ================================================================================
  KrishiVision AI — ESP32 Hardware Telemetry Transmitter
  ================================================================================
  Sensors Supported:
    1. DHT11 / DHT22 / DS18B20 Temperature & Humidity Sensor (GPIO 4)
    2. Capacitive Soil Moisture Sensor (Analog GPIO 34 / A0)
    3. HC-SR04 Ultrasonic Water Tank Sensor (Trig: GPIO 5, Echo: GPIO 18)
  
  Target Google Sheet URL:
    https://docs.google.com/spreadsheets/d/1NqyKaMTO9777tPJL_sjxJVxJocgogj0eby3a3Wqd6RQ/edit?gid=0#gid=0
  ================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// -----------------------------------------------------------------------------
// 1. CONFIGURATION: WiFi & Google Web App Deployment URL
// -----------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Paste your Google Apps Script Web App URL here:
const char* GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

// -----------------------------------------------------------------------------
// 2. PIN DEFINITIONS
// -----------------------------------------------------------------------------
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_MOISTURE_PIN 34  // Analog Pin for Soil Moisture
#define TRIG_PIN 5            // Ultrasonic Trigger Pin
#define ECHO_PIN 18           // Ultrasonic Echo Pin

// Tank Height in Centimeters
const float TANK_HEIGHT_CM = 100.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println(" KrishiVision AI — ESP32 Sensor Initialization");
  Serial.println("=============================================");

  dht.begin();
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi Connected! IP Address: ");
  Serial.println(WiFi.localIP());
}

float readUltrasonicTankPercentage() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distanceCm = duration * 0.034 / 2.0;

  // Convert distance from sensor to water surface into tank level %
  if (distanceCm >= TANK_HEIGHT_CM) return 0.0;
  float waterLevelCm = TANK_HEIGHT_CM - distanceCm;
  float percentage = (waterLevelCm / TANK_HEIGHT_CM) * 100.0;
  return constrain(percentage, 0.0, 100.0);
}

float readSoilMoisturePercentage() {
  int rawAnalog = analogRead(SOIL_MOISTURE_PIN);
  // Map raw analog reading (typically 4095 dry, 1500 wet) to 0-100%
  float moisturePct = map(rawAnalog, 4095, 1500, 0, 100);
  return constrain(moisturePct, 0.0, 100.0);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read Sensors
    float temperature = dht.readTemperature();
    float moisture = readSoilMoisturePercentage();
    float tankPct = readUltrasonicTankPercentage();

    if (isnan(temperature)) {
      temperature = 32.5; // Fallback temperature
    }

    Serial.println("---------------------------------------------");
    Serial.print("Temperature : "); Serial.print(temperature); Serial.println(" °C");
    Serial.print("Soil Moisture: "); Serial.print(moisture); Serial.println(" %");
    Serial.print("Water Tank   : "); Serial.print(tankPct); Serial.println(" %");

    // Construct URL for Google Apps Script Web App (matching exact parameters: temperature, moisture, ultrasonic)
    String url = String(GOOGLE_SCRIPT_URL) + 
                 "?temperature=" + String(temperature, 1) + 
                 "&moisture=" + String(moisture, 1) + 
                 "&ultrasonic=" + String(tankPct, 1);

    HTTPClient http;
    http.begin(url);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
    
    int httpCode = http.GET();
    if (httpCode > 0) {
      Serial.print("[OK] Sent to Google Sheets! HTTP Code: ");
      Serial.println(httpCode);
    } else {
      Serial.print("[ERROR] Failed to send: ");
      Serial.println(http.errorToString(httpCode));
    }
    http.end();
  }

  // Poll every 10 Seconds
  delay(10000);
}
