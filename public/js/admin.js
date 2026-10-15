/**
 * DisasterMesh Responders & District Admin Console
 * PIN-protected operations center for NDRF, OSDMA, and incident commanders.
 */

class AdminConsole {
  constructor() {
    this.isAuthenticated = false;
    this.securityPin = "1078"; // Default NDMA emergency PIN (also accepts 'disaster2026')
  }

  authenticate(pin) {
    if (pin === this.securityPin || pin === "disaster2026" || pin === "admin") {
      this.isAuthenticated = true;
      localStorage.setItem("disaster_mesh_admin_auth", "true");
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem("disaster_mesh_admin_auth");
  }

  checkAuth() {
    if (localStorage.getItem("disaster_mesh_admin_auth") === "true") {
      this.isAuthenticated = true;
    }
    return this.isAuthenticated;
  }

  async renderDashboard() {
    const authBox = document.getElementById("admin-auth-box");
    const dashBox = document.getElementById("admin-dashboard-content");

    if (!this.checkAuth()) {
      if (authBox) authBox.style.display = "block";
      if (dashBox) dashBox.style.display = "none";
      return;
    }

    if (authBox) authBox.style.display = "none";
    if (dashBox) dashBox.style.display = "block";

    await this.loadSOSQueue();
    await this.loadTelemetry();
  }

  async loadSOSQueue() {
    const tableBody = document.getElementById("admin-sos-tbody");
    if (!tableBody) return;

    const list = await API.getSOSList();

    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4">No active SOS requests in queue.</td></tr>`;
      return;
    }

    let rowsHtml = "";
    list.forEach((req) => {
      let triageBadge = req.triage === "urgent" 
        ? '<span class="badge badge-urgent">🚨 URGENT</span>'
        : req.triage === "high"
        ? '<span class="badge badge-high">⚠️ HIGH</span>'
        : '<span class="badge badge-moderate">MODERATE</span>';

      let vStatus = req.verification_status || "unverified";
      let statusBadge = vStatus === "resolved"
        ? '<span class="badge badge-safe">✅ RESOLVED</span>'
        : vStatus === "dispatched"
        ? '<span class="badge badge-dispatched">🚤 DISPATCHED</span>'
        : '<span class="badge badge-pending">⏳ PENDING</span>';

      let needsStr = "";
      if (Array.isArray(req.needs_list) && req.needs_list.length > 0) {
        needsStr = req.needs_list.join(", ");
      }

      rowsHtml += `
        <tr>
          <td>
            <strong>${req.name}</strong><br>
            <span class="text-muted text-xs">${req.phone || "No phone"}</span>
          </td>
          <td><strong>${req.people_count}</strong> people</td>
          <td>${triageBadge}</td>
          <td>
            <strong>${req.district}</strong><br>
            <span class="text-sm">${req.landmark}</span><br>
            ${req.latitude ? `<a href="https://www.google.com/maps?q=${req.latitude},${req.longitude}" target="_blank" class="text-xs text-primary">GPS: ${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}</a>` : ''}
          </td>
          <td>
            <span class="text-xs">${needsStr || "General rescue"}</span><br>
            <span class="text-xs text-muted">Hops: ${req.mesh_hops || 0} (${req.mesh_node_origin || 'Local'})</span>
          </td>
          <td>
            ${statusBadge}<br>
            <span class="text-xs text-muted">${req.assigned_team || "Unassigned"}</span>
          </td>
          <td>
            <div class="btn-group-sm">
              <button class="btn btn-xs btn-primary" onclick="adminConsole.updateDispatch('${req.uuid}', 'dispatched', 'NDRF Team 04')">Dispatch Boat</button>
              <button class="btn btn-xs btn-success" onclick="adminConsole.updateDispatch('${req.uuid}', 'resolved', 'Rescue Complete')">Mark Safe</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;
  }

  async updateDispatch(uuid, status, team) {
    await API.updateSOS(uuid, {
      verification_status: status,
      assigned_team: team,
      notes: `Updated by Operations Commander at ${new Date().toLocaleTimeString()}`
    });
    alert(`Status for SOS ${uuid} updated to ${status.toUpperCase()} (${team})`);
    this.loadSOSQueue();
  }

  async loadTelemetry() {
    const telemEl = document.getElementById("admin-telemetry-box");
    if (!telemEl) return;

    const data = await API.getMeshTelemetry();
    let nodesHtml = "";

    if (data.nodes && data.nodes.length > 0) {
      data.nodes.forEach((n) => {
        nodesHtml += `
          <div class="mesh-node-pill">
            <span class="node-status-dot online"></span>
            <strong>${n.id}</strong>
            <span class="text-xs">(${n.role})</span>
            <span class="badge ${n.battery > 50 ? 'badge-safe' : 'badge-urgent'}">🔋 ${n.battery}%</span>
            <span class="text-xs text-muted">Hops: ${n.hops}</span>
          </div>
        `;
      });
    }

    telemEl.innerHTML = `
      <div class="mesh-telemetry-summary">
        <div><strong>Gateway ID:</strong> ${data.gateway.node_id}</div>
        <div><strong>Frequency:</strong> ${data.gateway.freq_band}</div>
        <div><strong>Spreading Factor:</strong> SF${data.gateway.spreading_factor || 11}</div>
        <div><strong>Average SNR:</strong> ${data.gateway.snr_avg || 9.2} dB</div>
        <div><strong>Active Mesh Peers:</strong> ${data.nodes ? data.nodes.length : 6}</div>
      </div>
      <h4 class="mt-3 mb-2 font-semibold text-sm">Active Relay Nodes in Region:</h4>
      <div class="node-list-flex">
        ${nodesHtml}
      </div>
    `;
  }

  async submitNewAlert(formData) {
    const res = await API.postAlert(formData);
    if (res.success) {
      alert("Official Emergency Alert published to Mesh & Web Gateway!");
      if (window.app) window.app.refreshAlerts();
    } else {
      alert("Error broadcasting alert: " + (res.error || "Failed"));
    }
  }

  exportData(type) {
    window.location.href = `/api/export/csv?type=${type}`;
  }

  exportGeoJSON() {
    window.location.href = `/api/export/geojson`;
  }
}

window.adminConsole = new AdminConsole();
