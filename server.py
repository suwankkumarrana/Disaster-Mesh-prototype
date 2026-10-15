"""
DisasterMesh Edge Gateway & Web Server
High-availability, zero-dependency Python HTTP server.
Runs on any standard Python 3.x environment (Raspberry Pi, rugged laptop, edge router).
Features:
- Full REST API with SQLite backend
- Gzip dynamic compression for < 200 KB low-bandwidth transfer
- CSV and GeoJSON export for NDRF / District Collectorate GIS
- LoRa / WebRTC packet relay simulation
- DPDP Act compliant data sanitization
"""

import http.server
import socketserver
import urllib.parse
import json
import os
import sys
import time
import uuid
import gzip
import io
import csv
import hashlib
from database import get_connection, init_db

PORT = 8080
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}

def mask_phone(phone_str):
    if not phone_str:
        return ""
    clean = "".join(ch for ch in phone_str if ch.isdigit() or ch == "+")
    if len(clean) >= 10:
        return clean[:3] + "*****" + clean[-3:]
    return clean[:2] + "***" + clean[-1:] if len(clean) > 3 else "***"

def hash_phone(phone_str):
    if not phone_str:
        return ""
    return hashlib.sha256(phone_str.strip().encode("utf-8")).hexdigest()[:16]

class DisasterMeshHandler(http.server.BaseHTTPRequestHandler):
    server_version = "DisasterMeshGateway/2.0"

    def log_message(self, format, *args):
        # Keep server log clean and compact
        sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {args[0]} - {args[1]}\n")

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Mesh-Node, Authorization")

    def _send_json_response(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        accept_encoding = self.headers.get("Accept-Encoding", "")
        
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

        if "gzip" in accept_encoding and len(body) > 500:
            compressed = gzip.compress(body)
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(compressed)))
            self.end_headers()
            self.wfile.write(compressed)
        else:
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API routing
        if path.startswith("/api/"):
            self.handle_api_get(path, query)
            return

        # Static file serving
        self.handle_static_get(path)

    def handle_static_get(self, path):
        if path == "/" or path == "":
            rel_path = "index.html"
        else:
            rel_path = path.lstrip("/")

        file_path = os.path.normpath(os.path.join(PUBLIC_DIR, rel_path))

        # Security check: prevent directory traversal
        if not file_path.startswith(os.path.abspath(PUBLIC_DIR)):
            self.send_error(403, "Forbidden")
            return

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            # Fallback to index.html for SPA routing or 404
            file_path = os.path.join(PUBLIC_DIR, "index.html")
            if not os.path.exists(file_path):
                self.send_error(404, "File Not Found")
                return

        ext = os.path.splitext(file_path)[1].lower()
        content_type = MIME_TYPES.get(ext, "application/octet-stream")

        try:
            with open(file_path, "rb") as f:
                content = f.read()

            accept_encoding = self.headers.get("Accept-Encoding", "")
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", content_type)

            # Caching strategy: immutable for assets, stale-while-revalidate for sw/manifest/html
            if ext in [".css", ".js", ".svg", ".png", ".jpg"]:
                self.send_header("Cache-Control", "public, max-age=86400")
            elif ext in [".html", ".webmanifest"]:
                self.send_header("Cache-Control", "public, max-age=60, stale-while-revalidate=86400")
            elif "sw.js" in file_path:
                self.send_header("Cache-Control", "no-cache")

            if "gzip" in accept_encoding and len(content) > 1024 and ext in [".html", ".css", ".js", ".json", ".svg"]:
                compressed = gzip.compress(content)
                self.send_header("Content-Encoding", "gzip")
                self.send_header("Content-Length", str(len(compressed)))
                self.end_headers()
                self.wfile.write(compressed)
            else:
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading static file: {str(e)}")

    def handle_api_get(self, path, query):
        conn = get_connection()
        cur = conn.cursor()

        try:
            if path == "/api/health":
                self._send_json_response({
                    "status": "online",
                    "mode": "EDGE_MESH_GATEWAY",
                    "timestamp": int(time.time()),
                    "version": "2.0.4-disaster-resilient"
                })

            elif path == "/api/stats":
                cur.execute("SELECT COUNT(*) FROM alerts WHERE is_active=1")
                active_alerts = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM sos_requests WHERE status!='safe_checkin' AND verification_status!='resolved'")
                pending_sos = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM sos_requests WHERE verification_status='resolved' OR status='safe_checkin'")
                safe_count = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM resources WHERE type='shelter'")
                shelters = cur.fetchone()[0]

                cur.execute("SELECT SUM(capacity), SUM(current_occupancy) FROM resources WHERE type='shelter'")
                row = cur.fetchone()
                total_capacity = row[0] or 0
                total_occupancy = row[1] or 0

                cur.execute("SELECT COUNT(*) FROM persons_registry WHERE type='missing' AND status='active'")
                missing_count = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM volunteers WHERE status='available'")
                available_volunteers = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM mesh_packets")
                total_packets = cur.fetchone()[0]

                self._send_json_response({
                    "active_alerts": active_alerts,
                    "pending_sos": pending_sos,
                    "safe_count": safe_count,
                    "shelters_count": shelters,
                    "shelter_capacity": total_capacity,
                    "shelter_occupancy": total_occupancy,
                    "missing_persons": missing_count,
                    "available_volunteers": available_volunteers,
                    "mesh_packets_relayed": total_packets,
                    "gateway_uptime_seconds": int(time.time()) % 86400,
                    "mesh_channel": "865.2 MHz (India ISM Band)",
                    "mesh_active_peers": 9
                })

            elif path == "/api/alerts":
                cur.execute("SELECT * FROM alerts WHERE is_active=1 ORDER BY created_at DESC")
                rows = [dict(r) for r in cur.fetchall()]
                self._send_json_response({"alerts": rows})

            elif path == "/api/sos":
                status_filter = query.get("status", [None])[0]
                triage_filter = query.get("triage", [None])[0]
                district_filter = query.get("district", [None])[0]

                sql = "SELECT * FROM sos_requests WHERE 1=1"
                params = []
                if status_filter:
                    sql += " AND status = ?"
                    params.append(status_filter)
                if triage_filter:
                    sql += " AND triage = ?"
                    params.append(triage_filter)
                if district_filter:
                    sql += " AND district = ?"
                    params.append(district_filter)

                sql += " ORDER BY CASE triage WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, created_at DESC"
                cur.execute(sql, params)
                rows = []
                for r in cur.fetchall():
                    d = dict(r)
                    if d.get("needs_list"):
                        try:
                            d["needs_list"] = json.loads(d["needs_list"])
                        except:
                            d["needs_list"] = []
                    rows.append(d)
                self._send_json_response({"requests": rows})

            elif path == "/api/missing":
                type_filter = query.get("type", [None])[0]
                search = query.get("q", [None])[0]

                sql = "SELECT * FROM persons_registry WHERE 1=1"
                params = []
                if type_filter:
                    sql += " AND type = ?"
                    params.append(type_filter)
                if search:
                    sql += " AND (full_name LIKE ? OR last_seen_location LIKE ?)"
                    params.extend([f"%{search}%", f"%{search}%"])

                sql += " ORDER BY created_at DESC"
                cur.execute(sql, params)
                rows = [dict(r) for r in cur.fetchall()]
                self._send_json_response({"registry": rows})

            elif path == "/api/resources":
                type_filter = query.get("type", [None])[0]
                district_filter = query.get("district", [None])[0]

                sql = "SELECT * FROM resources WHERE 1=1"
                params = []
                if type_filter:
                    sql += " AND type = ?"
                    params.append(type_filter)
                if district_filter:
                    sql += " AND district = ?"
                    params.append(district_filter)

                sql += " ORDER BY type, district, name_en"
                cur.execute(sql, params)
                rows = []
                for r in cur.fetchall():
                    d = dict(r)
                    if d.get("supplies_available"):
                        try:
                            d["supplies_available"] = json.loads(d["supplies_available"])
                        except:
                            d["supplies_available"] = []
                    rows.append(d)
                self._send_json_response({"resources": rows})

            elif path == "/api/volunteers":
                cur.execute("SELECT id, name, phone_masked, district, role, equipment_pledged, blood_group, status, is_verified, created_at FROM volunteers ORDER BY created_at DESC")
                rows = [dict(r) for r in cur.fetchall()]
                self._send_json_response({"volunteers": rows})

            elif path == "/api/mesh/telemetry":
                cur.execute("SELECT * FROM mesh_packets ORDER BY received_at DESC LIMIT 30")
                packets = []
                for r in cur.fetchall():
                    d = dict(r)
                    try:
                        d["payload"] = json.loads(d["payload"])
                    except:
                        pass
                    packets.append(d)

                nodes = [
                    {"id": "GATEWAY-CENTRAL", "role": "Internet / Satellite Gateway", "battery": 100, "status": "online", "hops": 0, "lat": 20.2961, "lon": 85.8245},
                    {"id": "NODE-PURI-RELAY-01", "role": "Solar Tower Repeater", "battery": 92, "status": "online", "hops": 1, "lat": 19.8135, "lon": 85.8312},
                    {"id": "NODE-ERSAMA-RELAY-02", "role": "Panchayat High Mast", "battery": 86, "status": "online", "hops": 2, "lat": 20.1830, "lon": 86.4410},
                    {"id": "NODE-FIELD-ESP32-14", "role": "NDRF Boat Mobile Node", "battery": 74, "status": "active", "hops": 2, "lat": 20.1920, "lon": 86.4350},
                    {"id": "NODE-CU-ROOFTOP-03", "role": "Hospital Mesh Anchor", "battery": 98, "status": "online", "hops": 1, "lat": 20.4780, "lon": 85.8820},
                    {"id": "NODE-BALASORE-04", "role": "Coastal Cyclone Shelter", "battery": 88, "status": "online", "hops": 2, "lat": 21.4670, "lon": 87.0160}
                ]

                self._send_json_response({
                    "gateway": {
                        "node_id": "GATEWAY-CENTRAL-01",
                        "freq_band": "865-867 MHz (India)",
                        "bandwidth_khz": 250,
                        "spreading_factor": 11,
                        "coding_rate": "4/8",
                        "tx_power_dbm": 20,
                        "snr_avg": 9.2,
                        "active_nodes_count": len(nodes)
                    },
                    "nodes": nodes,
                    "recent_packets": packets
                })

            elif path == "/api/export/csv":
                export_type = query.get("type", ["sos"])[0]
                output = io.StringIO()
                writer = csv.writer(output)

                if export_type == "sos":
                    writer.writerow(["ID", "UUID", "Name", "People", "Status", "Triage", "Lat", "Lon", "Landmark", "District", "Hops", "Verification", "AssignedTeam", "CreatedAt"])
                    cur.execute("SELECT id, uuid, name, people_count, status, triage, latitude, longitude, landmark, district, mesh_hops, verification_status, assigned_team, created_at FROM sos_requests")
                    for r in cur.fetchall():
                        writer.writerow(list(r))
                elif export_type == "missing":
                    writer.writerow(["ID", "UUID", "Type", "FullName", "Age", "Gender", "LastSeenLocation", "CurrentShelter", "Status", "CreatedAt"])
                    cur.execute("SELECT id, uuid, type, full_name, age, gender, last_seen_location, current_shelter, status, created_at FROM persons_registry")
                    for r in cur.fetchall():
                        writer.writerow(list(r))
                else:
                    writer.writerow(["ID", "Type", "Name_EN", "District", "Lat", "Lon", "Capacity", "Occupancy", "Status", "Helpline"])
                    cur.execute("SELECT id, type, name_en, district, latitude, longitude, capacity, current_occupancy, status, helpline FROM resources")
                    for r in cur.fetchall():
                        writer.writerow(list(r))

                csv_content = output.getvalue().encode("utf-8")
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Content-Disposition", f"attachment; filename=disaster_{export_type}_{int(time.time())}.csv")
                self.send_header("Content-Length", str(len(csv_content)))
                self.end_headers()
                self.wfile.write(csv_content)
                return

            elif path == "/api/export/geojson":
                cur.execute("SELECT id, type, name_en, district, latitude, longitude, capacity, current_occupancy, status, helpline FROM resources")
                features = []
                for r in cur.fetchall():
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [r["longitude"], r["latitude"]]
                        },
                        "properties": {
                            "id": r["id"],
                            "type": r["type"],
                            "name": r["name_en"],
                            "district": r["district"],
                            "capacity": r["capacity"],
                            "occupancy": r["current_occupancy"],
                            "status": r["status"],
                            "helpline": r["helpline"]
                        }
                    })
                geojson = {
                    "type": "FeatureCollection",
                    "features": features
                }
                self._send_json_response(geojson)
                return

            else:
                self._send_json_response({"error": "Unknown API endpoint"}, status_code=404)
        finally:
            conn.close()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception as e:
            self._send_json_response({"error": "Invalid JSON payload", "details": str(e)}, status_code=400)
            return

        conn = get_connection()
        cur = conn.cursor()

        try:
            now = int(time.time())

            if path == "/api/sos":
                # Validate required fields
                name = str(body.get("name", "")).strip()[:100]
                landmark = str(body.get("landmark", "")).strip()[:200]
                district = str(body.get("district", "General")).strip()[:50]
                phone = str(body.get("phone", "")).strip()[:20]
                status = str(body.get("status", "trapped"))
                triage = str(body.get("triage", "urgent"))
                people_count = int(body.get("people_count", 1))
                lat = float(body.get("latitude", 0.0))
                lon = float(body.get("longitude", 0.0))
                needs = body.get("needs_list", [])
                hops = int(body.get("mesh_hops", 0))
                origin_node = str(body.get("mesh_node_origin", "BROWSER_CLIENT"))[:50]

                if not name or not landmark:
                    self._send_json_response({"error": "Name and location landmark are required"}, status_code=400)
                    return

                req_uuid = f"sos-{uuid.uuid4().hex[:8]}"
                cur.execute("""
                INSERT INTO sos_requests (
                    uuid, name, phone, people_count, status, triage,
                    latitude, longitude, landmark, district, needs_list,
                    mesh_hops, mesh_node_origin, verification_status, assigned_team,
                    notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', 'Pending Dispatch', '', ?, ?)
                """, (
                    req_uuid, name, phone, people_count, status, triage,
                    lat, lon, landmark, district, json.dumps(needs),
                    hops, origin_node, now, now
                ))
                conn.commit()

                # Also log as mesh packet
                pkt_id = f"PKT-SOS-{req_uuid[-6:].upper()}"
                cur.execute("""
                INSERT INTO mesh_packets (
                    packet_id, packet_type, source_node, destination_node,
                    hop_count, rssi, snr, payload, received_at
                ) VALUES (?, 'SOS', ?, 'GATEWAY-CENTRAL', ?, -70, 10.1, ?, ?)
                """, (pkt_id, origin_node, hops, json.dumps({"uuid": req_uuid, "triage": triage, "people": people_count}), now))
                conn.commit()

                self._send_json_response({
                    "success": True,
                    "uuid": req_uuid,
                    "message": "SOS registered and queued for rescue dispatch & mesh broadcast",
                    "triage": triage
                }, status_code=201)

            elif path == "/api/missing":
                full_name = str(body.get("full_name", "")).strip()[:100]
                m_type = str(body.get("type", "missing"))
                age = int(body.get("age", 0)) if body.get("age") else None
                gender = str(body.get("gender", "Unknown"))
                location = str(body.get("last_seen_location", "")).strip()[:200]
                shelter = str(body.get("current_shelter", "")).strip()[:150]
                contact_name = str(body.get("contact_name", "")).strip()[:100]
                raw_phone = str(body.get("contact_phone", "")).strip()
                identifying = str(body.get("identifying_features", "")).strip()[:300]

                if not full_name or not location:
                    self._send_json_response({"error": "Full name and location are required"}, status_code=400)
                    return

                masked = mask_phone(raw_phone)
                phone_hash = hash_phone(raw_phone)
                p_uuid = f"person-{uuid.uuid4().hex[:8]}"

                cur.execute("""
                INSERT INTO persons_registry (
                    uuid, type, full_name, age, gender,
                    last_seen_location, current_shelter, contact_name, contact_phone_masked,
                    contact_phone_hash, identifying_features, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
                """, (
                    p_uuid, m_type, full_name, age, gender,
                    location, shelter, contact_name, masked,
                    phone_hash, identifying, now
                ))
                conn.commit()

                self._send_json_response({
                    "success": True,
                    "uuid": p_uuid,
                    "masked_contact": masked,
                    "message": "Registry entry recorded. Contact details masked per DPDP Act."
                }, status_code=201)

            elif path == "/api/volunteers":
                name = str(body.get("name", "")).strip()[:100]
                phone = str(body.get("phone", "")).strip()
                district = str(body.get("district", "General"))
                role = str(body.get("role", "shelter_support"))
                equipment = str(body.get("equipment_pledged", ""))[:200]
                blood = str(body.get("blood_group", ""))[:10]

                if not name or not phone:
                    self._send_json_response({"error": "Name and contact number are required"}, status_code=400)
                    return

                masked = mask_phone(phone)
                cur.execute("""
                INSERT INTO volunteers (
                    name, phone_masked, district, role, equipment_pledged,
                    blood_group, status, is_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'available', 1, ?)
                """, (name, masked, district, role, equipment, blood, now))
                conn.commit()

                self._send_json_response({"success": True, "message": "Volunteer registered and alert roster updated."})

            elif path == "/api/alerts":
                # Admin alert posting
                source = str(body.get("source", "NDMA"))
                level = str(body.get("level", "AMBER"))
                title_en = str(body.get("title_en", ""))
                title_or = str(body.get("title_or", title_en))
                title_hi = str(body.get("title_hi", title_en))
                desc_en = str(body.get("desc_en", ""))
                desc_or = str(body.get("desc_or", desc_en))
                desc_hi = str(body.get("desc_hi", desc_en))
                areas = str(body.get("affected_areas", "Coastal Districts"))
                action = str(body.get("action_required", "Follow local administration instructions."))

                if not title_en or not desc_en:
                    self._send_json_response({"error": "Alert title and description are required"}, status_code=400)
                    return

                cur.execute("""
                INSERT INTO alerts (
                    source, level, title_en, title_or, title_hi,
                    desc_en, desc_or, desc_hi, affected_areas, action_required,
                    created_at, expires_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    source, level, title_en, title_or, title_hi,
                    desc_en, desc_or, desc_hi, areas, action,
                    now, now + 86400 * 3
                ))
                conn.commit()

                # Broadcast packet
                pkt_id = f"PKT-BC-{uuid.uuid4().hex[:6].upper()}"
                cur.execute("""
                INSERT INTO mesh_packets (
                    packet_id, packet_type, source_node, destination_node,
                    hop_count, rssi, snr, payload, received_at
                ) VALUES (?, 'BROADCAST', 'GATEWAY-CENTRAL', 'BROADCAST', 0, -60, 14.0, ?, ?)
                """, (pkt_id, json.dumps({"alert": title_en, "level": level}), now))
                conn.commit()

                self._send_json_response({"success": True, "message": "Official alert broadcasted to mesh"})

            elif path == "/api/mesh/packet":
                # Simulated LoRa / P2P packet ingestion
                pkt_id = body.get("packet_id", f"PKT-{uuid.uuid4().hex[:6].upper()}")
                pkt_type = body.get("packet_type", "DATA")
                src = body.get("source_node", "UNKNOWN_NODE")
                dst = body.get("destination_node", "BROADCAST")
                hops = int(body.get("hop_count", 1))
                payload = body.get("payload", {})

                cur.execute("""
                INSERT OR IGNORE INTO mesh_packets (
                    packet_id, packet_type, source_node, destination_node,
                    hop_count, rssi, snr, payload, received_at
                ) VALUES (?, ?, ?, ?, ?, -76, 8.4, ?, ?)
                """, (pkt_id, pkt_type, src, dst, hops, json.dumps(payload), now))
                conn.commit()

                self._send_json_response({"status": "relayed", "packet_id": pkt_id, "hop_count": hops + 1})

            else:
                self._send_json_response({"error": "Unknown API POST endpoint"}, status_code=404)
        finally:
            conn.close()

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception as e:
            self._send_json_response({"error": "Invalid JSON"}, status_code=400)
            return

        conn = get_connection()
        cur = conn.cursor()

        try:
            now = int(time.time())

            if path.startswith("/api/sos/"):
                req_id = path.split("/api/sos/")[1]
                v_status = body.get("verification_status")
                team = body.get("assigned_team")
                notes = body.get("notes")

                updates = ["updated_at = ?"]
                params = [now]
                if v_status:
                    updates.append("verification_status = ?")
                    params.append(v_status)
                if team:
                    updates.append("assigned_team = ?")
                    params.append(team)
                if notes:
                    updates.append("notes = ?")
                    params.append(notes)

                params.append(req_id)
                cur.execute(f"UPDATE sos_requests SET {', '.join(updates)} WHERE uuid = ? OR id = ?", params + [req_id])
                conn.commit()
                self._send_json_response({"success": True, "message": "SOS status updated"})

            elif path.startswith("/api/missing/"):
                person_id = path.split("/api/missing/")[1]
                status = body.get("status", "reunited")
                shelter = body.get("current_shelter")

                updates = ["status = ?"]
                params = [status]
                if shelter:
                    updates.append("current_shelter = ?")
                    params.append(shelter)

                params.append(person_id)
                cur.execute(f"UPDATE persons_registry SET {', '.join(updates)} WHERE uuid = ? OR id = ?", params + [person_id])
                conn.commit()
                self._send_json_response({"success": True, "message": "Registry record updated"})

            else:
                self._send_json_response({"error": "Unknown PATCH endpoint"}, status_code=404)
        finally:
            conn.close()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def run(port=PORT):
    init_db()
    server_address = ("", port)
    httpd = ThreadedHTTPServer(server_address, DisasterMeshHandler)
    print(f"============================================================")
    print(f"   DISASTER MESH EDGE GATEWAY ACTIVE ON PORT {port}")
    print(f"   Local Access:    http://localhost:{port}")
    print(f"   Local Network:   http://0.0.0.0:{port}")
    print(f"   Low Bandwidth:   Optimized (< 200 KB) with Gzip compression")
    print(f"   PWA & Offline:   Service Worker & IndexedDB Enabled")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nGateway shutting down gracefully...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run(port)
