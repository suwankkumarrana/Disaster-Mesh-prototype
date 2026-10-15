"""
DisasterMesh Database Engine
Local SQLite database storing emergency alerts, SOS requests,
shelter/resource registry, missing persons, and volunteer records.
Zero external dependencies, robust and safe for field edge-nodes.
"""

import sqlite3
import os
import json
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "disaster_mesh.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # 1. Alerts Table (IMD, NDMA, OSDMA)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,           -- IMD, OSDMA, NDMA, CWC, LOCAL_DISTRICT
        level TEXT NOT NULL,            -- RED, AMBER, YELLOW, GREEN
        title_en TEXT NOT NULL,
        title_or TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        desc_en TEXT NOT NULL,
        desc_or TEXT NOT NULL,
        desc_hi TEXT NOT NULL,
        affected_areas TEXT NOT NULL,   -- e.g. Puri, Jagatsinghpur, Kendrapara
        action_required TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        is_active INTEGER DEFAULT 1
    )
    """)

    # 2. SOS / Help Requests Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sos_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        people_count INTEGER DEFAULT 1,
        status TEXT NOT NULL,           -- trapped, medical, food_water, safe_checkin
        triage TEXT NOT NULL,           -- urgent, high, moderate
        latitude REAL,
        longitude REAL,
        landmark TEXT NOT NULL,
        district TEXT NOT NULL,
        needs_list TEXT,                -- JSON string: ["boat", "infant_food", "medicines"]
        mesh_hops INTEGER DEFAULT 0,
        mesh_node_origin TEXT,
        verification_status TEXT DEFAULT 'unverified', -- unverified, verified, dispatched, resolved
        assigned_team TEXT,             -- e.g. NDRF Team 04
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    )
    """)

    # 3. Missing and Found Persons Table (DPDP Act compliant)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS persons_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,             -- missing, found_safe
        full_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,                    -- Male, Female, Other
        last_seen_location TEXT NOT NULL,
        current_shelter TEXT,
        contact_name TEXT,
        contact_phone_masked TEXT,      -- +91 98*** **123 for privacy
        contact_phone_hash TEXT,        -- Hash for lookup without exposing
        identifying_features TEXT,
        status TEXT DEFAULT 'active',   -- active, reunited, closed
        created_at INTEGER NOT NULL
    )
    """)

    # 4. Resources and Shelters Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,             -- shelter, hospital, water_food, charging_mesh
        name_en TEXT NOT NULL,
        name_or TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        district TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        capacity INTEGER DEFAULT 0,
        current_occupancy INTEGER DEFAULT 0,
        status TEXT DEFAULT 'operational', -- operational, full, submerged, accessible
        supplies_available TEXT,        -- JSON string of supplies
        helpline TEXT,
        address TEXT,
        has_generator INTEGER DEFAULT 1,
        has_medical INTEGER DEFAULT 1,
        has_mesh_relay INTEGER DEFAULT 1
    )
    """)

    # 5. Volunteers and Donors Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_masked TEXT NOT NULL,
        district TEXT NOT NULL,
        role TEXT NOT NULL,             -- boat_rescue, medical, food_logistics, mesh_ham_radio, shelter_support
        equipment_pledged TEXT,         -- e.g. 1x Inflatable boat, 2x LoRa radios
        blood_group TEXT,
        status TEXT DEFAULT 'available',-- available, deployed, resting
        is_verified INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
    )
    """)

    # 6. Mesh Node Telemetry & Relayed Packets
    cur.execute("""
    CREATE TABLE IF NOT EXISTS mesh_packets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packet_id TEXT UNIQUE NOT NULL,
        packet_type TEXT NOT NULL,      -- SOS, ACK, TELEMETRY, BROADCAST
        source_node TEXT NOT NULL,
        destination_node TEXT NOT NULL, -- BROADCAST or specific Node ID
        hop_count INTEGER DEFAULT 0,
        rssi INTEGER DEFAULT -75,
        snr REAL DEFAULT 8.5,
        payload TEXT NOT NULL,          -- JSON serialized payload
        received_at INTEGER NOT NULL
    )
    """)

    conn.commit()
    seed_initial_data(conn)
    conn.close()

def seed_initial_data(conn):
    cur = conn.cursor()

    # Check if already seeded
    cur.execute("SELECT COUNT(*) FROM alerts")
    if cur.fetchone()[0] > 0:
        return  # already initialized

    now = int(time.time())

    # --- Seed Alerts ---
    alerts = [
        (
            "IMD", "RED",
            "Severe Cyclone Warning: Wind Gusts 110-120 kmph & Coastal Inundation",
            "ଭୟଙ୍କର ବାତ୍ୟା ଚେତାବନୀ: ପବନର ବେଗ ୧୧୦-୧୨୦ କି.ମି. ଏବଂ ଉପକୂଳ ଜଳମଗ୍ନ ସମ୍ଭାବନା",
            "भीषण चक्रवात चेतावनी: हवा की गति 110-120 किमी/घंटा और तटीय जलभराव की आशंका",
            "Deep Depression over Bay of Bengal intensified into Severe Cyclonic Storm. Landfall expected near Dhamra/Puri coast within 12 hours. Fishermen strictly warned not to venture into sea. Immediate evacuation to Multi-Purpose Cyclone Shelters underway.",
            "ବଙ୍ଗୋପସାଗରରେ ସୃଷ୍ଟ ଗଭୀର ଅବପାତ ଏକ ଭୟଙ୍କର ବାତ୍ୟାରେ ପରିଣତ ହୋଇଛି । ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ ଧାମରା/ପୁରୀ ନିକଟରେ ଲ୍ୟାଣ୍ଡଫଲ୍ ସମ୍ଭାବନା । ତୁରନ୍ତ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଯିବାକୁ ପରାମର୍ଶ ।",
            "बंगाल की खाड़ी में बना गहरा दबाव भीषण चक्रवाती तूफान में तब्दील हो गया है। 12 घंटों के भीतर धामरा/पुरी तट के पास भूस्खलन की संभावना। बहुउद्देशीय चक्रवात आश्रय स्थलों में जाने की सलाह।",
            "Puri, Jagatsinghpur, Kendrapara, Bhadrak, Balasore",
            "Move immediately to designated concrete cyclone shelters. Keep emergency mesh devices charged and battery packs safe in dry plastic bags.",
            now, now + 86400 * 2, 1
        ),
        (
            "OSDMA", "AMBER",
            "Mahanadi & Baitarani River Flash Flood Watch: Low-Lying Wards on Standby",
            "ମହାନଦୀ ଓ ବୈତରଣୀ ନଦୀରେ ବନ୍ୟା ସତର୍କତା: ତଳିଆ ଅଞ୍ଚଳରେ ଉଚ୍ଚ ସତର୍କତା",
            "महानदी और बैतरणी नदी में बाढ़ की चेतावनी: निचले इलाकों में हाई अलर्ट",
            "Heavy rainfall in upstream catchments. Water level rising near Mundali and Naraj. Sluice gates opened. Rescue boats pre-positioned at Kendrapara and Cuttack rural pockets.",
            "ଉପରମୁଣ୍ଡରେ ପ୍ରବଳ ବର୍ଷା ଯୋଗୁଁ ମହାନଦୀ ଓ ବୈତରଣୀ ଜଳସ୍ତର ବୃଦ୍ଧି ପାଉଛି । କଟକ ଓ କେନ୍ଦ୍ରାପଡ଼ା ଗ୍ରାମାଞ୍ଚଳରେ ଉଦ୍ଧାରକାରୀ ଡଙ୍ଗା ମୁତୟନ କରାଯାଇଛି ।",
            "उपरी जलग्रहण क्षेत्रों में भारी बारिश के कारण महानदी का जलस्तर बढ़ रहा है। कटक और केंद्रपड़ा के ग्रामीण इलाकों में बचाव नावें तैनात।",
            "Cuttack, Kendrapara, Jajpur, Puri rural",
            "Elevate drinking water tanks, store boiled water, prepare dry food packets and keep HAM/Mesh radios tuned to 865 MHz.",
            now - 3600 * 4, now + 86400 * 3, 1
        ),
        (
            "NDMA", "YELLOW",
            "National Disaster Response Deployment: 18 NDRF Battalions Mobilized",
            "ଜାତୀୟ ବିପର୍ଯ୍ୟୟ ପ୍ରଶମନ ବାହିନୀ (NDRF) ର ୧୮ ଟି ଟିମ୍ ମୁତୟନ",
            "राष्ट्रीय आपदा प्रतिक्रिया बल (NDRF) की 18 टीमें तैनात",
            "NDRF teams equipped with tree cutters, satellite comms, and medical first responders deployed across high-risk coastal districts.",
            "ଉଦ୍ଧାର କାର୍ଯ୍ୟ ପାଇଁ ସାଟେଲାଇଟ୍ ଯୋଗାଯୋଗ ଏବଂ ଚିକିତ୍ସା ସୁବିଧା ଥିବା NDRF ଟିମ୍ ମୁତୟନ ହୋଇଛନ୍ତି ।",
            "पेड़ काटने वाले उपकरण, सैटेलाइट संचार और प्राथमिक चिकित्सा से लैस एनडीआरएफ टीमें तैनात।",
            "Odisha Coastal Belt, West Bengal South 24 Parganas",
            "Do not spread unverified social media rumors. Rely strictly on verified DisasterMesh broadcasts and official radio channels.",
            now - 3600 * 8, now + 86400 * 4, 1
        )
    ]

    cur.executemany("""
    INSERT INTO alerts (
        source, level, title_en, title_or, title_hi,
        desc_en, desc_or, desc_hi, affected_areas, action_required,
        created_at, expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, alerts)

    # --- Seed Shelters & Resources ---
    resources = [
        (
            "shelter", "Puri Multi-Purpose Cyclone Shelter #12", "ପୁରୀ ବହୁମୁଖୀ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ #୧୨", "पुरी बहुउद्देशीय चक्रवात आश्रय स्थल #12",
            "Puri", 19.8135, 85.8312, 1200, 480, "operational",
            json.dumps(["Drinking Water (RO)", "Backup Solar Generator", "Community Kitchen", "VHF Radio Station"]),
            "06752-223344", "Near VIP Road, Sea Beach Police Station jurisdiction, Puri", 1, 1, 1
        ),
        (
            "shelter", "Ersama Disaster Relief Camp & Center", "ଏରସମା ବିପର୍ଯ୍ୟୟ ରିଲିଫ୍ କେନ୍ଦ୍ର", "एरसमा आपदा राहत केंद्र",
            "Jagatsinghpur", 20.1830, 86.4410, 850, 620, "operational",
            json.dumps(["Hot Cooked Meals", "First Aid Station", "Women & Infant Care Section", "Satellite Phone"]),
            "06722-245100", "Block Headquarter Ground, Ersama, Jagatsinghpur", 1, 1, 1
        ),
        (
            "hospital", "District Headquarters Hospital (DHH) & Trauma Center", "ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ (DHH)", "जिला मुख्यालय अस्पताल एवं ट्रॉमा सेंटर",
            "Kendrapara", 20.5020, 86.4230, 450, 310, "operational",
            json.dumps(["24x7 Emergency Trauma", "Anti-Snake Venom", "Blood Bank", "Ambulance Fleet", "Oxygen Plant"]),
            "108 / 06727-232014", "Hospital Road, Near Collectorate, Kendrapara", 1, 1, 1
        ),
        (
            "hospital", "SCB Medical College & Emergency Disaster Unit", "ଏସସିବି ମେଡିକାଲ କଲେଜ ଜରୁରୀକାଳୀନ ୟୁନିଟ୍", "एससीबी मेडिकल कॉलेज आपातकालीन यूनिट",
            "Cuttack", 20.4780, 85.8820, 2000, 1420, "operational",
            json.dumps(["Level 1 Trauma Care", "ICU Beds", "Epidemic Control Unit", "Disaster Mesh Node #01"]),
            "0671-2414004", "Mangalabag, Cuttack", 1, 1, 1
        ),
        (
            "water_food", "Aahar Kendra & Potable Water Tanker Hub", "ଆହାର କେନ୍ଦ୍ର ଓ ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ ବିତରଣ କେନ୍ଦ୍ର", "आहार केंद्र और पेयजल वितरण हब",
            "Puri", 19.8050, 85.8200, 5000, 1200, "operational",
            json.dumps(["Drinking Water Pouches (50,000)", "Dry Chuda & Gur", "Halazone Water Purification Tablets", "ORS Packets"]),
            "1800-345-6770", "Bus Stand Complex, Talabania, Puri", 1, 0, 1
        ),
        (
            "charging_mesh", "Community LoRa Mesh Relay & Solar Charging Point", "କମ୍ୟୁନିଟି ମେଶ୍ ରିଲେ ଏବଂ ସୌର ଚାର୍ଜିଂ ପଏଣ୍ଟ", "कम्युनिटी मेश रिले और सोलर चार्जिंग पॉइंट",
            "Jagatsinghpur", 20.2700, 86.1700, 150, 45, "operational",
            json.dumps(["100W Solar Charging Strip", "Meshtastic 865MHz Repeater (Node 0x4A8F)", "HAM Radio Call-sign VU2OSD"]),
            "HAM 144.500 MHz", "Government Polytechnic Building Rooftop, Naugaon", 1, 0, 1
        ),
        (
            "shelter", "Chandipur Coastal Cyclone Protection Shelter", "ଚାନ୍ଦିପୁର ଉପକୂଳ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ", "चांदीपुर तटीय चक्रवात आश्रय",
            "Balasore", 21.4670, 87.0160, 900, 320, "operational",
            json.dumps(["Drinking Water", "High-Mast Floodlights", "Inflatable Rescue Boats (2)"]),
            "06782-262100", "Near Marine Police Outpost, Chandipur", 1, 1, 1
        )
    ]

    cur.executemany("""
    INSERT INTO resources (
        type, name_en, name_or, name_hi, district,
        latitude, longitude, capacity, current_occupancy, status,
        supplies_available, helpline, address, has_generator, has_medical, has_mesh_relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, resources)

    # --- Seed Initial SOS Requests (for demonstration and drill testing) ---
    sos_samples = [
        (
            "sos-demo-001", "Ramesh Kumar Mohanty", "+91 94371 88200", 6,
            "trapped", "urgent", 20.1920, 86.4350,
            "Near Old Panchayat Well, water entered 4 feet high in house",
            "Jagatsinghpur", json.dumps(["boat", "infant_food", "medicines"]),
            2, "NODE_LORA_0x3F", "dispatched", "NDRF Team 04 - Boat 2",
            "Inflatable motorized boat dispatched from Ersama base.",
            now - 1800, now - 600
        ),
        (
            "sos-demo-002", "Pravati Behera & Family", "+91 98610 44123", 4,
            "medical", "urgent", 19.8240, 85.8450,
            "House roof damaged near Sea Beach Ward 3, senior citizen with cardiac distress",
            "Puri", json.dumps(["ambulance", "oxygen", "stretcher"]),
            1, "NODE_WIFI_0x12", "verified", "ODRAF Medical Unit Puri",
            "Paramedic team notified, ambulance enroute.",
            now - 3200, now - 1200
        ),
        (
            "sos-demo-003", "Bikram Kishore Sahoo", "+91 82490 11987", 3,
            "safe_checkin", "moderate", 20.4850, 85.8900,
            "Reached SCB Cyclone Relief Camp Room 14. All family members safe.",
            "Cuttack", json.dumps([]),
            0, "LOCAL_WEB_P2P", "resolved", "Camp Admin Cuttack",
            "Registered in shelter ledger.",
            now - 7200, now - 5000
        )
    ]

    cur.executemany("""
    INSERT INTO sos_requests (
        uuid, name, phone, people_count, status, triage,
        latitude, longitude, landmark, district, needs_list,
        mesh_hops, mesh_node_origin, verification_status, assigned_team, notes,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sos_samples)

    # --- Seed Missing Persons Registry (DPDP Privacy Compliant) ---
    persons = [
        (
            "person-uuid-001", "missing", "Debendra Nath Jena", 64, "Male",
            "Nuabazar Market area during cyclone evacuation", "Unknown",
            "Sunil Jena (Son)", "+91 94*** **890", "hash_jena_001",
            "Wearing white dhoti and blue shirt. Height approx 5ft 6in. Speaks Odia.",
            "active", now - 14400
        ),
        (
            "person-uuid-002", "found_safe", "Ananya Priyadarshini", 12, "Female",
            "Rescued from flooded village ward near Astaranga", "Puri Multi-Purpose Shelter #12",
            "Camp Warden Smt. Das", "+91 67*** **344", "hash_ananya_002",
            "Red dress, school bag with books. Safe and sheltered in child protection room.",
            "active", now - 7200
        ),
        (
            "person-uuid-003", "missing", "Mohammed Irfan", 28, "Male",
            "Last seen assisting in sandbag embankment at Mahanadi canal", "Unknown",
            "Zahid Khan (Cousin)", "+91 98*** **456", "hash_irfan_003",
            "Black jacket, high rubber boots, HAM radio enthusiast with volunteer badge.",
            "active", now - 21600
        )
    ]

    cur.executemany("""
    INSERT INTO persons_registry (
        uuid, type, full_name, age, gender,
        last_seen_location, current_shelter, contact_name, contact_phone_masked, contact_phone_hash,
        identifying_features, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, persons)

    # --- Seed Volunteers ---
    volunteers = [
        (
            "Subhashree Nayak", "+91 99*** **321", "Puri", "medical",
            "Mobile First-Aid Kit, BP apparatus, O2 Oximeter", "B+", "available", 1, now - 86400
        ),
        (
            "Captain Asit Patnaik (Retd.)", "+91 94*** **555", "Jagatsinghpur", "boat_rescue",
            "1x Gemini Inflatable Boat (6-person), 15HP outboard engine", "O+", "deployed", 1, now - 90000
        ),
        (
            "Tushar Kant Mishra (VU3TKM)", "+91 98*** **777", "Cuttack", "mesh_ham_radio",
            "4x Meshtastic LoRa 865MHz ESP32 radios, 2x VHF Baofeng Handhelds", "A+", "available", 1, now - 50000
        )
    ]

    cur.executemany("""
    INSERT INTO volunteers (
        name, phone_masked, district, role, equipment_pledged,
        blood_group, status, is_verified, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, volunteers)

    # --- Seed Simulated Initial Mesh Packets ---
    packets = [
        ("PKT-9A1B-001", "BROADCAST", "NODE-PURI-RELAY-01", "BROADCAST", 1, -72, 9.2, json.dumps({"type": "ALERT", "msg": "Dhamra cyclone shelter generator active"}), now - 900),
        ("PKT-9A1B-002", "SOS", "NODE-FIELD-ESP32-14", "GATEWAY-CENTRAL", 2, -84, 6.8, json.dumps({"sos_id": "sos-demo-001", "lat": 20.192, "lon": 86.435}), now - 1800),
        ("PKT-9A1B-003", "TELEMETRY", "NODE-CU-ROOFTOP-03", "GATEWAY-CENTRAL", 0, -68, 11.4, json.dumps({"batt": 94, "solar_v": 13.8, "peers": 7}), now - 300)
    ]

    cur.executemany("""
    INSERT INTO mesh_packets (
        packet_id, packet_type, source_node, destination_node,
        hop_count, rssi, snr, payload, received_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, packets)

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("DisasterMesh database initialized with comprehensive field seed data.")
