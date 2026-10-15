/**
 * DisasterMesh IndexedDB Offline Store
 * Guaranteed local persistence when internet, cell towers, and power fail.
 */

const DB_NAME = "DisasterMeshLocalStore";
const DB_VERSION = 2;

class OfflineDB {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains("sos_queue")) {
          const sosStore = db.createObjectStore("sos_queue", { keyPath: "uuid" });
          sosStore.createIndex("synced", "synced", { unique: false });
          sosStore.createIndex("created_at", "created_at", { unique: false });
        }

        if (!db.objectStoreNames.contains("cached_alerts")) {
          db.createObjectStore("cached_alerts", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("cached_resources")) {
          db.createObjectStore("cached_resources", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("cached_missing")) {
          db.createObjectStore("cached_missing", { keyPath: "uuid" });
        }

        if (!db.objectStoreNames.contains("mesh_telemetry")) {
          db.createObjectStore("mesh_telemetry", { keyPath: "packet_id" });
        }
      };

      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      req.onerror = (e) => {
        console.error("[IndexedDB] Error initializing database:", e);
        reject(e);
      };
    });
  }

  async saveSOS(sosRecord) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("sos_queue", "readwrite");
      const store = tx.objectStore("sos_queue");
      sosRecord.synced = sosRecord.synced || 0;
      sosRecord.created_at = sosRecord.created_at || Math.floor(Date.now() / 1000);
      const req = store.put(sosRecord);

      req.onsuccess = () => resolve(sosRecord);
      req.onerror = (e) => reject(e);
    });
  }

  async getPendingSOSQueue() {
    await this.ready;
    return new Promise((resolve) => {
      const tx = this.db.transaction("sos_queue", "readonly");
      const store = tx.objectStore("sos_queue");
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list.filter((item) => item.synced === 0));
      };
      req.onerror = () => resolve([]);
    });
  }

  async markSOSSynced(uuid) {
    await this.ready;
    return new Promise((resolve) => {
      const tx = this.db.transaction("sos_queue", "readwrite");
      const store = tx.objectStore("sos_queue");
      const getReq = store.get(uuid);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.synced = 1;
          store.put(item);
        }
        resolve(true);
      };
      getReq.onerror = () => resolve(false);
    });
  }

  async cacheItems(storeName, items) {
    await this.ready;
    if (!Array.isArray(items) || items.length === 0) return;
    const tx = this.db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    items.forEach((item) => store.put(item));
  }

  async getCachedItems(storeName) {
    await this.ready;
    return new Promise((resolve) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }
}

window.localDB = new OfflineDB();
