/**
 * DisasterMesh P2P Simulation & Packet Relaying Engine
 * Simulates LoRa 865 MHz & Wi-Fi Direct broadcast channels.
 * Enables browser tabs and local network devices to act as store-and-forward mesh nodes.
 */

class MeshNetworkNode {
  constructor() {
    this.nodeId = localStorage.getItem("disaster_mesh_node_id") || this.generateNodeId();
    localStorage.setItem("disaster_mesh_node_id", this.nodeId);

    this.frequency = "865.200 MHz (India WPC ISM Band)";
    this.spreadingFactor = "SF11 (Long Range)";
    this.bandwidth = "250 kHz";
    this.txPower = "20 dBm (100 mW)";
    this.battery = 88;
    this.peers = new Set();
    this.packetHistory = [];
    this.onPacketReceivedCallbacks = [];

    // Setup Cross-Tab & Multi-Window P2P Broadcast Channel
    if (window.BroadcastChannel) {
      this.channel = new BroadcastChannel("disaster_mesh_p2p_channel");
      this.channel.onmessage = (event) => this.handleIncomingPacket(event.data);
    }

    // Ping peers periodically
    this.broadcastBeacon();
    setInterval(() => this.broadcastBeacon(), 15000);
  }

  generateNodeId() {
    const hex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, "0");
    return `NODE-CLI-${hex}`;
  }

  registerPacketListener(cb) {
    this.onPacketReceivedCallbacks.push(cb);
  }

  broadcastBeacon() {
    const beaconPacket = {
      packet_id: `BEACON-${this.nodeId.slice(-6)}-${Date.now()}`,
      packet_type: "BEACON",
      source_node: this.nodeId,
      destination_node: "BROADCAST",
      hop_count: 0,
      rssi: -72 - Math.floor(Math.random() * 15),
      snr: +(8.0 + Math.random() * 4).toFixed(1),
      battery: this.battery,
      timestamp: Math.floor(Date.now() / 1000)
    };
    this.sendRawPacket(beaconPacket, false);
  }

  broadcastSOS(sosData) {
    const packet = {
      packet_id: `PKT-SOS-${sosData.uuid ? sosData.uuid.slice(-6).toUpperCase() : Math.floor(Math.random()*10000)}`,
      packet_type: "SOS",
      source_node: this.nodeId,
      destination_node: "GATEWAY-CENTRAL",
      hop_count: 0,
      rssi: -68,
      snr: 10.4,
      payload: sosData,
      timestamp: Math.floor(Date.now() / 1000)
    };
    return this.sendRawPacket(packet, true);
  }

  sendRawPacket(packet, relayToServer = true) {
    // Record in local history
    this.packetHistory.unshift(packet);
    if (this.packetHistory.length > 50) this.packetHistory.pop();

    // Broadcast across local peers
    if (this.channel) {
      try {
        this.channel.postMessage(packet);
      } catch (e) {
        console.warn("[Mesh] Broadcast channel post error:", e);
      }
    }

    // Forward to Gateway API if network is available
    if (relayToServer && navigator.onLine) {
      fetch("/api/mesh/packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packet)
      }).catch(() => {
        console.log("[Mesh] Gateway unreachable, packet stored locally for mesh hop");
      });
    }

    return packet;
  }

  handleIncomingPacket(packet) {
    if (!packet || packet.source_node === this.nodeId) return;

    // Discover peer
    this.peers.add(packet.source_node);

    // Increment hop count
    const relayed = { ...packet, hop_count: (packet.hop_count || 0) + 1 };

    // Record in packet history
    this.packetHistory.unshift(relayed);
    if (this.packetHistory.length > 50) this.packetHistory.pop();

    // Notify listeners
    this.onPacketReceivedCallbacks.forEach((cb) => {
      try { cb(relayed); } catch (e) {}
    });

    console.log(`[Mesh Relay] Relayed packet ${packet.packet_id} from ${packet.source_node} (Hops: ${relayed.hop_count})`);
  }

  generateEmergencyPacketString(sos) {
    // Ultra-dense ASCII format for QR codes or SMS transmission
    const needs = Array.isArray(sos.needs_list) ? sos.needs_list.join(",") : "";
    return `DMESH*SOS*${sos.uuid}*${sos.triage.toUpperCase()}*P=${sos.people_count}*GPS=${sos.latitude},${sos.longitude}*LOC=${encodeURIComponent(sos.landmark)}*DIST=${encodeURIComponent(sos.district)}*NDS=${needs}`;
  }
}

window.meshNode = new MeshNetworkNode();
