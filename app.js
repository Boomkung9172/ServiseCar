/**
 * FastFix Rescue - Emergency Roadside Assistance & Mechanic On-Demand
 * Logic: Distance calculations, Geolocation, Interactive Map, Filter by vehicle & towing,
 * Google Auth simulation, and Real-time Emergency Mechanic Dispatch.
 */

// Application State
const state = {
  userLocation: {
    lat: 13.7465,
    lng: 100.5348,
    name: "สยามสแควร์ / ปทุมวัน (พิกัดจำลอง)"
  },
  filters: {
    vehicle: 'all',      // 'all', 'car', 'motorcycle'
    towingOnly: false,   // true / false
    service: 'all',      // 'all', 'battery', 'tire', 'towing', 'engine', 'fuel', 'lock'
    search: '',
    sort: 'distance'     // 'distance' (nearest first), 'rating', 'price'
  },
  viewMode: 'both',      // 'both', 'list', 'map'
  currentUser: null,     // Logged in user data
  activeRequest: null,   // Active SOS dispatch
  selectedShop: null,
  map: null,
  userMarker: null,
  shopMarkers: [],
  mechanicMovingMarker: null,
  dispatchInterval: null
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  loadStoredUser();
  loadStoredRequest();
  initMap();
  setupEventListeners();
  renderApp();
  initGoogleSignIn();
});

// Load user from localStorage
function loadStoredUser() {
  const saved = localStorage.getItem("fastfix_user");
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
}

