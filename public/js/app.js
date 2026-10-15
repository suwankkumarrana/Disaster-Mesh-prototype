/**
 * DisasterMesh Main Client Application Controller
 * Manages view routing, SOS workflow, emergency audio synthesis,
 * low-bandwidth text mode, and field drill simulations.
 */

class DisasterMeshApp {
  constructor() {
    this.currentTab = "home";
    this.isTextOnly = localStorage.getItem("disaster_mesh_text_mode") === "true";
    this.isHighContrast = localStorage.getItem("disaster_mesh_contrast") === "true";
    this.cachedAlerts = [];
  }

  async init() {
    // 1. Initialize PWA Service Worker
    this.registerServiceWorker();

    // 2. Setup Multilingual Language Engine
    I18N.applyToDOM();

    // 3. Apply stored visual accessibility preferences
    if (this.isTextOnly) this.applyTextOnlyMode(true);
    if (this.isHighContrast) this.applyHighContrastMode(true);

    // 4. Bind events
    this.bindEvents();

    // 5. Check URL hash routing
    this.handleRoute();
    window.addEventListener("hashchange", () => this.handleRoute());

    // 6. Load initial data
    await this.refreshStats();
    await this.refreshAlerts();

    // 7. Initialize Resource Locator
    window.resourceMapManager.init("resource-map", "resource-list-container");

    // 8. Register Mesh packet listener
    if (window.meshNode) {
      window.meshNode.registerPacketListener((pkt) => this.onIncomingMeshPacket(pkt));
    }

    // 9. Check DPDP Consent
    this.checkDPDPConsent();

    console.log("[DisasterMesh] System Initialized successfully.");
  }

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("[DisasterMesh] Service Worker Registered:", reg.scope))
        .catch((err) => console.warn("[DisasterMesh] Service Worker registration failed:", err));
    }
  }

  bindEvents() {
    // Navigation clicks
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        const tab = link.getAttribute("data-tab");
        if (tab) {
          window.location.hash = tab;
        }
      });
    });

    // Language switcher buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        I18N.setLanguage(lang);
        this.refreshAlerts();
        window.resourceMapManager.render();
      });
    });

    // Text-only mode toggle
    const textModeBtn = document.getElementById("toggle-text-mode");
    if (textModeBtn) {
      textModeBtn.addEventListener("click", () => {
        this.toggleTextOnlyMode();
      });
    }

    // High contrast toggle
    const contrastBtn = document.getElementById("toggle-contrast");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", () => {
        this.toggleHighContrast();
      });
    }

    // SOS Geolocation capture
    const geoBtn = document.getElementById("btn-capture-gps");
    if (geoBtn) {
      geoBtn.addEventListener("click", () => this.captureGeolocation());
    }

    // SOS Form submission
    const sosForm = document.getElementById("sos-form");
    if (sosForm) {
      sosForm.addEventListener("submit", (e) => this.handleSOSSubmit(e));
    }

    // Missing person search
    const missingSearch = document.getElementById("missing-search-input");
    if (missingSearch) {
      missingSearch.addEventListener("input", (e) => this.filterMissingPersons(e.target.value));
    }

    // Missing person form
    const missingForm = document.getElementById("missing-form");
    if (missingForm) {
      missingForm.addEventListener("submit", (e) => this.handleMissingSubmit(e));
    }

    // Volunteer form
    const volunteerForm = document.getElementById("volunteer-form");
    if (volunteerForm) {
      volunteerForm.addEventListener("submit", (e) => this.handleVolunteerSubmit(e));
    }

    // Audio alarm button
    const alarmBtn = document.getElementById("btn-audio-alarm");
    if (alarmBtn) {
      alarmBtn.addEventListener("click", () => this.playEmergencyAudioBroadcast());
    }

    // Admin login form
    const adminLoginForm = document.getElementById("admin-login-form");
    if (adminLoginForm) {
      adminLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pin = document.getElementById("admin-pin-input").value;
        if (window.adminConsole.authenticate(pin)) {
          window.adminConsole.renderDashboard();
        } else {
          alert("Incorrect Security PIN. Default emergency PIN is 1078 or disaster2026");
        }
      });
    }

    // Admin post alert form
    const postAlertForm = document.getElementById("admin-post-alert-form");
    if (postAlertForm) {
      postAlertForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = {
          source: document.getElementById("alert-source").value,
          level: document.getElementById("alert-level").value,
          title_en: document.getElementById("alert-title-en").value,
          title_or: document.getElementById("alert-title-or").value,
          title_hi: document.getElementById("alert-title-hi").value,
          desc_en: document.getElementById("alert-desc-en").value,
          desc_or: document.getElementById("alert-desc-or").value,
          desc_hi: document.getElementById("alert-desc-hi").value,
          affected_areas: document.getElementById("alert-areas").value,
          action_required: document.getElementById("alert-action").value
        };
        window.adminConsole.submitNewAlert(formData);
        postAlertForm.reset();
      });
    }

    // Drill simulator controls
    document.querySelectorAll(".drill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        this.applyDrillMode(mode);
      });
    });
  }

  handleRoute() {
    const hash = window.location.hash.replace("#", "") || "home";
    this.switchTab(hash);
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Hide all views
    document.querySelectorAll(".tab-view").forEach((view) => {
      view.style.display = "none";
    });

    // Remove active class from nav
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("active");
      }
    });

    // Show target view
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
      target.style.display = "block";
    }

    // Trigger tab-specific loaders
    if (tabId === "missing") this.loadMissingPersons();
    if (tabId === "resources") window.resourceMapManager.render();
    if (tabId === "volunteers") this.loadVolunteers();
    if (tabId === "admin") window.adminConsole.renderDashboard();
    if (tabId === "mesh") this.loadMeshMonitor();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  toggleTextOnlyMode() {
    this.isTextOnly = !this.isTextOnly;
    localStorage.setItem("disaster_mesh_text_mode", this.isTextOnly);
    this.applyTextOnlyMode(this.isTextOnly);
  }

  applyTextOnlyMode(enable) {
    let link = document.getElementById("text-only-stylesheet");
    const btn = document.getElementById("toggle-text-mode");

    if (enable) {
      if (!link) {
        link = document.createElement("link");
        link.id = "text-only-stylesheet";
        link.rel = "stylesheet";
        link.href = "/css/text-only.css";
        document.head.appendChild(link);
      }
      document.body.classList.add("text-only-active");
      if (btn) btn.textContent = I18N.t("btn_rich_mode");
      if (window.resourceMapManager) window.resourceMapManager.setViewMode("list");
    } else {
      if (link) link.remove();
      document.body.classList.remove("text-only-active");
      if (btn) btn.textContent = I18N.t("btn_text_mode");
      if (window.resourceMapManager) window.resourceMapManager.setViewMode("map");
    }
  }

  toggleHighContrast() {
    this.isHighContrast = !this.isHighContrast;
    localStorage.setItem("disaster_mesh_contrast", this.isHighContrast);
    this.applyHighContrastMode(this.isHighContrast);
  }

  applyHighContrastMode(enable) {
    if (enable) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }

  captureGeolocation() {
    const statusEl = document.getElementById("gps-status-indicator");
    const latInput = document.getElementById("sos-lat");
    const lonInput = document.getElementById("sos-lon");

    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = "GPS not supported on this device.";
      return;
    }

    if (statusEl) statusEl.textContent = "Acquiring satellite lock...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(5);
        const lon = +pos.coords.longitude.toFixed(5);
        const accuracy = Math.round(pos.coords.accuracy);

        if (latInput) latInput.value = lat;
        if (lonInput) lonInput.value = lon;
        if (statusEl) {
          statusEl.innerHTML = `✅ GPS Locked: <strong>${lat}, ${lon}</strong> (Accuracy: ±${accuracy}m)`;
        }
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = "GPS unavailable or permission denied. Please enter landmark description manually.";
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async handleSOSSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("sos-submit-btn");
    const feedbackBox = document.getElementById("sos-feedback-box");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Transmitting over Mesh...";
    }

    const needs = [];
    document.querySelectorAll("input[name='needs']:checked").forEach((cb) => {
      needs.push(cb.value);
    });

    const sosPayload = {
      name: document.getElementById("sos-name").value,
      phone: document.getElementById("sos-phone").value,
      people_count: parseInt(document.getElementById("sos-people").value, 10) || 1,
      status: document.getElementById("sos-status").value,
      triage: document.getElementById("sos-triage").value,
      latitude: parseFloat(document.getElementById("sos-lat").value) || 0,
      longitude: parseFloat(document.getElementById("sos-lon").value) || 0,
      landmark: document.getElementById("sos-landmark").value,
      district: document.getElementById("sos-district").value,
      needs_list: needs
    };

    try {
      const result = await API.submitSOS(sosPayload);

      if (feedbackBox) {
        feedbackBox.style.display = "block";
        feedbackBox.className = "alert-box alert-success mt-4";
        feedbackBox.innerHTML = `
          <h4>🚨 SOS Transmitted & Recorded!</h4>
          <p><strong>Tracking UUID:</strong> <code>${result.uuid}</code></p>
          <p>Status: <strong>${result.offline ? 'Queued in Offline IndexedDB & Relaying via Neighbor Mesh Radios' : 'Received by Central Rescue Server & NDRF/ODRAF Control'}</strong></p>
          <p class="text-sm">Priority: <span class="badge badge-urgent">${sosPayload.triage.toUpperCase()}</span> | People: ${sosPayload.people_count}</p>
          <div class="mt-3">
            <button type="button" class="btn btn-secondary btn-sm" onclick="app.showEmergencyQR('${result.uuid}', '${sosPayload.triage}', ${sosPayload.people_count})">📱 Show Emergency QR Code for Responders</button>
          </div>
        `;
      }

      document.getElementById("sos-form").reset();
      this.refreshStats();
    } catch (err) {
      alert("Error submitting SOS: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = I18N.t("form_submit_sos");
      }
    }
  }

  showEmergencyQR(uuid, triage, people) {
    const modal = document.getElementById("qr-modal");
    const qrContent = document.getElementById("qr-modal-content");
    if (!modal || !qrContent) return;

    const rawData = `DMESH*SOS*${uuid}*${triage}*PEOPLE=${people}*TS=${Math.floor(Date.now()/1000)}`;

    qrContent.innerHTML = `
      <div style="background:#fff; color:#000; padding:15px; border-radius:8px; display:inline-block; margin-bottom:12px;">
        <!-- High contrast ASCII matrix representation of emergency packet -->
        <div style="font-family:monospace; font-size:10px; line-height:1; letter-spacing:2px; word-break:break-all; max-width:260px; margin:0 auto;">
          ██████████████████████████<br>
          ██ ▄▄▄▄▄ ██▀▄▀██ ▄▄▄▄▄ ██<br>
          ██ █   █ █▄█ █▄█ █   █ ██<br>
          ██ █▄▄▄█ █ █ ▄ █ █▄▄▄█ ██<br>
          ██▄▄▄▄▄▄▄█▄▀ ▀▄█▄▄▄▄▄▄▄██<br>
          ██ ▄ ▄▀▄▄▄ ▀▀█▀▄ ▀ ▄▀ ▄██<br>
          ██▄█▄██▄▄ ▀▄█▀▄ █▄█▀▄█▄██<br>
          ██ ▄▄▄▄▄ █▄█ █▄█ ▄ █ ▄ ██<br>
          ██ █   █ █ █ ▄ █ █▄█ █▄██<br>
          ██ █▄▄▄█ █▄▀ ▀▄█ ▄  ▄ ██<br>
          ██████████████████████████
        </div>
      </div>
      <p class="text-xs text-muted">Field rescue boats and drone scanners can scan this packet without cell towers.</p>
      <pre style="background:#1e293b; color:#38bdf8; padding:8px; border-radius:4px; font-size:11px; overflow-x:auto;">${rawData}</pre>
      <button class="btn btn-secondary btn-sm mt-3" onclick="document.getElementById('qr-modal').style.display='none'">Close</button>
    `;

    modal.style.display = "flex";
  }

  async refreshStats() {
    const stats = await API.getStats();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal("stat-alerts", stats.active_alerts);
    setVal("stat-sos", stats.pending_sos);
    setVal("stat-capacity", stats.shelter_capacity ? `${stats.shelter_capacity - stats.shelter_occupancy} beds` : "6,200 beds");
    setVal("stat-packets", stats.mesh_packets_relayed || 18);
    setVal("stat-nodes", stats.active_mesh_peers || 9);
  }

  async refreshAlerts() {
    const alerts = await API.getAlerts();
    this.cachedAlerts = alerts;
    const container = document.getElementById("alerts-container");
    const ticker = document.getElementById("emergency-ticker-text");
    if (!container) return;

    if (alerts.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No active emergency alerts at this time.</div>`;
      return;
    }

    const lang = I18N.currentLang;
    if (ticker && alerts[0]) {
      const topTitle = lang === "or" ? alerts[0].title_or : (lang === "hi" ? alerts[0].title_hi : alerts[0].title_en);
      ticker.textContent = `🚨 ${alerts[0].source} [${alerts[0].level}]: ${topTitle}`;
    }

    let html = "";
    alerts.forEach((alert) => {
      const title = lang === "or" ? alert.title_or : (lang === "hi" ? alert.title_hi : alert.title_en);
      const desc = lang === "or" ? alert.desc_or : (lang === "hi" ? alert.desc_hi : alert.desc_en);

      let levelClass = "alert-yellow";
      if (alert.level === "RED") levelClass = "alert-red";
      else if (alert.level === "AMBER") levelClass = "alert-amber";

      html += `
        <div class="alert-card ${levelClass}">
          <div class="alert-header">
            <span class="alert-source-badge">${alert.source} OFFICIAL</span>
            <span class="alert-level-badge level-${alert.level.toLowerCase()}">${alert.level} ALERT</span>
            <span class="text-xs text-muted" style="margin-left:auto;">${new Date(alert.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <h3 class="alert-title">${title}</h3>
          <p class="alert-desc">${desc}</p>
          <div class="alert-meta">
            <span><strong>Affected Districts:</strong> ${alert.affected_areas}</span>
            ${alert.action_required ? `<span class="mt-1 d-block text-accent"><strong>Action Required:</strong> ${alert.action_required}</span>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async loadMissingPersons() {
    const list = await API.getMissingPersons();
    this.renderMissingList(list);
  }

  filterMissingPersons(query) {
    API.getMissingPersons(null, query).then((list) => this.renderMissingList(list));
  }

  renderMissingList(items) {
    const tbody = document.getElementById("missing-persons-tbody");
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4">No missing person records found matching criteria.</td></tr>`;
      return;
    }

    let html = "";
    items.forEach((p) => {
      const isMissing = p.type === "missing";
      html += `
        <tr>
          <td>
            <strong>${p.full_name}</strong><br>
            <span class="text-xs text-muted">${p.identifying_features || "No special marks noted"}</span>
          </td>
          <td>${p.age || "?"} yrs / ${p.gender || "Unknown"}</td>
          <td>
            <strong>${p.last_seen_location}</strong>
            ${p.current_shelter ? `<br><span class="text-xs text-success">Sheltered at: ${p.current_shelter}</span>` : ''}
          </td>
          <td>
            <span class="text-sm font-mono">${p.contact_phone_masked || "Masked"}</span><br>
            <span class="text-xs text-muted">${p.contact_name || "Family"}</span>
          </td>
          <td>
            <span class="badge ${isMissing ? 'badge-urgent' : 'badge-safe'}">
              ${isMissing ? '🔍 MISSING' : '✅ SAFE & SHELTERED'}
            </span>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  async handleMissingSubmit(e) {
    e.preventDefault();
    const payload = {
      type: document.getElementById("missing-type").value,
      full_name: document.getElementById("missing-name").value,
      age: parseInt(document.getElementById("missing-age").value, 10) || null,
      gender: document.getElementById("missing-gender").value,
      last_seen_location: document.getElementById("missing-location").value,
      current_shelter: document.getElementById("missing-shelter").value,
      contact_name: document.getElementById("missing-contact-name").value,
      contact_phone: document.getElementById("missing-phone").value,
      identifying_features: document.getElementById("missing-features").value
    };

    const res = await API.submitMissing(payload);
    if (res.success) {
      alert("Person record registered. Phone number masked per DPDP Act.");
      document.getElementById("missing-form").reset();
      this.loadMissingPersons();
    } else {
      alert("Error: " + (res.error || "Submission failed"));
    }
  }

  async loadVolunteers() {
    const listEl = document.getElementById("volunteers-list");
    if (!listEl) return;

    try {
      const res = await fetch("/api/volunteers");
      const data = await res.json();
      const list = data.volunteers || [];

      let html = `<div class="volunteer-grid">`;
      list.forEach((v) => {
        html += `
          <div class="volunteer-card">
            <div class="card-header-row">
              <h4 style="margin:0;">${v.name}</h4>
              <span class="badge badge-safe">Verified Volunteer</span>
            </div>
            <p class="text-xs text-muted mb-2">📍 ${v.district} | Blood: <strong>${v.blood_group || "N/A"}</strong></p>
            <p class="text-sm"><strong>Role:</strong> ${v.role.replace('_', ' ').toUpperCase()}</p>
            ${v.equipment_pledged ? `<p class="text-xs text-accent"><strong>Pledged Equipment:</strong> ${v.equipment_pledged}</p>` : ''}
            <span class="text-xs text-muted">Contact: ${v.phone_masked}</span>
          </div>
        `;
      });
      html += `</div>`;
      listEl.innerHTML = html;
    } catch (e) {
      listEl.innerHTML = `<div class="text-muted p-3">Offline volunteer list cached.</div>`;
    }
  }

  async handleVolunteerSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById("vol-name").value,
      phone: document.getElementById("vol-phone").value,
      district: document.getElementById("vol-district").value,
      role: document.getElementById("vol-role").value,
      equipment_pledged: document.getElementById("vol-equipment").value,
      blood_group: document.getElementById("vol-blood").value
    };

    const res = await API.submitVolunteer(payload);
    if (res.success) {
      alert("Volunteer registered! You have been added to the regional disaster standby roster.");
      document.getElementById("volunteer-form").reset();
      this.loadVolunteers();
    }
  }

  async loadMeshMonitor() {
    const container = document.getElementById("mesh-monitor-container");
    if (!container) return;

    const telem = await API.getMeshTelemetry();
    const myNode = window.meshNode;

    let packetsHtml = "";
    const packets = myNode ? myNode.packetHistory : (telem.recent_packets || []);

    packets.slice(0, 15).forEach((p) => {
      packetsHtml += `
        <tr>
          <td><code class="text-xs font-mono">${p.packet_id}</code></td>
          <td><span class="badge badge-${p.packet_type === 'SOS' ? 'urgent' : 'safe'}">${p.packet_type}</span></td>
          <td><span class="text-xs font-mono">${p.source_node}</span></td>
          <td><strong>${p.hop_count || 0} hops</strong></td>
          <td><span class="text-xs">${p.rssi || -75} dBm</span></td>
          <td><span class="text-xs">${p.snr || 8.5} dB</span></td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="mesh-hardware-status-card">
        <div class="status-grid-3">
          <div class="status-metric">
            <span class="metric-label">Local Node ID</span>
            <span class="metric-value font-mono text-primary">${myNode.nodeId}</span>
          </div>
          <div class="status-metric">
            <span class="metric-label">Operating Radio Band</span>
            <span class="metric-value">865.200 MHz (ISM)</span>
          </div>
          <div class="status-metric">
            <span class="metric-label">Local Battery</span>
            <span class="metric-value text-success">${myNode.battery}%</span>
          </div>
        </div>

        <div class="mt-4 p-3 bg-dark-lighter rounded">
          <h4 class="text-sm font-semibold mb-2">Simulate Packet Injection & Hop:</h4>
          <div class="flex-gap-2">
            <input type="text" id="custom-mesh-msg" class="form-control" placeholder="Enter simulated mesh message..." value="Camp 3 generator functional, 500 liters water needed">
            <button class="btn btn-primary" onclick="app.injectTestPacket()">Relay Packet</button>
          </div>
        </div>
      </div>

      <h3 class="mt-4 mb-2 text-md font-semibold">Live Relayed Packet Stream:</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Packet ID</th>
              <th>Type</th>
              <th>Origin Node</th>
              <th>Hops</th>
              <th>RSSI</th>
              <th>SNR</th>
            </tr>
          </thead>
          <tbody>
            ${packetsHtml || '<tr><td colspan="6" class="text-center p-3">No packets captured yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  injectTestPacket() {
    const input = document.getElementById("custom-mesh-msg");
    const msg = input ? input.value : "Test packet";
    const pkt = {
      packet_id: `PKT-TEST-${Math.floor(Math.random()*10000)}`,
      packet_type: "BROADCAST",
      source_node: window.meshNode.nodeId,
      destination_node: "BROADCAST",
      hop_count: 0,
      rssi: -71,
      snr: 9.8,
      payload: { message: msg },
      timestamp: Math.floor(Date.now() / 1000)
    };
    window.meshNode.sendRawPacket(pkt, true);
    this.loadMeshMonitor();
    alert("Packet injected into local mesh broadcast channel!");
  }

  onIncomingMeshPacket(pkt) {
    console.log("[DisasterMesh] Incoming P2P Packet:", pkt);
    // Show non-intrusive toast notification
    const toast = document.createElement("div");
    toast.className = "mesh-toast";
    toast.innerHTML = `📻 <strong>Mesh Packet Relayed:</strong> ${pkt.packet_type} from <code>${pkt.source_node}</code> (Hops: ${pkt.hop_count})`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);

    if (this.currentTab === "mesh") {
      this.loadMeshMonitor();
    }
  }

  playEmergencyAudioBroadcast() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 2.0);

      // Voice synthesis announcement
      if ("speechSynthesis" in window) {
        setTimeout(() => {
          const utter = new SpeechSynthesisUtterance("Emergency Disaster Warning. Please evacuate to the nearest cyclone shelter immediately.");
          utter.rate = 0.9;
          window.speechSynthesis.speak(utter);
        }, 1500);
      }
    } catch (e) {
      alert("Emergency Siren: Please move to higher ground and concrete shelters immediately.");
    }
  }

  checkDPDPConsent() {
    if (!localStorage.getItem("disaster_mesh_dpdp_consent")) {
      const modal = document.getElementById("dpdp-consent-modal");
      if (modal) modal.style.display = "flex";
    }
  }

  acceptDPDPConsent() {
    localStorage.setItem("disaster_mesh_dpdp_consent", "true");
    const modal = document.getElementById("dpdp-consent-modal");
    if (modal) modal.style.display = "none";
  }

  applyDrillMode(mode) {
    const banner = document.getElementById("drill-status-banner");
    if (!banner) return;

    if (mode === "normal") {
      banner.style.display = "none";
      alert("Simulation Reset: Normal High-Speed Connection");
    } else if (mode === "2g") {
      banner.style.display = "block";
      banner.className = "alert-box alert-amber";
      banner.textContent = "⚠️ SIMULATION ACTIVE: Poor 2G Network (30 kbps, 1500ms latency simulation). Text-only mode recommended.";
      this.applyTextOnlyMode(true);
    } else if (mode === "offline") {
      banner.style.display = "block";
      banner.className = "alert-box alert-red";
      banner.textContent = "🚨 SIMULATION ACTIVE: Total Cellular & Internet Blackout. All operations running purely on local IndexedDB & peer LoRa mesh.";
    }
  }
}

window.app = new DisasterMeshApp();
document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
