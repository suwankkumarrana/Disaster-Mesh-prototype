/**
 * DisasterMesh Multilingual Engine (i18n)
 * Supports English (en), Odia (or), and Hindi (hi).
 * Accessible, fast dictionary with real-time DOM translation.
 */

const I18N = {
  currentLang: localStorage.getItem("disaster_mesh_lang") || "en",

  translations: {
    en: {
      site_title: "DisasterMesh India",
      tagline: "Off-Grid Peer-to-Peer Emergency Communications Network",
      nav_home: "Overview & Hub",
      nav_sos: "Emergency SOS",
      nav_missing: "Missing Persons",
      nav_resources: "Shelters & Water",
      nav_alerts: "Live Alerts",
      nav_guides: "Mesh Setup & Guides",
      nav_volunteers: "Volunteers & Donors",
      nav_mesh: "Mesh Node Monitor",
      nav_admin: "Responders Dashboard",
      nav_drills: "Field Drills & Simulation",

      btn_text_mode: "Text-Only Mode",
      btn_rich_mode: "Standard Mode",
      btn_contrast: "High Contrast",
      status_mesh_active: "Local Mesh Relay Active",
      status_internet_connected: "Cell/Internet Connected",
      status_offline_mode: "Offline: Operating on Peer Mesh",

      banner_cyclone_alert: "CRITICAL: Severe Cyclone approaching coastal Bay of Bengal. Internet and cellular outages expected. DisasterMesh P2P relay operational.",

      // Home Hub
      hub_hero_title: "When Cell Towers & Power Fall, DisasterMesh Stays On.",
      hub_hero_desc: "A decentralized, off-grid communication hub designed for floods, cyclones, and earthquakes. Relays SOS beacons, connects relief shelters, and publishes life-saving instructions peer-to-peer using LoRa radios, Wi-Fi Direct, and browser mesh caches.",
      hub_btn_sos: "SEND EMERGENCY SOS",
      hub_btn_shelters: "Find Cyclone Shelters & Water",
      hub_btn_offline_kit: "Download Offline Kit (PDF/HTML)",
      hub_how_it_works: "How Disaster Mesh Works",
      hub_step1_title: "1. No Internet or SIM Card Needed",
      hub_step1_desc: "Your phone connects via Wi-Fi Direct, Bluetooth, or local battery-powered LoRa packet nodes (865 MHz) installed on panchayat rooftops and rescue boats.",
      hub_step2_title: "2. Peer-to-Peer Store & Forward",
      hub_step2_desc: "Emergency packets 'hop' from phone to phone and node to node until reaching a rescue team, satellite terminal, or relief camp gateway.",
      hub_step3_title: "3. Triage & Verified Rescues",
      hub_step3_desc: "NDRF, OSDMA, and volunteer boats view live priority queues with GPS coordinates, medical urgency, and family headcounts.",

      // Live Stats
      stat_active_alerts: "Active Official Alerts",
      stat_pending_sos: "Urgent SOS Dispatches",
      stat_shelter_capacity: "Shelter Capacity Available",
      stat_packets_relayed: "Mesh Packets Relayed",
      stat_active_nodes: "Active Mesh Nodes",

      // SOS Section
      sos_title: "Request Immediate Emergency Rescue or Aid",
      sos_subtitle: "This form works completely offline. If cell towers are down, your SOS is queued and broadcasted peer-to-peer across local mesh nodes.",
      form_full_name: "Full Name / Family Head",
      form_phone: "Mobile Number (if any)",
      form_people_count: "Number of People Trapped / In Need",
      form_status_label: "Immediate Emergency Status",
      form_status_trapped: "🚨 Trapped / Need Water Rescue (Boat Required)",
      form_status_medical: "🚑 Medical Emergency (Trauma, Elderly, Infant)",
      form_status_food_water: "💧 Starvation / No Drinking Water",
      form_status_safe: "✅ Safe / Evacuated to Safe Ground",
      form_triage_label: "Triage Priority Level",
      form_triage_urgent: "Critical / Life-Threatening (Immediate)",
      form_triage_high: "High (Within 3-6 Hours)",
      form_triage_moderate: "Moderate (Within 24 Hours)",
      form_location_btn: "📍 Get Exact GPS Coordinates",
      form_landmark: "Landmark / Village / House Description",
      form_district: "District / Region",
      form_needs_label: "Immediate Needs (Select all that apply)",
      need_boat: "Rescue Boat Needed",
      need_infant_food: "Baby Food / Milk",
      need_medicines: "Insulin / Essential Meds",
      need_drinking_water: "Clean Drinking Water",
      need_charging: "Phone / Radio Power",
      form_submit_sos: "TRANSMIT SOS OVER MESH",
      sos_offline_queued: "SOS stored locally in IndexedDB & relayed to neighbor mesh nodes!",
      sos_qr_code_btn: "Show Emergency QR Code for Responders",

      // Missing & Found Persons
      missing_title: "Missing & Found Persons Registry",
      missing_subtitle: "Compliant with India's DPDP Act 2023. Contact information is masked to protect citizen privacy during chaotic disaster environments.",
      btn_report_missing: "Report Missing Person",
      btn_report_found: "I Found Someone / Report Safe",
      search_placeholder: "Search by name, village, or shelter...",
      filter_all: "All Records",
      filter_missing: "Missing Only",
      filter_found: "Found / Sheltered",
      col_person_name: "Name",
      col_age_gender: "Age / Gender",
      col_last_seen: "Last Known Location / Shelter",
      col_contact: "Verified Contact (Masked)",
      col_status: "Status",

      // Resources & Shelters
      res_title: "Disaster Shelters, Hospitals & Water Points",
      res_subtitle: "Verified government and community shelters with solar backup, clean water, and VHF/Mesh radio communication.",
      btn_map_view: "Map View",
      btn_list_view: "Low-Bandwidth List View",
      filter_shelters: "Cyclone Shelters",
      filter_hospitals: "Hospitals & First Aid",
      filter_water: "Food & Water Points",
      filter_charging: "Solar & Mesh Radios",
      badge_capacity: "Capacity",
      badge_generator: "Solar/Gen Backup",
      badge_mesh_node: "Mesh Node Onsite",

      // Emergency Contacts
      contacts_title: "Verified Emergency Helplines & Radio Frequencies",
      contacts_subtitle: "Available via phone, HAM radio, and SMS fallback.",
      nat_disaster_helpline: "National Disaster Management (NDMA): 1078",
      state_disaster_helpline: "State Disaster Authority (OSDMA): 1070",
      nat_emergency: "National Emergency Number: 112",
      ambulance_helpline: "Ambulance Services: 108",
      fire_helpline: "Fire & Flood Rescue: 101",
      ham_freq_label: "Amateur HAM Radio Emergency Net: 144.500 MHz / 7.050 MHz HF",
      lora_freq_label: "DisasterMesh LoRa Frequency: 865.2 MHz (Bandwidth 250 kHz, SF11)",

      // Guides & Setup
      guides_title: "Offline Mesh Setup & Emergency Survival Handbook",
      guides_subtitle: "Downloadable guides and step-by-step hardware instructions to turn low-cost $5 ESP32 or LoRa boards into off-grid disaster communications relays.",

      // Legal & DPDP
      legal_title: "Privacy, Data Protection & Legal Notice",
      legal_dpdp: "Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act). Data collected is exclusively utilized for life-saving search, rescue, and relief operations under the emergency exemption provisions (Section 7). Phone numbers are masked and data will be permanently purged after the emergency phase.",
      btn_consent_accept: "I Understand & Consent",

      // Alerts
      alerts_title: "Official Disaster Announcements & Warnings",
      alerts_subtitle: "Synchronized from IMD, NDMA, and OSDMA control centers.",
      btn_trigger_alarm: "🔊 Play Audio Siren & Voice Broadcast",
      source_imd: "IMD Cyclone Warning",
      source_osdma: "OSDMA Flood Watch",
      source_ndma: "NDMA Advisory",

      // Admin & Responders
      admin_title: "Rescue Operations & District Admin Console",
      admin_pin_prompt: "Enter Responder Security PIN to access live triage & dispatch:",
      admin_btn_login: "Access Console",
      admin_export_csv: "Export CSV (NDRF)",
      admin_export_geojson: "Export GeoJSON (GIS Mapping)",
      admin_post_alert_title: "Broadcast New Official Emergency Alert",

      // Footer
      footer_text: "DisasterMesh India — Open Source Disaster Resilience Platform. Designed for zero-internet environments."
    },

    or: {
      site_title: "ଆପଦା ମେଶ୍ ଭାରତ (DisasterMesh)",
      tagline: "ଅଫ୍-ଗ୍ରୀଡ୍ ପିଅର-ଟୁ-ପିଅର ଜରୁରୀକାଳୀନ ଯୋଗାଯୋଗ ନେଟୱର୍କ",
      nav_home: "ମୁଖ୍ୟ ପୃଷ୍ଠା",
      nav_sos: "ଜରୁରୀ ଏସ୍.ଓ.ଏସ୍ (SOS)",
      nav_missing: "ନିଖୋଜ ବ୍ୟକ୍ତି ପଞ୍ଜିକା",
      nav_resources: "ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ ଓ ଜଳ",
      nav_alerts: "ଜରୁରୀ ଚେତାବନୀ",
      nav_guides: "ମେଶ୍ ସେଟଅପ୍ ଓ ଗାଇଡ୍",
      nav_volunteers: "ସ୍ୱେଚ୍ଛାସେବୀ ଓ ଦାନ",
      nav_mesh: "ମେଶ୍ ନୋଡ୍ ମନିଟର୍",
      nav_admin: "ପ୍ରଶାସନ ଓ ଉଦ୍ଧାରକାରୀ",
      nav_drills: "ଫିଲ୍ଡ ଟେଷ୍ଟିଂ ଓ ଡ୍ରିଲ୍",

      btn_text_mode: "କେବଳ ଟେକ୍ସଟ୍ ମୋଡ୍",
      btn_rich_mode: "ସାଧାରଣ ମୋଡ୍",
      btn_contrast: "ହାଇ କଣ୍ଟ୍ରାଷ୍ଟ୍",
      status_mesh_active: "ସ୍ଥାନୀୟ ମେଶ୍ ରିଲେ ସକ୍ରିୟ",
      status_internet_connected: "ମୋବାଇଲ୍ ନେଟୱର୍କ ସଂଯୋଗ ଅଛି",
      status_offline_mode: "ଅଫଲାଇନ୍: ପିଅର ମେଶ୍ ରେ କାର୍ଯ୍ୟ କରୁଛି",

      banner_cyclone_alert: "ଜରୁରୀ ସୂଚନା: ବଙ୍ଗୋପସାଗରରେ ଭୟଙ୍କର ବାତ୍ୟା ଲ୍ୟାଣ୍ଡଫଲ୍ ସମ୍ଭାବନା । ଇଣ୍ଟରନେଟ୍ ନଥିଲେ ମଧ୍ୟ ଆପଦା ମେଶ୍ କାମ କରିବ ।",

      hub_hero_title: "ଯେତେବେଳେ ମୋବାଇଲ୍ ଟାୱାର ଓ ବିଦ୍ୟୁତ ଠପ୍ ହୁଏ, ଆପଦା ମେଶ୍ ସାହାଯ୍ୟ କରେ ।",
      hub_hero_desc: "ବାତ୍ୟା, ବନ୍ୟା ଓ ଭୂମିକମ୍ପ ଭଳି ବିପର୍ଯ୍ୟୟ ସମୟରେ ବିନା ଇଣ୍ଟରନେଟ୍ ରେ ଫୋନ-ରୁ-ଫୋନ ମେଶ୍ ନେଟୱର୍କ, LoRa ରେଡିଓ ଏବଂ ୱାଇ-ଫାଇ ଡାଇରେକ୍ଟ ମାଧ୍ୟମରେ ଉଦ୍ଧାରକାରୀଙ୍କ ପାଖକୁ ବାର୍ତ୍ତା ପଠାନ୍ତୁ ।",
      hub_btn_sos: "ଜରୁରୀ ସହାୟତା (SOS) ପଠାନ୍ତୁ",
      hub_btn_shelters: "ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ ଓ ପାନୀୟ ଜଳ ଖୋଜନ୍ତୁ",
      hub_btn_offline_kit: "ଅଫଲାଇନ୍ ଗାଇଡ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
      hub_how_it_works: "ଆପଦା ମେଶ୍ କିପରି କାମ କରେ?",
      hub_step1_title: "୧. ଇଣ୍ଟରନେଟ୍ କିମ୍ବା ସିମ୍ କାର୍ଡ୍ ଆବଶ୍ୟକ ନାହିଁ",
      hub_step1_desc: "ଆପଣଙ୍କ ମୋବାଇଲ୍ ବ୍ଲୁଟୁଥ୍, ୱାଇ-ଫାଇ ଡାଇରେକ୍ଟ କିମ୍ବା ସ୍ଥାନୀୟ LoRa (865 MHz) ରେଡିଓ ନୋଡ୍ ସହିତ ସଂଯୋଗ ହୁଏ ।",
      hub_step2_title: "୨. ଫୋନ-ରୁ-ଫୋନ ବାର୍ତ୍ତା ରିଲେ (ହପ୍)",
      hub_step2_desc: "ଆପଣଙ୍କ ସହାୟତା ବାର୍ତ୍ତା ଗୋଟିଏ ଡିଭାଇସ୍ ରୁ ଅନ୍ୟ ଡିଭାଇସ୍ କୁ ଡେଇଁ ଡେଇଁ ରିଲିଫ୍ କ୍ୟାମ୍ପ୍ କିମ୍ବା ଉଦ୍ଧାରକାରୀ ବୋଟ୍ ପାଖରେ ପହଞ୍ଚିଥାଏ ।",
      hub_step3_title: "୩. ଜରୁରୀ ଉଦ୍ଧାର କାର୍ଯ୍ୟ",
      hub_step3_desc: "NDRF, ODRAF ଓ ସ୍ୱେଚ୍ଛାସେବୀମାନେ GPS ଲୋକେସନ୍ ଏବଂ ପରିବାରର ସଦସ୍ୟ ସଂଖ୍ୟା ଦେଖି ତୁରନ୍ତ ସହାୟତା ପ୍ରଦାନ କରନ୍ତି ।",

      stat_active_alerts: "ସକ୍ରିୟ ସରକାରୀ ଚେତାବନୀ",
      stat_pending_sos: "ଜରୁରୀ ଉଦ୍ଧାର ଆବେଦନ",
      stat_shelter_capacity: "ଆଶ୍ରୟସ୍ଥଳୀ କ୍ଷମତା",
      stat_packets_relayed: "ରିଲେ ହୋଇଥିବା ମେଶ୍ ପ୍ୟାକେଟ୍",
      stat_active_nodes: "ସକ୍ରିୟ ମେଶ୍ ନୋଡ୍",

      sos_title: "ଜରୁରୀକାଳୀନ ଉଦ୍ଧାର କିମ୍ବା ସହାୟତା ପାଇଁ ଆବେଦନ",
      sos_subtitle: "ଏହି ଫର୍ମଟି ସମ୍ପୂର୍ଣ୍ଣ ଅଫଲାଇନ୍ ରେ କାର୍ଯ୍ୟ କରେ । ନେଟୱର୍କ ନଥିଲେ ମଧ୍ୟ ସ୍ଥାନୀୟ ମେଶ୍ ନୋଡ୍ ମାଧ୍ୟମରେ ବାର୍ତ୍ତା ପହଞ୍ଚିବ ।",
      form_full_name: "ପୂରା ନାମ / ପରିବାର ମୁଖ୍ୟ",
      form_phone: "ମୋବାଇଲ୍ ନମ୍ବର (ଯଦି ଅଛି)",
      form_people_count: "ଫସି ରହିଥିବା ଲୋକଙ୍କ ସଂଖ୍ୟା",
      form_status_label: "ସହାୟତାର ପ୍ରକାର",
      form_status_trapped: "🚨 ପାଣିରେ ଫସି ରହିଛୁ / ଉଦ୍ଧାରକାରୀ ଡଙ୍ଗା (Boat) ଆବଶ୍ୟକ",
      form_status_medical: "🚑 ଚିକିତ୍ସା ସହାୟତା (ବୃଦ୍ଧ, ଶିଶୁ, ଗୁରୁତର ରୋଗୀ)",
      form_status_food_water: "💧 ଖାଦ୍ୟ ଓ ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ ଆବଶ୍ୟକ",
      form_status_safe: "✅ ଆମେ ସୁରକ୍ଷିତ ସ୍ଥାନକୁ ଆସିଯାଇଛୁ",
      form_triage_label: "ଜରୁରୀ ପ୍ରାଥମିକତା ସ୍ତର",
      form_triage_urgent: "ଅତି ଜରୁରୀ / ଜୀବନ ବିପଦ (ତୁରନ୍ତ)",
      form_triage_high: "ଉଚ୍ଚ (୩ ରୁ ୬ ଘଣ୍ଟା ମଧ୍ୟରେ)",
      form_triage_moderate: "ମଧ୍ୟମ (୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ)",
      form_location_btn: "📍 ସଠିକ୍ GPS ଲୋକେସନ୍ ଆଣନ୍ତୁ",
      form_landmark: "ଗ୍ରାମ / ୱାର୍ଡ / ନିକଟବର୍ତ୍ତୀ ଚିହ୍ନ (Landmark)",
      form_district: "ଜିଲ୍ଲା",
      form_needs_label: "ତୁରନ୍ତ ଆବଶ୍ୟକତା ଗୁଡ଼ିକ ଚୟନ କରନ୍ତୁ",
      need_boat: "ଉଦ୍ଧାରକାରୀ ଡଙ୍ଗା ଆବଶ୍ୟକ",
      need_infant_food: "ଶିଶୁ ଖାଦ୍ୟ / କ୍ଷୀର",
      need_medicines: "ଅତ୍ୟାବଶ୍ୟକ ଔଷଧ / ଇନସୁଲିନ୍",
      need_drinking_water: "ପିଇବା ପାଣି ପାଉଚ୍",
      need_charging: "ଫୋନ୍ / ବ୍ୟାଟେରୀ ଚାର୍ଜିଂ",
      form_submit_sos: "ମେଶ୍ ନେଟୱର୍କରେ SOS ପଠାନ୍ତୁ",
      sos_offline_queued: "ଆପଣଙ୍କ SOS ଅଫଲାଇନ୍ ରେ ସୁରକ୍ଷିତ ହୋଇ ପାଖ ମେଶ୍ ନୋଡ୍ କୁ ରିଲେ ହେଉଛି!",
      sos_qr_code_btn: "ଉଦ୍ଧାରକାରୀଙ୍କ ପାଇଁ ଜରୁରୀ QR କୋଡ୍ ଦେଖାନ୍ତୁ",

      missing_title: "ନିଖୋଜ ଓ ସୁରକ୍ଷିତ ବ୍ୟକ୍ତି ପଞ୍ଜିକା",
      missing_subtitle: "ଭାରତର DPDP ଆଇନ ୨୦୨୩ ଅନୁଯାୟୀ ସମ୍ପର୍କ ନମ୍ବର ସୁରକ୍ଷିତ ରଖାଯାଇଛି ।",
      btn_report_missing: "ନିଖୋଜ ବ୍ୟକ୍ତିଙ୍କ ବିବରଣୀ ଦିଅନ୍ତୁ",
      btn_report_found: "ମୁଁ କାହାକୁ ପାଇଛି / ସୁରକ୍ଷିତ ସୂଚନା",
      search_placeholder: "ନାମ, ଗାଁ କିମ୍ବା ଆଶ୍ରୟସ୍ଥଳୀ ଖୋଜନ୍ତୁ...",
      filter_all: "ସମସ୍ତ ତାଲିକା",
      filter_missing: "କେବଳ ନିଖୋଜ",
      filter_found: "ସୁରକ୍ଷିତ / ଆଶ୍ରୟସ୍ଥଳୀରେ",
      col_person_name: "ନାମ",
      col_age_gender: "ବୟସ / ଲିଙ୍ଗ",
      col_last_seen: "ଶେଷ ଥର ଦେଖାଯାଇଥିବା ସ୍ଥାନ / ଆଶ୍ରୟସ୍ଥଳୀ",
      col_contact: "ଯୋଗାଯୋଗ ନମ୍ବର (ସୁରକ୍ଷିତ)",
      col_status: "ସ୍ଥିତି",

      res_title: "ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ, ଡାକ୍ତରଖାନା ଓ ପାନୀୟ ଜଳ କେନ୍ଦ୍ର",
      res_subtitle: "ସୌର ବିଦ୍ୟୁତ, ପାନୀୟ ଜଳ ଏବଂ ରେଡିଓ ବାର୍ତ୍ତା ସୁବିଧା ଥିବା ସରକାରୀ ଆଶ୍ରୟସ୍ଥଳୀ ।",
      btn_map_view: "ମ୍ୟାପ୍ ଭ୍ୟୁ",
      btn_list_view: "ଲୋ-ବ୍ୟାଣ୍ଡୱିଡ୍ଥ୍ ତାଲିକା",
      filter_shelters: "ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀ",
      filter_hospitals: "ଡାକ୍ତରଖାନା ଓ ପ୍ରାଥମିକ ଚିକିତ୍ସା",
      filter_water: "ଜଳ ଓ ଖାଦ୍ୟ ବଣ୍ଟନ କେନ୍ଦ୍ର",
      filter_charging: "ସୌର ଚାର୍ଜିଂ ଓ ମେଶ୍ ରେଡିଓ",
      badge_capacity: "କ୍ଷମତା",
      badge_generator: "ସୌର/ଜେନେରେଟର ଅଛି",
      badge_mesh_node: "ମେଶ୍ ନୋଡ୍ ସଂଲଗ୍ନ",

      contacts_title: "ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ ଓ ରେଡିଓ ଫ୍ରିକ୍ୱେନ୍ସି",
      contacts_subtitle: "ଫୋନ୍ କଲ୍, HAM ରେଡିଓ ଏବଂ SMS ଜରିଆରେ ଉପଲବ୍ଧ ।",
      nat_disaster_helpline: "ଜାତୀୟ ବିପର୍ଯ୍ୟୟ ହେଲ୍ପଲାଇନ (NDMA): 1078",
      state_disaster_helpline: "ରାଜ୍ୟ ବିପର୍ଯ୍ୟୟ ପରିଚାଳନା (OSDMA): 1070",
      nat_emergency: "ଜରୁରୀ ସହାୟତା ନମ୍ବର: 112",
      ambulance_helpline: "ଆମ୍ବୁଲାନ୍ସ ସେବା: 108",
      fire_helpline: "ଅଗ୍ନିଶମ ଓ ବନ୍ୟା ଉଦ୍ଧାର: 101",
      ham_freq_label: "ଆମେଚର୍ HAM ରେଡିଓ ଫ୍ରିକ୍ୱେନ୍ସି: 144.500 MHz / 7.050 MHz HF",
      lora_freq_label: "ଆପଦା ମେଶ୍ LoRa ଫ୍ରିକ୍ୱେନ୍ସି: 865.2 MHz (SF11)",

      guides_title: "ଅଫଲାଇନ୍ ମେଶ୍ ସେଟଅପ୍ ଓ ଜରୁରୀକାଳୀନ ପୁସ୍ତିକା",
      guides_subtitle: "ବିନା ଇଣ୍ଟରନେଟ୍ ରେ ଫୋନ୍ ଏବଂ ଶସ୍ତା LoRa ବୋର୍ଡକୁ ଯୋଗାଯୋଗ ରିଲେ ରେ ପରିଣତ କରିବାର ନିର୍ଦ୍ଦେଶାବଳୀ ।",

      legal_title: "ଗୋପନୀୟତା, ତଥ୍ୟ ସୁରକ୍ଷା ଓ ଆଇନଗତ ସୂଚନା",
      legal_dpdp: "ଭାରତର ଡିଜିଟାଲ୍ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ସୁରକ୍ଷା ଆଇନ (DPDP Act, 2023) ର ଧାରା ୭ ଅଧୀନରେ କେବଳ ଜୀବନ ରକ୍ଷା ଓ ଉଦ୍ଧାର କାର୍ଯ୍ୟ ପାଇଁ ତଥ୍ୟ ବ୍ୟବହୃତ ହୁଏ । ଫୋନ୍ ନମ୍ବର ମାସ୍କିଂ କରାଯାଏ ।",
      btn_consent_accept: "ମୁଁ ବୁଝିଲି ଏବଂ ସହମତ",

      alerts_title: "ସରକାରୀ ବିପର୍ଯ୍ୟୟ ଘୋଷଣା ଓ ଚେତାବନୀ",
      alerts_subtitle: "IMD, NDMA ଏବଂ OSDMA କଣ୍ଟ୍ରୋଲ୍ ରୁମ୍ ରୁ ସିଧାସଳଖ ସୂଚନା ।",
      btn_trigger_alarm: "🔊 ସାଇରନ୍ ଏବଂ ଭଏସ୍ ଆଲର୍ଟ ବଜାନ୍ତୁ",
      source_imd: "IMD ବାତ୍ୟା ଚେତାବନୀ",
      source_osdma: "OSDMA ବନ୍ୟା ସତର୍କତା",
      source_ndma: "NDMA ଜାତୀୟ ପରାମର୍ଶ",

      admin_title: "ଉଦ୍ଧାର ଅଭିଯାନ ଓ ପ୍ରଶାସନ ଡ୍ୟାସବୋର୍ଡ୍",
      admin_pin_prompt: "ଲାଇଭ୍ ଡିସପ୍ୟାଚ୍ ଦେଖିବା ପାଇଁ ସିକ୍ୟୁରିଟି ପିନ୍ (PIN) ଦିଅନ୍ତୁ:",
      admin_btn_login: "ପ୍ରବେଶ କରନ୍ତୁ",
      admin_export_csv: "CSV ଡାଉନଲୋଡ୍ (NDRF)",
      admin_export_geojson: "GeoJSON ଡାଉନଲୋଡ୍ (GIS)",
      admin_post_alert_title: "ନୂତନ ସରକାରୀ ଚେତାବନୀ ଜାରି କରନ୍ତୁ",

      footer_text: "ଆପଦା ମେଶ୍ ଭାରତ — ବିପର୍ଯ୍ୟୟ ପ୍ରଶମନ ପାଇଁ ଏକ ମୁକ୍ତ ସ୍ରୋତ (Open Source) ଅଫଲାଇନ୍ ମଞ୍ଚ ।"
    },

    hi: {
      site_title: "आपदा मेश भारत (DisasterMesh)",
      tagline: "ऑफ-ग्रिड पीयर-टू-पीयर आपातकालीन संचार नेटवर्क",
      nav_home: "मुख्य पृष्ठ",
      nav_sos: "आपातकालीन SOS",
      nav_missing: "लापता व्यक्ति पंजी",
      nav_resources: "राहत शिविर एवं जल",
      nav_alerts: "लाइव अलर्ट",
      nav_guides: "मेश सेटअप एवं गाइड",
      nav_volunteers: "स्वयंसेवक एवं दान",
      nav_mesh: "मेश नोड मॉनिटर",
      nav_admin: "राहत दल एवं एडमिन",
      nav_drills: "फील्ड टेस्टिंग व ड्रिल",

      btn_text_mode: "केवल टेक्स्ट मोड",
      btn_rich_mode: "मानक मोड",
      btn_contrast: "हाई कंट्रास्ट",
      status_mesh_active: "स्थानीय मेश रिले सक्रिय",
      status_internet_connected: "मोबाइल नेटवर्क उपलब्ध",
      status_offline_mode: "ऑफलाइन: पीयर मेश पर संचालित",

      banner_cyclone_alert: "गंभीर चेतावनी: चक्रवात का खतरा। मोबाइल टॉवर ठप होने पर भी आपदा मेश पी2पी रिले सक्रिय रहेगा।",

      hub_hero_title: "जब सेल टॉवर और बिजली बंद हो जाए, तब भी आपदा मेश काम करता है।",
      hub_hero_desc: "बाढ़, चक्रवात और भूकंप में बिना इंटरनेट के फोन-टू-फोन मेश नेटवर्क, लोरा (LoRa) रेडियो और वाई-फाई डायरेक्ट से आपातकालीन संदेश और सहायता अनुरोध रिले करें।",
      hub_btn_sos: "आपातकालीन SOS भेजें",
      hub_btn_shelters: "चक्रवात आश्रय एवं पेयजल खोजें",
      hub_btn_offline_kit: "ऑफलाइन किट डाउनलोड करें",
      hub_how_it_works: "आपदा मेश कैसे काम करता है?",
      hub_step1_title: "1. इंटरनेट या सिम कार्ड की आवश्यकता नहीं",
      hub_step1_desc: "आपका फोन सीधे ब्लूटूथ, वाई-फाई डायरेक्ट या पंचायत छतों पर लगे लोरा रेडियो (865 MHz) से जुड़ता है।",
      hub_step2_title: "2. फोन-टू-फोन संदेश रिले (हॉप)",
      hub_step2_desc: "आपका संदेश एक डिवाइस से दूसरे डिवाइस तक कूदते हुए राहत कैंप या बचाव नाव तक पहुँचता है।",
      hub_step3_title: "3. त्वरित व प्राथमिक बचाव",
      hub_step3_desc: "एनडीआरएफ (NDRF) और बचाव दल जीपीएस लोकेशन और परिवार की संख्या देखकर तुरंत मदद पहुंचाते हैं।",

      stat_active_alerts: "सक्रिय आधिकारिक अलर्ट",
      stat_pending_sos: "लंबित आपातकालीन बचाव",
      stat_shelter_capacity: "उपलब्ध शिविर क्षमता",
      stat_packets_relayed: "रिले किए गए मेश पैकेट",
      stat_active_nodes: "सक्रिय मेश नोड",

      sos_title: "आपातकालीन बचाव या सहायता का अनुरोध",
      sos_subtitle: "यह फॉर्म पूरी तरह ऑफलाइन काम करता है। नेटवर्क न होने पर भी आपका संदेश मेश नोड्स के जरिए रिले होगा।",
      form_full_name: "पूरा नाम / परिवार का मुखिया",
      form_phone: "मोबाइल नंबर (यदि उपलब्ध हो)",
      form_people_count: "फंसे हुए लोगों की संख्या",
      form_status_label: "आपातकालीन स्थिति का प्रकार",
      form_status_trapped: "🚨 पानी में फंसे हैं / बचाव नाव (Boat) चाहिए",
      form_status_medical: "🚑 चिकित्सीय आपातकाल (वृद्ध, शिशु, गंभीर)",
      form_status_food_water: "💧 भुखमरी / पीने का पानी नहीं है",
      form_status_safe: "✅ सुरक्षित स्थान पर पहुंच गए हैं",
      form_triage_label: "प्राथमिकता स्तर (Triage)",
      form_triage_urgent: "अति आवश्यक / जीवन संकट (तत्काल)",
      form_triage_high: "उच्च (3 से 6 घंटे के भीतर)",
      form_triage_moderate: "मध्यम (24 घंटे के भीतर)",
      form_location_btn: "📍 सटीक जीपीएस (GPS) लोकेशन प्राप्त करें",
      form_landmark: "ग्राम / वार्ड / नजदीकी पहचान चिह्न (Landmark)",
      form_district: "जिला",
      form_needs_label: "तत्काल आवश्यकताएं (चुनें)",
      need_boat: "बचाव नाव की आवश्यकता",
      need_infant_food: "शिशु आहार / दूध",
      need_medicines: "आवश्यक दवाएं / इंसुलिन",
      need_drinking_water: "पेयजल पाउच",
      need_charging: "फोन / रेडियो चार्जिंग",
      form_submit_sos: "मेश पर SOS प्रसारित करें",
      sos_offline_queued: "आपका SOS स्थानीय रूप से सुरक्षित होकर पास के मेश नोड को रिले हो गया है!",
      sos_qr_code_btn: "बचाव दल के लिए आपातकालीन QR कोड दिखाएं",

      missing_title: "लापता एवं सुरक्षित व्यक्ति पंजी",
      missing_subtitle: "भारत के DPDP कानून 2023 के तहत संपर्क विवरण सुरक्षित व मास्क किए गए हैं।",
      btn_report_missing: "लापता व्यक्ति की सूचना दें",
      btn_report_found: "कोई व्यक्ति मिला / सुरक्षित रिपोर्ट करें",
      search_placeholder: "नाम, गांव या आश्रय स्थल से खोजें...",
      filter_all: "सभी रिकॉर्ड",
      filter_missing: "केवल लापता",
      filter_found: "सुरक्षित / आश्रय में",
      col_person_name: "नाम",
      col_age_gender: "उम्र / लिंग",
      col_last_seen: "अंतिम स्थान / वर्तमान आश्रय",
      col_contact: "सत्यापित संपर्क (मास्क किया हुआ)",
      col_status: "स्थिति",

      res_title: "चक्रवात राहत शिविर, अस्पताल एवं पेयजल केंद्र",
      res_subtitle: "सौर ऊर्जा, पेयजल और वीएचएफ/मेश रेडियो संचार से सुसज्जित आधिकारिक केंद्र।",
      btn_map_view: "मानचित्र दृश्य (Map)",
      btn_list_view: "लो-बैंडविड्थ सूची (List)",
      filter_shelters: "चक्रवात आश्रय स्थल",
      filter_hospitals: "अस्पताल एवं प्राथमिक चिकित्सा",
      filter_water: "राशन एवं पेयजल वितरण",
      filter_charging: "सोलर चार्जिंग व मेश रेडियो",
      badge_capacity: "क्षमता",
      badge_generator: "सोलर/जनरेटर बैकअप",
      badge_mesh_node: "मेश नोड ऑनसाइट",

      contacts_title: "सत्यापित आपातकालीन हेल्पलाइन एवं रेडियो फ्रीक्वेंसी",
      contacts_subtitle: "फोन, हैम रेडियो (HAM) और एसएमएस से संपर्क करें।",
      nat_disaster_helpline: "राष्ट्रीय आपदा प्रबंधन (NDMA): 1078",
      state_disaster_helpline: "राज्य आपदा प्रबंधन (OSDMA): 1070",
      nat_emergency: "राष्ट्रीय आपातकालीन नंबर: 112",
      ambulance_helpline: "एम्बुलेंस सेवा: 108",
      fire_helpline: "अग्निशमन एवं बाढ़ बचाव: 101",
      ham_freq_label: "हैम रेडियो (HAM) आपातकालीन फ्रीक्वेंसी: 144.500 MHz / 7.050 MHz HF",
      lora_freq_label: "आपदा मेश लोरा फ्रीक्वेंसी: 865.2 MHz (SF11)",

      guides_title: "ऑफलाइन मेश सेटअप एवं आपातकालीन हैंडबुक",
      guides_subtitle: "इंटरनेट न होने पर फोन और कम लागत वाले लोरा बोर्ड को रिले बनाने की पूरी गाइड।",

      legal_title: "गोपनीयता, डेटा संरक्षण और कानूनी सूचना",
      legal_dpdp: "भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDP Act) की धारा 7 के तहत आपातकालीन जीवन रक्षा के लिए डेटा संग्रहित किया जाता है। फोन नंबर मास्क किए जाते हैं।",
      btn_consent_accept: "मैं समझता हूँ और सहमत हूँ",

      alerts_title: "आधिकारिक आपदा चेतावनी एवं प्रसारण",
      alerts_subtitle: "आईएमडी, एनडीएमए और ओएसडीएमए नियंत्रण कक्ष से सत्यापित।",
      btn_trigger_alarm: "🔊 ऑडियो सायरन एवं वॉयस अलर्ट बजाएं",
      source_imd: "IMD चक्रवात चेतावनी",
      source_osdma: "OSDMA बाढ़ निगरानी",
      source_ndma: "NDMA राष्ट्रीय सलाह",

      admin_title: "बचाव अभियान एवं जिला प्रशासन कंसोल",
      admin_pin_prompt: "लाइव बचाव सूची देखने के लिए सुरक्षा पिन दर्ज करें:",
      admin_btn_login: "कंसोल खोलें",
      admin_export_csv: "CSV डाउनलोड (NDRF)",
      admin_export_geojson: "GeoJSON डाउनलोड (GIS)",
      admin_post_alert_title: "नया आधिकारिक आपातकालीन अलर्ट प्रसारित करें",

      footer_text: "आपदा मेश भारत — इंटरनेट विहीन आपदा क्षेत्रों के लिए ओपन सोर्स प्लेटफॉर्म।"
    }
  },

  t: function(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    // Fallback to English
    if (this.translations.en && this.translations.en[key]) {
      return this.translations.en[key];
    }
    return key;
  },

  setLanguage: function(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem("disaster_mesh_lang", lang);
      this.applyToDOM();
    }
  },

  applyToDOM: function() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.setAttribute("placeholder", translation);
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update html lang attribute
    document.documentElement.lang = this.currentLang;

    // Update active language button style
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      if (btn.getAttribute("data-lang") === this.currentLang) {
        btn.classList.add("active-lang");
      } else {
        btn.classList.remove("active-lang");
      }
    });
  }
};