// Load active request from localStorage
function loadStoredRequest() {
  const saved = localStorage.getItem("fastfix_request");
  if (saved) {
    try {
      state.activeRequest = JSON.parse(saved);
      if (state.activeRequest && state.activeRequest.status !== 'completed') {
        resumeDispatchSimulation();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Save user to localStorage
function saveUser(user) {
  state.currentUser = user;
  if (user) {
    localStorage.setItem("fastfix_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("fastfix_user");
  }
  updateAuthUI();
}

// ================= GEOLOCATION & DISTANCE CALCULATIONS =================
// Haversine formula to calculate distance in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Get user real GPS or simulated
function detectUserLocation() {
  showToast("กำลังค้นหาพิกัด GPS ของคุณ...", "info");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userLocation.lat = position.coords.latitude;
        state.userLocation.lng = position.coords.longitude;
        state.userLocation.name = "พิกัดจริงจาก GPS ปัจจุบัน";
        updateLocationUI();
        updateMapUserPosition();
        renderApp();
        showToast("อัปเดตพิกัดตำแหน่งของคุณสำเร็จ!", "success");
      },
      (error) => {
        console.warn("Geolocation warning:", error.message);
        showToast("ไม่สามารถเข้าถึง GPS ได้ จึงใช้พิกัดจำลองใจกลางเมือง", "warning");
        updateLocationUI();
      },
      { timeout: 7000 }
    );
  } else {
    showToast("เบราว์เซอร์ไม่รองรับ GPS ใช้งานพิกัดจำลอง", "warning");
  }
}

function setPresetLocation(index) {
  const loc = PRESET_LOCATIONS[index];
  if (loc) {
    state.userLocation.lat = loc.lat;
    state.userLocation.lng = loc.lng;
    state.userLocation.name = loc.name;
    updateLocationUI();
    updateMapUserPosition();
    renderApp();
    closeAllModals();
    showToast(`เปลี่ยนพิกัดเป็น: ${loc.name} แล้ว`, "success");
  }
}

function updateLocationUI() {
  const locText = document.getElementById("navLocationText");
  const heroLocText = document.getElementById("heroCurrentLoc");
  if (locText) locText.textContent = state.userLocation.name;
  if (heroLocText) heroLocText.textContent = state.userLocation.name;
}

// ================= LEAFLET MAP INTEGRATION =================
function initMap() {
  const mapElement = document.getElementById("rescueMap");
  if (!mapElement) return;

  // Initialize leaflet map
  state.map = L.map("rescueMap", {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([state.userLocation.lat, state.userLocation.lng], 13);

  // Free OpenStreetMap Tiles with clean high contrast
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(state.map);

  updateMapUserPosition();
}

function updateMapUserPosition() {
  if (!state.map) return;

  if (state.userMarker) {
    state.map.removeLayer(state.userMarker);
  }

  // Create Custom User Location Marker (Pulse Pin)
  const userIcon = L.divIcon({
    className: "custom-leaflet-marker user-pin",
    html: '<i class="fa-solid fa-location-crosshairs" style="font-size:16px;"></i>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  state.userMarker = L.marker([state.userLocation.lat, state.userLocation.lng], { icon: userIcon })
    .addTo(state.map)
    .bindPopup(`
      <div style="font-family:'Prompt',sans-serif; text-align:center; padding:4px;">
        <b style="color:#EF4444;"><i class="fa-solid fa-user"></i> ตำแหน่งรถของคุณ</b>
        <p style="font-size:12px; margin:4px 0 0; color:#64748B;">${state.userLocation.name}</p>
      </div>
    `);

  state.map.panTo([state.userLocation.lat, state.userLocation.lng]);
}

function renderMapMarkers(shops) {
  if (!state.map) return;

  // Clear existing shop markers
  state.shopMarkers.forEach(m => state.map.removeLayer(m));
  state.shopMarkers = [];

  shops.forEach(shop => {
    let pinBg = "#2563EB"; // Car default
    let pinIcon = "fa-car";

    if (shop.towingService.available) {
      pinBg = "#F59E0B"; // Tow truck
      pinIcon = "fa-truck-pickup";
    } else if (shop.supportedVehicles.motorcycle && !shop.supportedVehicles.car) {
      pinBg = "#8B5CF6"; // Motorcycle only
      pinIcon = "fa-motorcycle";
    }

    const customIcon = L.divIcon({
      className: `custom-leaflet-marker shop-pin-${shop.id}`,
      html: `<div style="background:${pinBg}; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid ${pinIcon}" style="font-size:15px; color:#fff;"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([shop.lat, shop.lng], { icon: customIcon }).addTo(state.map);

    const vehicleTags = [];
    if (shop.supportedVehicles.car) vehicleTags.push("🚗 รถยนต์");
    if (shop.supportedVehicles.motorcycle) vehicleTags.push("🛵 รถเครื่อง");

    const towText = shop.towingService.available
      ? `<span style="color:#D97706; font-weight:600;"><i class="fa-solid fa-truck-pickup"></i> มีรถลาก/สไลด์</span>`
      : `<span style="color:#64748B;"><i class="fa-solid fa-circle-xmark"></i> ไม่มีรถลาก</span>`;

    const popupContent = `
      <div style="font-family:'Prompt',sans-serif; min-width:210px; padding:2px;">
        <div style="font-size:11px; color:#FF5A1F; font-weight:600;"><i class="fa-solid fa-route"></i> ห่างเพียง ${shop.distance.toFixed(1)} กม. (${shop.avgResponseMinutes} นาที)</div>
        <h4 style="font-family:'Kanit',sans-serif; margin:4px 0 2px; font-size:14px; color:#0F172A;">${shop.name}</h4>
        <div style="font-size:12px; margin-bottom:4px;">${towText}</div>
        <div style="font-size:11px; color:#475569; margin-bottom:8px;">${vehicleTags.join(" • ")}</div>
        <button onclick="requestEmergencyShop('${shop.id}')" style="width:100%; background:#FF5A1F; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
          <i class="fa-solid fa-truck-medical"></i> เรียกช่างร้านนี้
        </button>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on("click", () => {
      highlightShopCard(shop.id);
    });

    state.shopMarkers.push(marker);
  });
}

function highlightShopCard(shopId) {
  document.querySelectorAll(".shop-card").forEach(el => el.classList.remove("highlighted"));
  const targetCard = document.getElementById(`card-${shopId}`);
  if (targetCard) {
    targetCard.classList.add("highlighted");
    targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ================= FILTER & DATA COMPUTATION =================
function getProcessedShops() {
  // 1. Calculate distance for all shops
  let list = MOCK_SHOPS.map(shop => {
    const dist = calculateDistance(
      state.userLocation.lat,
      state.userLocation.lng,
      shop.lat,
      shop.lng
    );
    return {
      ...shop,
      distance: dist
    };
  });

  // 2. Filter by Vehicle Type (Requirement #6: รถยนต์ หรือ รถเครื่อง)
  if (state.filters.vehicle === 'car') {
    list = list.filter(s => s.supportedVehicles.car === true);
  } else if (state.filters.vehicle === 'motorcycle') {
    list = list.filter(s => s.supportedVehicles.motorcycle === true);
  }

  // 3. Filter by Towing Service (Requirement #6: มีรถลากมั้ย)
  if (state.filters.towingOnly) {
    list = list.filter(s => s.towingService.available === true);
  }

  // 4. Filter by specific Service
  if (state.filters.service !== 'all') {
    list = list.filter(s => s.services.some(srv => srv.id === state.filters.service));
  }

  // 5. Filter by Search Query
  if (state.filters.search.trim() !== '') {
    const q = state.filters.search.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.services.some(srv => srv.name.toLowerCase().includes(q))
    );
  }

  // 6. Sort: Nearest first (Requirement #5: หาร้านซ่อมรถใกล้ฉันมากที่สุด)
  if (state.filters.sort === 'distance') {
    list.sort((a, b) => a.distance - b.distance);
  } else if (state.filters.sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (state.filters.sort === 'response') {
    list.sort((a, b) => a.avgResponseMinutes - b.avgResponseMinutes);
  }

  return list;
}

// ================= RENDER SHOP CARDS =================
function renderApp() {
  const filteredShops = getProcessedShops();
  const container = document.getElementById("shopsListContainer");
  const countBadge = document.getElementById("shopCountBadge");

  if (countBadge) {
    countBadge.textContent = `พบ ${filteredShops.length} ร้านใกล้คุณ`;
  }

  if (!container) return;

  if (filteredShops.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass-location"></i>
        <h4>ไม่พบร้านซ่อมที่ตรงกับเงื่อนไข</h4>
        <p>ลองปรับตัวกรอง หรือขยายระยะการค้นหาดูใหม่อีกครั้ง</p>
        <button class="btn-locate-me" style="color:#0F172A; border-color:#CBD5E1; margin:0 auto;" onclick="resetFilters()">
          <i class="fa-solid fa-rotate-left"></i> ล้างตัวกรองทั้งหมด
        </button>
      </div>
    `;
    renderMapMarkers([]);
    return;
  }

  container.innerHTML = filteredShops.map(shop => {
    // Badges for supported vehicle (Requirement #6)
    const vehicleBadges = [];
    if (shop.supportedVehicles.car) {
      vehicleBadges.push(`<span class="badge-vehicle car"><i class="fa-solid fa-car"></i> รองรับรถยนต์</span>`);
    }
    if (shop.supportedVehicles.motorcycle) {
      vehicleBadges.push(`<span class="badge-vehicle bike"><i class="fa-solid fa-motorcycle"></i> รองรับรถเครื่อง</span>`);
    }

    // Badge for towing service (Requirement #6)
    let towBadge = "";
    if (shop.towingService.available) {
      const priceText = shop.towingService.startPrice ? ` (เริ่ม ฿${shop.towingService.startPrice.toLocaleString()})` : '';
      towBadge = `<span class="badge-tow has-tow"><i class="fa-solid fa-truck-pickup"></i> มีรถลาก/รถสไลด์${priceText}</span>`;
    } else {
      towBadge = `<span class="badge-tow no-tow"><i class="fa-solid fa-circle-xmark"></i> ไม่มีรถลาก (ช่างซ่อมหน้างาน)</span>`;
    }

    // Mini service tags
    const serviceBadges = shop.services.slice(0, 3).map(srv =>
      `<span class="service-mini-chip"><i class="fa-solid fa-check" style="color:#10B981;"></i> ${srv.name.split('/')[0]}</span>`
    ).join("");

    return `
      <article class="shop-card" id="card-${shop.id}">
        <div class="card-top">
          <div class="card-img-wrap">
            <img src="${shop.image}" alt="${shop.name}" loading="lazy">
            <div class="distance-pill">
              <i class="fa-solid fa-location-arrow"></i> ${shop.distance.toFixed(1)} กม.
            </div>
          </div>
          <div class="card-info">
            <div>
              <div class="card-title-row">
                <h4 class="card-title">${shop.name}</h4>
                <div class="rating-badge">
                  <i class="fa-solid fa-star"></i> ${shop.rating} (${shop.reviewCount})
                </div>
              </div>
              <div class="card-category">${shop.category}</div>
            </div>

            <div class="badge-row">
              ${vehicleBadges.join("")}
              ${towBadge}
            </div>

            <div class="open-status-row">
              <span class="open-dot ${shop.open24h ? 'open' : 'open'}"></span>
              <span style="font-weight:500; color:${shop.open24h ? '#10B981' : '#334155'};">${shop.openTimeText}</span>
              <span style="color:#94A3B8;">•</span>
              <span style="color:#64748B;"><i class="fa-regular fa-clock"></i> ถึงไวใน ~${shop.avgResponseMinutes} นาที</span>
            </div>
          </div>
        </div>

        <div class="card-services">
          <div class="service-chips-list">
            ${serviceBadges}
            ${shop.services.length > 3 ? `<span class="service-mini-chip" style="color:#64748B;">+${shop.services.length - 3} บริการ</span>` : ''}
          </div>
          ${shop.towingService.available ? `
            <div class="towing-detail-hint">
              <i class="fa-solid fa-info-circle"></i> ${shop.towingService.truckType}
            </div>
          ` : ''}
        </div>

        <div class="card-footer">
          <a href="tel:${shop.phone}" class="btn-call-shop" title="โทรหาช่างทันที">
            <i class="fa-solid fa-phone"></i> โทรด่วน
          </a>
          <button class="btn-request-shop" onclick="requestEmergencyShop('${shop.id}')">
            <i class="fa-solid fa-truck-medical"></i> เรียกช่างด่วน
          </button>
          <button class="btn-detail-shop" onclick="openShopDetails('${shop.id}')" title="ดูข้อมูลบริการและรีวิว">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </article>
    `;
  }).join("");

  renderMapMarkers(filteredShops);
}

function resetFilters() {
  state.filters.vehicle = 'all';
  state.filters.towingOnly = false;
  state.filters.service = 'all';
  state.filters.search = '';
  state.filters.sort = 'distance';

  document.querySelectorAll(".v-btn").forEach(b => b.classList.remove("active"));
  const allVBtn = document.querySelector(".v-btn[data-vehicle='all']");
  if (allVBtn) allVBtn.classList.add("active");

  const towBtn = document.getElementById("towToggleBtn");
  if (towBtn) towBtn.classList.remove("active");

  const searchInput = document.getElementById("shopSearchInput");
  if (searchInput) searchInput.value = '';

  document.querySelectorAll(".chip-btn").forEach(c => c.classList.remove("active"));
  const allChip = document.querySelector(".chip-btn[data-service='all']");
  if (allChip) allChip.classList.add("active");

  renderApp();
  showToast("รีเซ็ตตัวกรองแล้ว แสดงร้านทั้งหมดเรียงตามใกล้ที่สุด", "info");
}

// ================= SHOP DETAILS MODAL =================
function openShopDetails(shopId) {
  const shop = MOCK_SHOPS.find(s => s.id === shopId);
  if (!shop) return;

  state.selectedShop = shop;
  const modal = document.getElementById("shopDetailModal");
  const content = document.getElementById("shopDetailContent");

  const dist = calculateDistance(state.userLocation.lat, state.userLocation.lng, shop.lat, shop.lng);

  content.innerHTML = `
    <div style="margin-bottom:1.25rem;">
      <img src="${shop.image}" style="width:100%; height:200px; object-fit:cover; border-radius:12px; margin-bottom:1rem;" alt="${shop.name}">
      
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
        <div>
          <h3 style="font-size:1.4rem; color:#0F172A; margin-bottom:4px;">${shop.name}</h3>
          <p style="color:#64748B; font-size:0.9rem;"><i class="fa-solid fa-map-pin" style="color:#EF4444;"></i> ${shop.address}</p>
        </div>
        <div class="rating-badge" style="font-size:0.9rem; padding:4px 8px;">
          <i class="fa-solid fa-star"></i> ${shop.rating} (${shop.reviewCount} รีวิว)
        </div>
      </div>
    </div>

    <!-- Vehicle & Towing Details -->
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
      <h4 style="font-size:1rem; margin-bottom:0.75rem; color:#0F172A;"><i class="fa-solid fa-shield-halved" style="color:#FF5A1F;"></i> ข้อมูลประเภทยานพาหนะ & บริการรถลาก</h4>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">
        <div style="background:#fff; padding:0.75rem; border-radius:8px; border:1px solid #E2E8F0;">
          <div style="font-size:0.75rem; color:#64748B;">ประเภทยานพาหนะที่รองรับ</div>
          <div style="font-weight:600; margin-top:2px;">
            ${shop.supportedVehicles.car ? '<span style="color:#2563EB;">🚗 รถยนต์</span> ' : ''}
            ${shop.supportedVehicles.motorcycle ? '<span style="color:#8B5CF6;">🛵 รถเครื่อง</span>' : ''}
          </div>
        </div>

        <div style="background:#fff; padding:0.75rem; border-radius:8px; border:1px solid #E2E8F0;">
          <div style="font-size:0.75rem; color:#64748B;">บริการรถลาก / รถยก / รถสไลด์</div>
          <div style="font-weight:600; margin-top:2px; color:${shop.towingService.available ? '#D97706' : '#64748B'};">
            ${shop.towingService.available ? '🚚 มีบริการรถลาก/สไลด์' : '❌ ไม่มีรถลาก'}
          </div>
        </div>
      </div>

      ${shop.towingService.available ? `
        <div style="font-size:0.85rem; color:#92400E; background:#FEF3C7; padding:0.6rem 0.8rem; border-radius:8px; line-height:1.4;">
          <b><i class="fa-solid fa-truck"></i> ชนิดรถยก:</b> ${shop.towingService.truckType}<br>
          <b><i class="fa-solid fa-tag"></i> อัตราค่าบริการ:</b> เริ่มต้น ฿${shop.towingService.startPrice.toLocaleString()} บาท<br>
          <b><i class="fa-solid fa-circle-check"></i> หมายเหตุ:</b> ${shop.towingService.note}
        </div>
      ` : `
        <div style="font-size:0.85rem; color:#64748B; background:#F1F5F9; padding:0.6rem 0.8rem; border-radius:8px;">
          ${shop.towingService.note}
        </div>
      `}
    </div>

    <!-- Service Rates Table -->
    <div style="margin-bottom:1.5rem;">
      <h4 style="font-size:1rem; margin-bottom:0.75rem; color:#0F172A;"><i class="fa-solid fa-list-check" style="color:#FF5A1F;"></i> รายการบริการและราคาประเมิน</h4>
      <div style="border:1px solid #E2E8F0; border-radius:10px; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
          <tbody>
            ${shop.services.map(srv => `
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.65rem 0.9rem; font-weight:500;">${srv.name}</td>
                <td style="padding:0.65rem 0.9rem; text-align:right; color:#FF5A1F; font-weight:600;">${srv.price}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Contact & Action Buttons -->
    <div style="display:flex; gap:0.75rem;">
      <a href="tel:${shop.phone}" class="btn-call-shop" style="flex:1; padding:0.75rem; font-size:0.95rem;">
        <i class="fa-solid fa-phone"></i> โทรสายด่วน ${shop.phone}
      </a>
      <button class="btn-request-shop" onclick="closeAllModals(); requestEmergencyShop('${shop.id}');" style="flex:1.5; padding:0.75rem; font-size:1rem;">
        <i class="fa-solid fa-truck-medical"></i> เรียกช่างร้านนี้เลย
      </button>
    </div>
  `;

  openModal("shopDetailModal");
}

// ================= EMERGENCY SOS DISPATCH SYSTEM =================
function startQuickSOS() {
  openEmergencyModal(null);
}

function requestEmergencyShop(shopId) {
  openEmergencyModal(shopId);
}

function openEmergencyModal(preselectedShopId) {
  state.selectedShop = preselectedShopId ? MOCK_SHOPS.find(s => s.id === preselectedShopId) : null;
  const modal = document.getElementById("emergencyModal");
  const targetShopBanner = document.getElementById("targetShopNotice");

  if (targetShopBanner) {
    if (state.selectedShop) {
      targetShopBanner.innerHTML = `
        <div style="background:#FFF0EB; border:1px solid #FF7A00; color:#9A3412; padding:0.6rem 0.9rem; border-radius:8px; margin-bottom:1rem; font-size:0.85rem; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-solid fa-shop" style="font-size:1.1rem; color:#FF5A1F;"></i>
          <div>คุณกำลังเลือกเรียก: <b>${state.selectedShop.name}</b> (ระยะทาง ${calculateDistance(state.userLocation.lat, state.userLocation.lng, state.selectedShop.lat, state.selectedShop.lng).toFixed(1)} กม.)</div>
        </div>
      `;
    } else {
      targetShopBanner.innerHTML = `
        <div style="background:#EFF6FF; border:1px solid #3B82F6; color:#1E40AF; padding:0.6rem 0.9rem; border-radius:8px; margin-bottom:1rem; font-size:0.85rem; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-solid fa-radar" style="font-size:1.1rem; color:#2563EB;"></i>
          <div>ระบบจะทำการค้นหาและส่งคำขอไปยัง <b>ร้านซ่อมที่ใกล้ตำแหน่งคุณที่สุดอัตโนมัติ</b></div>
        </div>
      `;
    }
  }

  // Populate issues grid
  renderEmergencyIssueOptions();

  // If user is logged in, auto-fill
  if (state.currentUser) {
    const nameInput = document.getElementById("sosContactName");
    const phoneInput = document.getElementById("sosContactPhone");
    const plateInput = document.getElementById("sosVehiclePlate");
    if (nameInput && state.currentUser.name) nameInput.value = state.currentUser.name;
    if (phoneInput && state.currentUser.phone) phoneInput.value = state.currentUser.phone;
    if (plateInput && state.currentUser.vehiclePlate) plateInput.value = state.currentUser.vehiclePlate;
  }

  openModal("emergencyModal");
}

function renderEmergencyIssueOptions() {
  const container = document.getElementById("emergencyIssuesContainer");
  if (!container) return;

  container.innerHTML = EMERGENCY_ISSUES.map((issue, index) => `
    <div class="issue-card-option ${index === 0 ? 'selected' : ''}" data-id="${issue.id}" onclick="selectEmergencyIssue('${issue.id}')">
      <i class="fa-solid ${issue.icon}"></i>
      <h5>${issue.label}</h5>
      <p>${issue.desc}</p>
    </div>
  `).join("");
}

let selectedIssueId = "flat_tire";
function selectEmergencyIssue(issueId) {
  selectedIssueId = issueId;
  document.querySelectorAll(".issue-card-option").forEach(el => {
    el.classList.toggle("selected", el.dataset.id === issueId);
  });

  // Check if this issue typically needs tow truck
  const issue = EMERGENCY_ISSUES.find(i => i.id === issueId);
  const towCheckbox = document.getElementById("sosNeedTowTruck");
  if (towCheckbox && issue && issue.needTowTruck) {
    towCheckbox.checked = true;
  }
}

// Handle Form Submission for Emergency Dispatch
function submitEmergencyRequest(event) {
  event.preventDefault();

  const vehicleType = document.querySelector('input[name="sosVehicleType"]:checked')?.value || 'car';
  const vehiclePlate = document.getElementById("sosVehiclePlate").value.trim() || "ไม่ระบุ";
  const contactName = document.getElementById("sosContactName").value.trim() || (state.currentUser ? state.currentUser.name : "ผู้ขับขี่");
  const contactPhone = document.getElementById("sosContactPhone").value.trim() || (state.currentUser ? state.currentUser.phone : "081-000-0000");
  const needTow = document.getElementById("sosNeedTowTruck").checked;
  const remarks = document.getElementById("sosRemarks").value.trim();

  // Find suitable shop
  let targetShop = state.selectedShop;
  if (!targetShop) {
    // Select nearest shop that supports this vehicle and tow if needed
    const candidateShops = getProcessedShops().filter(s => {
      const matchVehicle = vehicleType === 'car' ? s.supportedVehicles.car : s.supportedVehicles.motorcycle;
      const matchTow = needTow ? s.towingService.available : true;
      return matchVehicle && matchTow;
    });

    targetShop = candidateShops.length > 0 ? candidateShops[0] : MOCK_SHOPS[0];
  }

  // Create request object
  const newRequest = {
    id: "REQ-" + Math.floor(100000 + Math.random() * 900000),
    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    vehicleType: vehicleType,
    vehiclePlate: vehiclePlate,
    contactName: contactName,
    contactPhone: contactPhone,
    needTow: needTow,
    remarks: remarks,
    issue: EMERGENCY_ISSUES.find(i => i.id === selectedIssueId) || EMERGENCY_ISSUES[0],
    shop: targetShop,
    status: 'searching', // 'searching' -> 'accepted' -> 'on_the_way' -> 'arrived'
    etaMinutes: targetShop.avgResponseMinutes || 15,
    mechanic: {
      name: "ช่างสมศักดิ์ สุขใจ",
      phone: targetShop.phone,
      carPlate: "1กข-9921 กทม.",
      serviceType: needTow ? "รถสไลด์ฉุกเฉิน 24 ชม." : "หน่วยช่างเคลื่อนที่เร็ว"
    }
  };

  state.activeRequest = newRequest;
  localStorage.setItem("fastfix_request", JSON.stringify(newRequest));

  closeAllModals();
  showToast("ส่งคำขอฉุกเฉินเรียบร้อย! กำลังเชื่อมต่อช่างซ่อม...", "success");

  // Show active request notification & live tracker
  renderActiveRequestBanner();
  openLiveTrackerModal();
  startDispatchSimulation();
}

// Live simulation of mechanic lifecycle
function startDispatchSimulation() {
  if (state.dispatchInterval) clearInterval(state.dispatchInterval);

  let step = 0;
  state.dispatchInterval = setInterval(() => {
    step++;

    if (step === 1) {
      state.activeRequest.status = 'accepted';
      localStorage.setItem("fastfix_request", JSON.stringify(state.activeRequest));
      renderActiveRequestBanner();
      updateLiveTrackerUI();
      showToast(`ช่างจาก "${state.activeRequest.shop.name}" ตอบรับงานแล้ว!`, "info");
    } else if (step === 2) {
      state.activeRequest.status = 'on_the_way';
      localStorage.setItem("fastfix_request", JSON.stringify(state.activeRequest));
      renderActiveRequestBanner();
      updateLiveTrackerUI();
      showToast("ช่างกำลังเดินทางมาหาคุณตามพิกัด GPS", "info");
      simulateMechanicOnMap();
    } else if (step >= 5) {
      state.activeRequest.status = 'arrived';
      localStorage.setItem("fastfix_request", JSON.stringify(state.activeRequest));
      renderActiveRequestBanner();
      updateLiveTrackerUI();
      showToast("ช่างมาถึงจุดเกิดเหตุเรียบร้อยแล้ว!", "success");
      clearInterval(state.dispatchInterval);
    }
  }, 4000);
}

function resumeDispatchSimulation() {
  renderActiveRequestBanner();
}

function cancelActiveRequest() {
  if (confirm("คุณต้องการยกเลิกการเรียกช่างฉุกเฉินนี้ใช่หรือไม่?")) {
    if (state.dispatchInterval) clearInterval(state.dispatchInterval);
    if (state.mechanicMovingMarker && state.map) {
      state.map.removeLayer(state.mechanicMovingMarker);
      state.mechanicMovingMarker = null;
    }
    state.activeRequest = null;
    localStorage.removeItem("fastfix_request");
    renderActiveRequestBanner();
    closeAllModals();
    showToast("ยกเลิกคำขอเรียกช่างเรียบร้อยแล้ว", "info");
  }
}

function renderActiveRequestBanner() {
  const banner = document.getElementById("activeRequestBanner");
  if (!banner) return;

  if (!state.activeRequest || state.activeRequest.status === 'completed') {
    banner.classList.remove("active");
    return;
  }

  banner.classList.add("active");
  const title = document.getElementById("arbStatusTitle");
  const desc = document.getElementById("arbStatusDesc");

  if (state.activeRequest.status === 'searching') {
    title.textContent = `🚨 กำลังส่งสัญญาณหาช่างที่ใกล้ที่สุด (${state.activeRequest.shop.name})`;
    desc.textContent = `ประเภทยานพาหนะ: ${state.activeRequest.vehicleType === 'car' ? 'รถยนต์' : 'รถเครื่อง'} • ${state.activeRequest.issue.label}`;
  } else if (state.activeRequest.status === 'accepted') {
    title.textContent = `✅ ช่างตอบรับแล้ว: ${state.activeRequest.mechanic.name}`;
    desc.textContent = `ร้าน: ${state.activeRequest.shop.name} • เบอร์ติดต่อ: ${state.activeRequest.mechanic.phone}`;
  } else if (state.activeRequest.status === 'on_the_way') {
    title.textContent = `🚗 ช่างกำลังเดินทางมาหาคุณ (~${state.activeRequest.etaMinutes} นาที)`;
    desc.textContent = `ทะเบียนรถช่าง: ${state.activeRequest.mechanic.carPlate} • ติดต่อ: ${state.activeRequest.mechanic.phone}`;
  } else if (state.activeRequest.status === 'arrived') {
    title.textContent = `🎉 ช่างถึงจุดเกิดเหตุเรียบร้อยแล้ว!`;
    desc.textContent = `กรุณาเปิดไฟฉุกเฉินและสังเกตรถช่างทะเบียน ${state.activeRequest.mechanic.carPlate}`;
  }
}

function openLiveTrackerModal() {
  if (!state.activeRequest) return;
  updateLiveTrackerUI();
  openModal("liveTrackerModal");
}

function updateLiveTrackerUI() {
  const req = state.activeRequest;
  if (!req) return;

  const content = document.getElementById("liveTrackerContent");
  if (!content) return;

  const isStep1 = true;
  const isStep2 = req.status === 'accepted' || req.status === 'on_the_way' || req.status === 'arrived';
  const isStep3 = req.status === 'on_the_way' || req.status === 'arrived';
  const isStep4 = req.status === 'arrived';

  content.innerHTML = `
    <div class="live-tracker-box">
      <div class="lt-status-header">
        <div>
          <span style="font-size:0.75rem; color:#94A3B8;">รหัสคำขอ: ${req.id}</span>
          <h4 style="font-size:1.15rem; color:#fff; margin-top:2px;">${req.shop.name}</h4>
        </div>
        <div class="lt-badge-live">
          <i class="fa-solid fa-satellite-dish"></i> LIVE STATUS
        </div>
      </div>

      <div class="lt-stepper">
        <div class="lt-step ${isStep1 ? (isStep2 ? 'done' : 'current') : ''}">
          <div class="lt-step-dot"></div>
          <div class="lt-step-title">1. ส่งคำขอเรียกช่างสำเร็จ</div>
          <div class="lt-step-time">เวลา ${req.timestamp} น. • แจ้งอาการ: ${req.issue.label}</div>
        </div>

        <div class="lt-step ${isStep2 ? (isStep3 ? 'done' : 'current') : ''}">
          <div class="lt-step-dot"></div>
          <div class="lt-step-title">2. ช่างรับเรื่องและจัดเตรียมอุปกรณ์</div>
          <div class="lt-step-time">${isStep2 ? 'ช่างตรวจสอบปัญหาและเตรียมชุดช่วยเหลือพร้อมออกเดินทาง' : 'กำลังรอช่างกดยืนยัน...'}</div>
        </div>

        <div class="lt-step ${isStep3 ? (isStep4 ? 'done' : 'current') : ''}">
          <div class="lt-step-dot"></div>
          <div class="lt-step-title">3. ช่างกำลังเดินทางมายังจุดเกิดเหตุ</div>
          <div class="lt-step-time">${isStep3 ? `ประเมินเวลาถึงประมาณ ${req.etaMinutes} นาที (ดูหมุดสดบนแผนที่)` : 'รอออกเดินทาง'}</div>
        </div>

        <div class="lt-step ${isStep4 ? 'done' : ''}">
          <div class="lt-step-dot"></div>
          <div class="lt-step-title">4. ช่างถึงจุดนัดหมายและเริ่มซ่อมแซม</div>
          <div class="lt-step-time">${isStep4 ? 'ช่างถึงที่หมายแล้ว กำลังตรวจสอบตัวรถ' : 'รอช่างมาถึง'}</div>
        </div>
      </div>

      <div class="mechanic-assigned-card">
        <div class="mac-info">
          <div class="mac-avatar">
            <i class="fa-solid fa-wrench"></i>
          </div>
          <div>
            <div style="font-size:0.75rem; color:#94A3B8;">ช่างผู้ดูแลคุณ</div>
            <h5 style="color:#fff; font-size:0.95rem;">${req.mechanic.name}</h5>
            <div style="font-size:0.78rem; color:#CBD5E1;">ทะเบียนรถช่าง: <b>${req.mechanic.carPlate}</b></div>
          </div>
        </div>
        <a href="tel:${req.mechanic.phone}" class="btn-call-shop" style="background:#FF5A1F; color:#fff; border:none; padding:0.5rem 0.9rem; font-size:0.85rem;">
          <i class="fa-solid fa-phone"></i> โทรหาช่าง
        </a>
      </div>

      <div style="margin-top:1.25rem; display:flex; justify-content:space-between; align-items:center;">
        <button class="btn-arb-cancel" onclick="cancelActiveRequest()">ยกเลิกคำขอ</button>
        <button class="btn-locate-me" style="font-size:0.85rem; padding:0.4rem 0.9rem;" onclick="closeAllModals()">
          <i class="fa-solid fa-map"></i> ดูตำแหน่งบนแผนที่
        </button>
      </div>
    </div>
  `;
}

function simulateMechanicOnMap() {
  if (!state.map || !state.activeRequest) return;

  const shop = state.activeRequest.shop;
  const user = state.userLocation;

  if (state.mechanicMovingMarker) {
    state.map.removeLayer(state.mechanicMovingMarker);
  }

  const mechIcon = L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background:#10B981; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #10B981; border:2px solid #fff;"><i class="fa-solid fa-truck-fast" style="color:#fff; font-size:16px;"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Start midway between shop and user
  const midLat = (shop.lat + user.lat) / 2;
  const midLng = (shop.lng + user.lng) / 2;

  state.mechanicMovingMarker = L.marker([midLat, midLng], { icon: mechIcon })
    .addTo(state.map)
    .bindPopup(`<b>ช่างกำลังมุ่งหน้ามาหาคุณ!</b><br>ทะเบียน ${state.activeRequest.mechanic.carPlate}`)
    .openPopup();
}

// ================= AUTHENTICATION (LOGIN / REGISTER / GOOGLE LOGIN) =================
function updateAuthUI() {
  const authContainer = document.getElementById("navAuthContainer");
  if (!authContainer) return;

  if (state.currentUser) {
    authContainer.innerHTML = `
      <div class="user-profile-badge" onclick="toggleUserDropdown()" title="ข้อมูลบัญชี">
        ${state.currentUser.avatar 
          ? `<img src="${state.currentUser.avatar}" class="user-avatar-img" alt="avatar">` 
          : `<div class="user-avatar-fallback">${state.currentUser.name ? state.currentUser.name.charAt(0) : 'U'}</div>`
        }
        <span style="font-size:0.85rem; font-weight:500;">${state.currentUser.name}</span>
        <i class="fa-solid fa-chevron-down" style="font-size:0.7rem; color:#94A3B8;"></i>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <button class="btn-auth" onclick="openAuthModal('login')">
        <i class="fa-regular fa-user"></i> เข้าสู่ระบบ / สมัครสมาชิก
      </button>
    `;
  }
}

function openAuthModal(mode = 'login') {
  switchAuthTab(mode);
  openModal("authModal");
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabBtnLogin");
  const tabRegister = document.getElementById("tabBtnRegister");

  const googleBtnText = document.getElementById("googleBtnText");
  const modalTitle = document.getElementById("authModalTitle");

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = "block";
    if (registerForm) registerForm.style.display = "none";
    if (tabLogin) tabLogin.classList.add("active");
    if (tabRegister) tabRegister.classList.remove("active");
    if (googleBtnText) googleBtnText.textContent = "เข้าสู่ระบบด้วย Google";
    if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-user-lock" style="color:#FF5A1F;"></i> เข้าสู่ระบบ';
  } else {
    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
    if (tabLogin) tabLogin.classList.remove("active");
    if (tabRegister) tabRegister.classList.add("active");
    if (googleBtnText) googleBtnText.textContent = "สมัครสมาชิกด้วย Google";
    if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-user-plus" style="color:#FF5A1F;"></i> สมัครสมาชิกใหม่';
  }
}

// Interactive helper for registration vehicle picker
function selectRegVehicle(type) {
  const cardCar = document.getElementById("cardRegCar");
  const cardBike = document.getElementById("cardRegBike");
  if (cardCar) cardCar.classList.toggle("selected", type === "car");
  if (cardBike) cardBike.classList.toggle("selected", type === "motorcycle");

  const radio = document.querySelector(`input[name="regVehicleChoice"][value="${type}"]`);
  if (radio) radio.checked = true;
}

// Password visibility toggle
function togglePasswordVisibility(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    iconEl.classList.remove("fa-eye");
    iconEl.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    iconEl.classList.remove("fa-eye-slash");
    iconEl.classList.add("fa-eye");
  }
}

// ================= REAL GOOGLE IDENTITY SERVICES (GIS) =================
// Client ID ที่คุณระบุสำหรับเชื่อมต่อบัญชี Google จริง
const GOOGLE_CLIENT_ID = "1059653477143-l97831c6jvl5hl3sle0epg8v94vrchkk.apps.googleusercontent.com";
let googleTokenClient = null;

function getGoogleClientId() {
  return localStorage.getItem("fastfix_google_client_id") || GOOGLE_CLIENT_ID;
}

function hasConfiguredGoogleClientId() {
  const cid = getGoogleClientId();
  return cid && cid.trim().length > 15 && cid.includes(".apps.googleusercontent.com");
}

function initGoogleSignIn() {
  updateGoogleConfigUI();

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
    // Retry when Google GIS script finishes loading
    setTimeout(initGoogleSignIn, 400);
    return;
  }

  const clientId = getGoogleClientId();

  try {
    // 1. Initialize Google Identity Services ID (JWT Credential)
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleRealGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // 2. Initialize OAuth 2.0 Token Client for Popup flow
    if (google.accounts.oauth2) {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
        callback: handleRealGoogleTokenResponse,
        error_callback: (err) => {
          console.warn("Google OAuth popup error:", err);
          if (err && err.type === "popup_closed") {
            showToast("หน้าต่าง Google Login ถูกปิดก่อนทำรายการ", "info");
          } else {
            showToast("แจ้งเตือน: อย่าลืมใส่ http://localhost:8080 ใน Authorized JavaScript origins ใน GCP", "warning");
          }
        }
      });
    }

    // Optional One-Tap prompt
    google.accounts.id.prompt();
  } catch (err) {
    console.warn("Notice during Google GIS init:", err);
  }
}

// Decode real Google JWT ID Token
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode error:", e);
    return null;
  }
}

// Callback when user signs in with Google ID token
function handleRealGoogleCredential(response) {
  if (response && response.credential) {
    const profile = decodeJwt(response.credential);
    if (profile) {
      const realUser = {
        name: profile.name || "ผู้ใช้ Google",
        email: profile.email || "google_user@gmail.com",
        avatar: profile.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        googleId: profile.sub,
        isGoogleAccount: true,
        vehiclePlate: "กท-5566 กทม.",
        vehicleType: "car",
        phone: "-"
      };
      saveUser(realUser);
      closeAllModals();
      showToast(`เข้าสู่ระบบด้วย Google จริงสำเร็จ! ยินดีต้อนรับคุณ ${realUser.name}`, "success");
    }
  }
}

// Callback for OAuth 2.0 Token Client popup response
async function handleRealGoogleTokenResponse(tokenResponse) {
  if (tokenResponse && tokenResponse.access_token) {
    try {
      showToast("กำลังเชื่อมต่อดึงข้อมูลบัญชี Google ของคุณ...", "info");
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const data = await res.json();
      if (data && (data.email || data.name)) {
        const realUser = {
          name: data.name || "ผู้ใช้ Google",
          email: data.email || "google_user@gmail.com",
          avatar: data.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          googleId: data.sub,
          isGoogleAccount: true,
          vehiclePlate: "กท-5566 กทม.",
          vehicleType: "car",
          phone: "-"
        };
        saveUser(realUser);
        closeAllModals();
        showToast(`เข้าสู่ระบบด้วย Google สำเร็จ! ยินดีต้อนรับคุณ ${realUser.name}`, "success");
        return;
      }
    } catch (err) {
      console.error("Userinfo fetch error:", err);
      showToast("ไม่สามารถดึงข้อมูลโปรไฟล์จาก Google ได้", "warning");
    }
  }
}

// Trigger Google Sign-In with either Real OAuth Popup or Configuration modal
function triggerGooglePopupLogin() {
  if (hasConfiguredGoogleClientId()) {
    if (googleTokenClient) {
      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    }
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
      return;
    }
  }

  // If user hasn't set their own Google Cloud Client ID yet, show configuration dialog
  openModal("googleConfigModal");
}

function saveGoogleClientIdConfig() {
  const input = document.getElementById("inputGoogleClientId");
  if (!input) return;
  const val = input.value.trim();

  if (!val) {
    showToast("กรุณากรอก Google Client ID", "warning");
    return;
  }

  localStorage.setItem("fastfix_google_client_id", val);
  initGoogleSignIn();
  showToast("บันทึก Google Client ID สำเร็จ! ระบบพร้อมเชื่อมต่อ", "success");
  closeAllModals();
}

function resetGoogleClientIdToDemo() {
  localStorage.removeItem("fastfix_google_client_id");
  const input = document.getElementById("inputGoogleClientId");
  if (input) input.value = GOOGLE_CLIENT_ID;
  initGoogleSignIn();
  showToast("รีเซ็ตเป็น Client ID ค่าเริ่มต้นแล้ว", "info");
}

function updateGoogleConfigUI() {
  const input = document.getElementById("inputGoogleClientId");
  const statusText = document.getElementById("cfgStatusText");
  const badge = document.getElementById("googleAuthStatusBadge");

  const current = getGoogleClientId();
  if (input) {
    input.value = current;
  }

  if (hasConfiguredGoogleClientId()) {
    if (statusText) statusText.innerHTML = '<span style="color:#10B981; font-weight:600;"><i class="fa-solid fa-circle-check"></i> เชื่อมต่อด้วย Client ID ของคุณแล้ว (' + current.slice(0, 15) + '...)</span>';
    if (badge) badge.innerHTML = '<span style="color:#10B981;"><i class="fa-solid fa-circle-check"></i> เชื่อมต่อ Google จริง</span>';
  } else {
    if (statusText) statusText.innerHTML = '<span style="color:#F59E0B;"><i class="fa-solid fa-triangle-exclamation"></i> ยังไม่ได้ระบุ Client ID ส่วนตัว (ใส่เพื่อเชื่อมต่อจริง 100%)</span>';
    if (badge) badge.innerHTML = '<span style="color:#F59E0B;"><i class="fa-solid fa-info-circle"></i> กดตั้งค่า Client ID สำหรับเว็บคุณ</span>';
  }
}

// Fallback Google Sign-In Simulation
function handleGoogleLogin() {
  triggerGooglePopupLogin();
}

function selectGoogleAccount(accountIndex) {
  const sampleAccounts = [
    {
      name: "ฐิตินันท์ สมชาย (Thitinan S.)",
      email: "thitinan.work@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      phone: "089-111-2233",
      vehiclePlate: "1กข-8899 กทม.",
      vehicleType: "car"
    },
    {
      name: "สมเกียรติ ยานยนต์ (Somkiat Y.)",
      email: "somkiat.auto@gmail.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      phone: "081-445-6677",
      vehiclePlate: "5ขค-3321 กทม.",
      vehicleType: "motorcycle"
    }
  ];

  const selected = sampleAccounts[accountIndex] || sampleAccounts[0];
  saveUser(selected);
  closeAllModals();
  showToast(`เข้าสู่ระบบด้วย Google สำเร็จ! ยินดีต้อนรับคุณ ${selected.name}`, "success");
}

function handleCustomLogin(e) {
  e.preventDefault();
  const emailOrPhone = document.getElementById("loginEmail").value.trim();
  const user = {
    name: emailOrPhone.includes("@") ? emailOrPhone.split("@")[0] : "ผู้ใช้งาน " + emailOrPhone.slice(-4),
    email: emailOrPhone.includes("@") ? emailOrPhone : emailOrPhone + "@user.fastfix.th",
    phone: emailOrPhone.includes("@") ? "089-999-8888" : emailOrPhone,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    vehiclePlate: "กข-1234 กทม.",
    vehicleType: "car"
  };

  saveUser(user);
  closeAllModals();
  showToast(`ยินดีต้อนรับกลับมาคุณ ${user.name}`, "success");
}

function handleCustomRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const vehicleType = document.querySelector('input[name="regVehicleChoice"]:checked')?.value || 'car';
  const vehiclePlate = document.getElementById("regVehiclePlate").value.trim() || "ไม่ระบุ";

  const newUser = {
    name: name,
    email: email,
    phone: phone,
    vehicleType: vehicleType,
    vehiclePlate: vehiclePlate,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
  };

  saveUser(newUser);
  closeAllModals();
  showToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับคุณ ${name}`, "success");
}

function toggleUserDropdown() {
  if (!state.currentUser) return;
  const modal = document.getElementById("userProfileModal");
  const content = document.getElementById("userProfileContent");

  content.innerHTML = `
    <div style="text-align:center; margin-bottom:1.5rem;">
      <img src="${state.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:3px solid #FF5A1F; margin-bottom:0.5rem;" alt="avatar">
      <h3 style="font-size:1.2rem; color:#0F172A;">${state.currentUser.name}</h3>
      <p style="color:#64748B; font-size:0.85rem;">${state.currentUser.email}</p>
    </div>

    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:1rem; margin-bottom:1.5rem; font-size:0.9rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
        <span style="color:#64748B;">เบอร์โทรศัพท์:</span>
        <b>${state.currentUser.phone || '-'}</b>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
        <span style="color:#64748B;">ประเภทยานพาหนะหลัก:</span>
        <b>${state.currentUser.vehicleType === 'motorcycle' ? '🛵 รถเครื่อง/มอเตอร์ไซค์' : '🚗 รถยนต์'}</b>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#64748B;">ทะเบียนรถที่บันทึก:</span>
        <b>${state.currentUser.vehiclePlate || '-'}</b>
      </div>
    </div>

    <button onclick="handleLogout()" style="width:100%; background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; padding:0.65rem; border-radius:8px; font-weight:600; cursor:pointer;">
      <i class="fa-solid fa-arrow-right-from-bracket"></i> ออกจากระบบ
    </button>
  `;

  openModal("userProfileModal");
}

function handleLogout() {
  saveUser(null);
  closeAllModals();
  showToast("ออกจากระบบเรียบร้อยแล้ว", "info");
}

// ================= MODAL HELPERS =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("open");
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "warning") icon = "fa-triangle-exclamation";
  if (type === "danger") icon = "fa-circle-exclamation";

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-msg">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= EVENT LISTENERS =================
function setupEventListeners() {
  // Vehicle Selector Buttons (Car / Motorcycle / All)
  document.querySelectorAll(".v-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".v-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filters.vehicle = btn.dataset.vehicle;
      renderApp();
    });
  });

  // Towing Service Quick Toggle
  const towToggle = document.getElementById("towToggleBtn");
  if (towToggle) {
    towToggle.addEventListener("click", () => {
      state.filters.towingOnly = !state.filters.towingOnly;
      towToggle.classList.toggle("active", state.filters.towingOnly);
      renderApp();
      showToast(state.filters.towingOnly ? "กรองเฉพาะร้านที่มีรถยก/รถสไลด์" : "แสดงร้านทั้งหมด", "info");
    });
  }

  // Service Chips
  document.querySelectorAll(".chip-btn").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.filters.service = chip.dataset.service;
      renderApp();
    });
  });

  // Search Input
  const searchInput = document.getElementById("shopSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value;
      renderApp();
    });
  }

  // Sort Select
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.filters.sort = e.target.value;
      renderApp();
    });
  }

  // View Switcher (Both / List / Map)
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.view;
      state.viewMode = mode;

      const mainWrapper = document.getElementById("mainWrapper");
      if (mainWrapper) {
        mainWrapper.className = `main-wrapper view-${mode === 'both' ? 'split' : mode + '-only'}`;
      }

      if (state.map) {
        setTimeout(() => state.map.invalidateSize(), 300);
      }
    });
  });

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  // Forms
  const loginForm = document.getElementById("loginFormElement");
  if (loginForm) loginForm.addEventListener("submit", handleCustomLogin);

  const regForm = document.getElementById("registerFormElement");
  if (regForm) regForm.addEventListener("submit", handleCustomRegister);

  const sosForm = document.getElementById("emergencySOSForm");
  if (sosForm) sosForm.addEventListener("submit", submitEmergencyRequest);
}
