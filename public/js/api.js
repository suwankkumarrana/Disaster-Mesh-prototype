/**
 * DisasterMesh API Client
 * Offline-first design: Reads from server with IndexedDB fallback.
 * Writes to local queue and broadcasts over Mesh if offline.
 */

const API = {
  async getStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Network error");
      return await res.json();
    } catch (e) {
      // Fallback offline approximation
      const pending = await window.localDB.getPendingSOSQueue();
      return {
        active_alerts: 3,
        pending_sos: pending.length,
        safe_count: 12,
        shelters_count: 7,
        shelter_capacity: 10400,
        shelter_occupancy: 4200,
        missing_persons: 2,
        available_volunteers: 3,
        mesh_packets_relayed: window.meshNode ? window.meshNode.packetHistory.length : 14,
        is_offline: true
      };
    }
  },

  async getAlerts() {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.alerts && window.localDB) {
        window.localDB.cacheItems("cached_alerts", data.alerts);
      }
      return data.alerts;
    } catch (e) {
      if (window.localDB) {
        const cached = await window.localDB.getCachedItems("cached_alerts");
        if (cached && cached.length > 0) return cached;
      }
      return [];
    }
  },

  async getResources(filterType = null, filterDistrict = null) {
    let url = "/api/resources?";
    if (filterType) url += `type=${encodeURIComponent(filterType)}&`;
    if (filterDistrict) url += `district=${encodeURIComponent(filterDistrict)}&`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.resources && window.localDB) {
        window.localDB.cacheItems("cached_resources", data.resources);
      }
      return data.resources;
    } catch (e) {
      if (window.localDB) {
        const cached = await window.localDB.getCachedItems("cached_resources");
        if (cached && cached.length > 0) {
          return cached.filter((r) => {
            if (filterType && r.type !== filterType) return false;
            if (filterDistrict && r.district !== filterDistrict) return false;
            return true;
          });
        }
      }
      return [];
    }
  },

  async getMissingPersons(type = null, searchQuery = null) {
    let url = "/api/missing?";
    if (type) url += `type=${encodeURIComponent(type)}&`;
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.registry && window.localDB) {
        window.localDB.cacheItems("cached_missing", data.registry);
      }
      return data.registry;
    } catch (e) {
      if (window.localDB) {
        const cached = await window.localDB.getCachedItems("cached_missing");
        if (cached && cached.length > 0) {
          return cached.filter((p) => {
            if (type && p.type !== type) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                     (p.last_seen_location && p.last_seen_location.toLowerCase().includes(q));
            }
            return true;
          });
        }
      }
      return [];
    }
  },

  async submitSOS(formData) {
    // Generate UUID if not present
    if (!formData.uuid) {
      formData.uuid = `sos-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`;
    }
    formData.mesh_node_origin = window.meshNode ? window.meshNode.nodeId : "WEB_CLIENT";
    formData.mesh_hops = 0;

    // 1. Immediately save to IndexedDB offline queue
    await window.localDB.saveSOS({ ...formData, synced: 0 });

    // 2. Broadcast via local Mesh P2P simulation
    if (window.meshNode) {
      window.meshNode.broadcastSOS(formData);
    }

    // 3. If online, transmit to central API
    if (navigator.onLine) {
      try {
        const res = await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const respData = await res.json();
          await window.localDB.markSOSSynced(formData.uuid);
          return { success: true, offline: false, ...respData };
        }
      } catch (e) {
        console.warn("[API] Network transmission failed, kept in offline mesh queue:", e);
      }
    }

    // Stored offline successfully
    return {
      success: true,
      offline: true,
      uuid: formData.uuid,
      message: "Stored in offline IndexedDB & broadcasting over local peer mesh."
    };
  },

  async submitMissing(formData) {
    try {
      const res = await fetch("/api/missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: "Network error, please retry when near a mesh relay." };
    }
  },

  async submitVolunteer(formData) {
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: "Network error, please retry when near a mesh relay." };
    }
  },

  async getMeshTelemetry() {
    try {
      const res = await fetch("/api/mesh/telemetry");
      return await res.json();
    } catch (e) {
      return {
        gateway: {
          node_id: window.meshNode ? window.meshNode.nodeId : "STANDALONE_NODE",
          freq_band: "865-867 MHz",
          active_nodes_count: 1
        },
        nodes: [],
        recent_packets: window.meshNode ? window.meshNode.packetHistory : []
      };
    }
  },

  async getSOSList(status = null, triage = null, district = null) {
    let url = "/api/sos?";
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (triage) url += `triage=${encodeURIComponent(triage)}&`;
    if (district) url += `district=${encodeURIComponent(district)}&`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.requests || [];
    } catch (e) {
      // Return unsynced local queue items if offline
      return await window.localDB.getPendingSOSQueue();
    }
  },

  async updateSOS(uuid, updateData) {
    const res = await fetch(`/api/sos/${uuid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });
    return await res.json();
  },

  async postAlert(alertData) {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData)
    });
    return await res.json();
  },

  async syncPendingQueue() {
    if (!navigator.onLine) return 0;
    const pending = await window.localDB.getPendingSOSQueue();
    let syncedCount = 0;

    for (const item of pending) {
      try {
        const res = await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          await window.localDB.markSOSSynced(item.uuid);
          syncedCount++;
        }
      } catch (e) {
        break; // Stop if network drops again
      }
    }
    return syncedCount;
  }
};

window.addEventListener("online", () => {
  console.log("[DisasterMesh] Back online! Triggering queue sync...");
  API.syncPendingQueue().then((count) => {
    if (count > 0) {
      console.log(`[DisasterMesh] Synced ${count} offline SOS requests to central rescue database.`);
    }
  });
});
