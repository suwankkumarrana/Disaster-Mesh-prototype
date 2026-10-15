/**
 * DisasterMesh Map & Resource Locator Engine
 * Dual-Mode:
 * 1. Leaflet Interactive Map (when bandwidth permits)
 * 2. Ultra-Lightweight Vector Grid & Table View (for 2G / low-bandwidth / text-only mode)
 */

class ResourceMapManager {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.resources = [];
    this.currentViewMode = "map"; // "map" or "list"
    this.activeFilter = "all";
  }

  async init(containerId, listContainerId) {
    this.containerId = containerId;
    this.listContainerId = listContainerId;
    this.resources = await API.getResources();
    this.render();
  }

  setFilter(type) {
    this.activeFilter = type;
    this.render();
  }

  setViewMode(mode) {
    this.currentViewMode = mode;
    const mapEl = document.getElementById(this.containerId);
    const listEl = document.getElementById(this.listContainerId);

    if (mode === "list") {
      if (mapEl) mapEl.style.display = "none";
      if (listEl) listEl.style.display = "block";
    } else {
      if (mapEl) mapEl.style.display = "block";
      if (listEl) listEl.style.display = "block";
      this.initLeaflet();
    }
    this.render();
  }

  getFilteredResources() {
    if (this.activeFilter === "all") return this.resources;
    return this.resources.filter((r) => r.type === this.activeFilter);
  }

  initLeaflet() {
    if (this.map || typeof L === "undefined") return;

    const mapEl = document.getElementById(this.containerId);
    if (!mapEl) return;

    // Centered around coastal Odisha / Bay of Bengal disaster zone (Puri/Cuttack/Bhubaneswar)
    this.map = L.map(this.containerId).setView([20.25, 86.15], 9);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors | DisasterMesh"
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
  }

  render() {
    const filtered = this.getFilteredResources();
    this.renderList(filtered);

    // If map is active and Leaflet is loaded
    if (this.currentViewMode === "map" && typeof L !== "undefined" && this.map) {
      this.renderMarkers(filtered);
    }
  }

  renderMarkers(items) {
    if (!this.markersGroup) return;
    this.markersGroup.clearLayers();

    const colors = {
      shelter: "#2563eb",
      hospital: "#dc2626",
      water_food: "#059669",
      charging_mesh: "#d97706"
    };

    items.forEach((item) => {
      const color = colors[item.type] || "#4b5563";
      const markerHtml = `
        <div style="background:${color}; width:24px; height:24px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">
          ${item.type === "shelter" ? "S" : item.type === "hospital" ? "+" : item.type === "water_food" ? "W" : "M"}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-mesh-pin",
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const lang = I18N.currentLang;
      const title = lang === "or" ? item.name_or : (lang === "hi" ? item.name_hi : item.name_en);

      const occupancyPct = item.capacity > 0 ? Math.round((item.current_occupancy / item.capacity) * 100) : 0;

      const popupContent = `
        <div style="font-family:sans-serif; min-width:210px; color:#1e293b;">
          <h4 style="margin:0 0 4px; font-size:14px; font-weight:700;">${title}</h4>
          <p style="margin:0 0 6px; font-size:12px; color:#64748b;">📍 ${item.district} | ${item.address || ""}</p>
          <div style="font-size:12px; margin-bottom:6px;">
            <strong>Capacity:</strong> ${item.current_occupancy} / ${item.capacity} (${occupancyPct}% full)
            <div style="background:#e2e8f0; height:6px; border-radius:3px; margin-top:3px; overflow:hidden;">
              <div style="background:${occupancyPct > 80 ? '#dc2626' : '#16a34a'}; width:${occupancyPct}%; height:100%;"></div>
            </div>
          </div>
          <div style="font-size:11px; display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px;">
            ${item.has_generator ? '<span style="background:#dbeafe; color:#1e40af; padding:2px 5px; border-radius:3px;">⚡ Solar/Gen</span>' : ''}
            ${item.has_medical ? '<span style="background:#fee2e2; color:#991b1b; padding:2px 5px; border-radius:3px;">🏥 Medical</span>' : ''}
            ${item.has_mesh_relay ? '<span style="background:#fef3c7; color:#92400e; padding:2px 5px; border-radius:3px;">📻 Mesh LoRa</span>' : ''}
          </div>
          ${item.helpline ? `<a href="tel:${item.helpline.split('/')[0].trim()}" style="display:inline-block; background:#b91c1c; color:#fff; text-decoration:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold;">📞 Call ${item.helpline}</a>` : ''}
        </div>
      `;

      L.marker([item.latitude, item.longitude], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(this.markersGroup);
    });
  }

  renderList(items) {
    const listEl = document.getElementById(this.listContainerId);
    if (!listEl) return;

    if (items.length === 0) {
      listEl.innerHTML = `<div class="p-4 text-center text-muted">No shelters or resources found matching this filter.</div>`;
      return;
    }

    const lang = I18N.currentLang;

    let html = `
      <div class="resource-grid">
    `;

    items.forEach((item) => {
      const title = lang === "or" ? item.name_or : (lang === "hi" ? item.name_hi : item.name_en);
      const occupancyPct = item.capacity > 0 ? Math.round((item.current_occupancy / item.capacity) * 100) : 0;

      let typeBadge = "";
      if (item.type === "shelter") typeBadge = `<span class="badge badge-shelter">Cyclone Shelter</span>`;
      else if (item.type === "hospital") typeBadge = `<span class="badge badge-hospital">Hospital / Trauma</span>`;
      else if (item.type === "water_food") typeBadge = `<span class="badge badge-water">Drinking Water & Food</span>`;
      else typeBadge = `<span class="badge badge-mesh">Solar Charging & Mesh Radio</span>`;

      let supplies = "";
      if (Array.isArray(item.supplies_available)) {
        supplies = item.supplies_available.slice(0, 3).join(", ");
      }

      html += `
        <div class="resource-card">
          <div class="card-header-row">
            <div>
              ${typeBadge}
              <h3 class="resource-card-title">${title}</h3>
            </div>
            <span class="district-pill">${item.district}</span>
          </div>

          <p class="resource-address">📍 ${item.address || "District Administration Site"}</p>

          ${item.capacity > 0 ? `
            <div class="occupancy-section">
              <div class="occupancy-label">
                <span>Capacity: <strong>${item.current_occupancy} / ${item.capacity}</strong></span>
                <span>${occupancyPct}% Full</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${occupancyPct > 80 ? 'fill-red' : 'fill-green'}" style="width: ${occupancyPct}%;"></div>
              </div>
            </div>
          ` : ''}

          ${supplies ? `<p class="supplies-text"><strong>Supplies:</strong> ${supplies}</p>` : ''}

          <div class="amenities-row">
            ${item.has_generator ? '<span class="amenity-tag">⚡ Solar/Gen Backup</span>' : ''}
            ${item.has_medical ? '<span class="amenity-tag">🏥 First Aid Post</span>' : ''}
            ${item.has_mesh_relay ? '<span class="amenity-tag">📻 LoRa Mesh Node (865 MHz)</span>' : ''}
          </div>

          <div class="card-actions-row">
            ${item.helpline ? `<a href="tel:${item.helpline.split('/')[0].trim()}" class="btn btn-call">📞 Helpline: ${item.helpline}</a>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="alert('Coordinates: ${item.latitude}, ${item.longitude}\\nSave these coordinates in offline GPS app.')">📌 GPS: ${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    listEl.innerHTML = html;
  }
}

window.resourceMapManager = new ResourceMapManager();
