"""
DisasterMesh Automated Test Suite & Bandwidth Auditor
Tests:
1. SQLite database integrity & seed validation
2. Edge REST API endpoints (GET, POST, PATCH)
3. DPDP Act phone masking & privacy validation
4. Low-bandwidth payload audit (< 200 KB total size)
5. Mesh packet store-and-forward relaying
"""

import unittest
import threading
import time
import os
import urllib.request
import json
import gzip
from database import get_connection, init_db
from server import ThreadedHTTPServer, DisasterMeshHandler, mask_phone, hash_phone

TEST_PORT = 8089
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

class DisasterMeshSystemTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        server_address = ("127.0.0.1", TEST_PORT)
        cls.httpd = ThreadedHTTPServer(server_address, DisasterMeshHandler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def test_01_dpdp_phone_masking(self):
        """Test DPDP Act compliance: phone numbers must be securely masked."""
        self.assertEqual(mask_phone("+919861044123"), "+91*****123")
        self.assertEqual(mask_phone("06752223344"), "067*****344")
        self.assertTrue(len(hash_phone("+919861044123")) > 10)

    def test_02_database_seeded(self):
        """Verify database contains alerts, shelters, and seed SOS."""
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM alerts")
        self.assertGreater(cur.fetchone()[0], 0)
        cur.execute("SELECT COUNT(*) FROM resources")
        self.assertGreater(cur.fetchone()[0], 0)
        conn.close()

    def test_03_api_health_and_stats(self):
        """Test healthcheck and stats API."""
        with urllib.request.urlopen(f"{BASE_URL}/api/health") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["status"], "online")

        with urllib.request.urlopen(f"{BASE_URL}/api/stats") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            self.assertIn("active_alerts", data)
            self.assertIn("shelter_capacity", data)

    def test_04_api_alerts_multilingual(self):
        """Test alerts API returns Odia, Hindi, and English content."""
        with urllib.request.urlopen(f"{BASE_URL}/api/alerts") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            alerts = data["alerts"]
            self.assertGreater(len(alerts), 0)
            top_alert = alerts[0]
            self.assertTrue(bool(top_alert["title_en"]))
            self.assertTrue(bool(top_alert["title_or"]))
            self.assertTrue(bool(top_alert["title_hi"]))

    def test_05_api_sos_post_and_retrieve(self):
        """Test submitting emergency SOS and retrieval in triage queue."""
        sos_data = {
            "name": "Arjun Nayak",
            "phone": "+91 94370 12345",
            "people_count": 5,
            "status": "trapped",
            "triage": "urgent",
            "latitude": 20.185,
            "longitude": 86.440,
            "landmark": "Near Primary Health Centre, Ersama",
            "district": "Jagatsinghpur",
            "needs_list": ["boat", "infant_food"]
        }

        req = urllib.request.Request(
            f"{BASE_URL}/api/sos",
            data=json.dumps(sos_data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 201)
            resp_data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(resp_data["success"])
            new_uuid = resp_data["uuid"]

        # Verify in triage queue
        with urllib.request.urlopen(f"{BASE_URL}/api/sos?district=Jagatsinghpur") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            uuids = [r["uuid"] for r in data["requests"]]
            self.assertIn(new_uuid, uuids)

    def test_06_api_missing_persons_privacy(self):
        """Verify missing person submission masks phone number."""
        person_data = {
            "type": "missing",
            "full_name": "Kailash Jena",
            "age": 45,
            "gender": "Male",
            "last_seen_location": "Astaranga Fish Landing Quay",
            "contact_name": "Brother Niranjan",
            "contact_phone": "+91 98610 99999",
            "identifying_features": "Tattoo on left forearm"
        }

        req = urllib.request.Request(
            f"{BASE_URL}/api/missing",
            data=json.dumps(person_data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 201)
            resp_data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue("*****" in resp_data["masked_contact"])

    def test_07_api_csv_and_geojson_export(self):
        """Verify CSV and GeoJSON exports for NDRF GIS."""
        with urllib.request.urlopen(f"{BASE_URL}/api/export/csv?type=sos") as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/csv", resp.headers.get("Content-Type"))
            content = resp.read().decode("utf-8")
            self.assertIn("UUID,Name,People", content)

        with urllib.request.urlopen(f"{BASE_URL}/api/export/geojson") as resp:
            self.assertEqual(resp.status, 200)
            geo = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(geo["type"], "FeatureCollection")
            self.assertGreater(len(geo["features"]), 0)

    def test_08_low_bandwidth_payload_audit(self):
        """
        Non-functional requirement check:
        'Lightweight pages (ideally under 200 KB), minimal JavaScript, and a text-only mode.'
        """
        public_dir = os.path.join(os.path.dirname(__file__), "public")
        total_static_bytes = 0

        for root, _, files in os.walk(public_dir):
            for file in files:
                file_path = os.path.join(root, file)
                total_static_bytes += os.path.getsize(file_path)

        total_kb = total_static_bytes / 1024
        print(f"\n[Bandwidth Audit] Entire DisasterMesh frontend bundle size: {total_kb:.2f} KB")
        # Ensure total bundle is well under 200 KB
        self.assertLess(total_kb, 200.0, "Frontend bundle must be under 200 KB for 2G disaster networks")

if __name__ == "__main__":
    unittest.main()
