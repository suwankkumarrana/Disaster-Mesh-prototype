# DisasterMesh India (ଆପଦା ମେଶ୍ / आपदा मेश)
### Off-Grid Peer-to-Peer Emergency Communications & Relief Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![PWA: Offline First](https://img.shields.io/badge/PWA-Offline%20First-green.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Compliance: DPDP Act 2023](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-success.svg)](https://www.meity.gov.in/)
[![Payload: < 200 KB](https://img.shields.io/badge/Payload-163.5%20KB-brightgreen.svg)]()

> **When cell towers collapse and electrical grids go dark during severe cyclones, flash floods, and earthquakes, DisasterMesh keeps affected citizens, rescue agencies (NDRF/SDRF), and emergency relief shelters connected without relying on the internet or commercial cellular networks.**

---

## 🌟 Key Architecture & How It Works

```
[Affected Citizen Phone] (No SIM / No 4G)
       │  (Wi-Fi Direct / Local Ad-Hoc Hotspot)
       ▼
[DisasterMesh Edge Gateway] (Raspberry Pi / Laptop with server.py + SQLite)
       │
       ├── LoRa 865 MHz (WPC License-Free ISM Band) ──► [Neighboring Village Node (5-15 km)]
       │                                                         │
       ├── Browser BroadcastChannel & WebRTC Peer Relay         ├── [Relief Shelter Camp]
       │                                                         │
       └── Satellite / HAM Radio Terminal ──────────────────────► [NDRF / District Collectorate]
```

DisasterMesh operates as a **tri-hybrid platform**:
1. **Public Web Portal & Download Hub:** When cellular networks function or in preparatory stages before cyclone landfall.
2. **Offline Progressive Web App (PWA):** Installs directly to any phone screen, pre-caching shelters, emergency medical guides, and contacts into browser cache and **IndexedDB**.
3. **Edge Mesh Gateway:** Operates locally on zero-dependency Python 3 or microcontrollers, receiving SOS beacons, incrementing hop counts, and relaying emergency packets peer-to-peer.

---

## 🚀 Quick Start (Zero Dependencies)

The server is built with Python's standard library. No `node_modules` or `pip install` required!

```bash
# 1. Navigate to the project directory
cd disaster-mesh

# 2. Run automated test suite and payload audit
python test_suite.py

# 3. Start the Edge Gateway & Web Server
python server.py 8080
```

Open your browser to:
- **Local Access:** `http://localhost:8080`
- **Local Wi-Fi Network (Hotspot for Relayed Phones):** `http://<your-ip-address>:8080`
- **Standalone Offline Pocket Handbook:** `http://localhost:8080/offline_handbook.html`

---

## 📱 Modules & Features

### 1. Home Hub & Visual Topology
- Real-time status ticker with official disaster updates.
- Visual **"How Disaster Mesh Works"** workflow diagram explaining multi-hop packet relaying.
- Live disaster KPIs: Active Official Alerts, Urgent SOS Dispatches, Available Shelter Capacity, Relayed Mesh Packets, and Active Radio Nodes.

### 2. Emergency SOS Rescue Form
- **Works 100% Offline:** Submissions without internet are queued in browser `IndexedDB` and immediately broadcasted to peers across the local `BroadcastChannel`.
- **GPS Integration:** One-click exact coordinates capture with satellite accuracy indicator.
- **Triage Level:** Critical / Life-Threatening (Immediate), High (3-6 Hours), Moderate (24 Hours).
- **Needs Checklist:** Rescue boat required, infant baby food, senior citizen insulin/meds, potable water pouches.
- **Emergency QR Packet Generator:** Generates an ASCII/QR packet matrix that can be scanned by rescue boat tablets or drones with zero data signal.

### 3. Missing & Found Persons Registry
- Search by name, village, or cyclone shelter with instant debounced filtering.
- **India DPDP Act 2023 Compliant:** Phone numbers are masked (`+91 98*** **321`) to protect citizens from scams and identity theft during disasters.
- Report missing family members or register rescued children/seniors in shelters.

### 4. Interactive Shelters, Hospitals & Water Points Locator
- **Dual-Mode Visualization:**
  - *Broadband Mode:* Interactive **Leaflet Map** with color-coded pins (Blue: Cyclone Shelters, Red: Trauma Centers, Green: Water Points, Orange: Solar LoRa Relays).
  - *Low-Bandwidth Mode:* High-density structured card list with live capacity progress bars, solar power flags, and click-to-call helplines.

### 5. Live Official Disaster Alerts & Audio Siren
- Multi-source badges: **IMD** (Cyclone Warning), **OSDMA** (State Disaster Authority), **NDMA** (National Deployment).
- Color-coded severity: RED, AMBER, and YELLOW alerts.
- **Web Audio Siren & Voice Broadcast:** Dual-tone frequency synthesizer and speech synthesis announcing evacuation warnings.
- **SMS Fallback Simulator:** Text codes for basic 2G feature phones.

### 6. Hardware Setup & Offline Guides
- **LoRa 865 MHz Configuration:** Compliant with India WPC license-free band (865.2 MHz, Bandwidth 250 kHz, SF11).
- ESP32 to SX1262 SPI wiring pinout diagram.
- Printable single-file pocket survival manual (`offline_handbook.html`) covering water chlorination (2 drops bleach per liter), snakebite triage, and cyclone eyewall protocol.

### 7. Volunteers & Donors Registry
- Registration for specialized roles: Motorized boat rescue, Paramedics, HAM radio operators, Food logistics, Shelter marshals.
- Blood donor registry with instant blood group availability.
- Equipment pledges (generators, inflatable dinghies, solar chargers).

### 8. Web Interface to Mesh Node
- Live telemetry from local radio: Node ID, RSSI (-72 dBm), SNR (9.2 dB), battery percentage.
- Real-time packet relay stream showing hop count and origin node.
- Interactive mesh packet injector for field testing.

### 9. Responders & District Disaster Admin Console
- Protected by PIN (`1078` or `disaster2026`).
- Real-time incident dispatch table: assign teams (NDRF Team 04, ODRAF Unit 2) and update status (`Pending` ➔ `Dispatched` ➔ `Resolved`).
- Broadcast new official alerts directly to the regional mesh.
- **One-Click Data Export:**
  - `CSV Export` for District Collectorate relief records.
  - `GeoJSON Export` for QGIS / ArcGIS emergency mapping.

### 10. Multilingual Engine (i18n)
Full runtime switching between:
- **English**
- **ଓଡ଼ିଆ (Odia)**
- **हिन्दी (Hindi)**
Culturally and technically verified disaster terminology across all headers, buttons, forms, and instructions.

---

## ⚡ Non-Functional Specifications

| Requirement | Specification | Implementation in DisasterMesh |
|-------------|---------------|--------------------------------|
| **Payload Size** | < 200 KB total bundle | **163.5 KB total** (audited in `test_suite.py`) |
| **Text-Only Mode** | Dedicated ultra-low-bandwidth UI | Single-click toggle loads `< 4 KB` stripped stylesheet |
| **Offline-First** | Complete offline survivability | Service Worker (`sw.js`) + IndexedDB (`db.js`) |
| **Accessibility** | WCAG 2.1 AA | $\ge 48$px touch targets, dark mode battery saver, high contrast toggle |
| **Privacy Law** | India DPDP Act 2023 | Phone masking, Section 7 emergency exemption consent modal |
| **High Availability** | Edge survivable | Runs locally on any laptop or Raspberry Pi with SQLite |

---

## 👥 Multi-Disciplinary Team Roles & Standard Operating Procedures (SOP)

1. **Frontend Developer:**
   - Maintains sub-200 KB asset budget.
   - Audits Service Worker lifecycle and IndexedDB background sync.
   - Tests font rendering for Odia (ଓଡ଼ିଆ) and Hindi glyphs under low-resource mobile browsers.
2. **Backend Developer:**
   - Manages zero-dependency Python edge server and SQLite schema.
   - Validates sanitization, rate-limiting, and DPDP Act phone hashing.
   - Maintains CSV and GeoJSON endpoints for district emergency centers.
3. **UI/UX Designer:**
   - Ensures all interactive controls exceed 48px tap targets for rain-slicked screens.
   - Maintains WCAG 2.1 AA contrast ratios ($> 4.5:1$).
   - Designs intuitive, non-text iconography for illiterate or panic-stricken victims.
4. **Mesh / Radio Engineer:**
   - Tunes LoRa antenna arrays (865 MHz ISM band, max 20 dBm EIRP per India WPC).
   - Deploys relay nodes on high-mast shelters and panchayat buildings.
   - Establishes packet forwarding links between field boats and gateway nodes.
5. **Disaster Management Advisor:**
   - Aligns alert templates with IMD Cyclone Warning bulletins and OSDMA color codes.
   - Defines medical triage algorithms (immediate boat rescue vs general ration drop).
   - Coordinates drill exercises with district administration and NDRF battalions.

---

## 🧪 Testing & Field Drill Simulation

The application features a built-in **Field Drill Panel** allowing teams to test response procedures:
1. **Normal (Broadband/4G):** Baseline cloud connected state.
2. **Degraded 2G Network:** Simulates 30 kbps bandwidth and 1500ms latency, proving text-only mode resilience.
3. **Total Cellular Outage:** Simulates cell tower collapse, validating that SOS forms queue locally in IndexedDB and relay over peer mesh radios.

Run automated unit and integration tests:
```bash
python test_suite.py
```

---

## 🛡️ Legal & Privacy Compliance (India DPDP Act 2023)

In accordance with the **Digital Personal Data Protection Act, 2023 (DPDP Act)**:
- Personal telephone numbers are masked (`+91 98*** **321`) on all public registries.
- Emergency rescue requests are processed under the lawful basis of **Section 7 (Emergency medical and disaster response exemptions)**.
- Data retention is limited to the active relief and restoration window, after which records are archived and anonymized.

---

## 📜 License & Acknowledgments

- **License:** Open Source under the MIT License.
- **Official Data Guidelines:** Inspired by protocols of the **National Disaster Management Authority (NDMA)**, **Odisha State Disaster Management Authority (OSDMA)**, and the **India Meteorological Department (IMD)**.
