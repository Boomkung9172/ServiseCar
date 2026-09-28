// ข้อมูลร้านซ่อมรถและบริการช่วยเหลือฉุกเฉิน 24 ชั่วโมง
// มีทั้งข้อมูลบริการ รถลาก รองรับรถยนต์/รถเครื่อง พิกัด และเรตติ้ง

const MOCK_SHOPS = [
  {
    id: "shop-01",
    name: "ช่างเด่น เซอร์วิส ด่วน 24 ชม.",
    category: "อู่ซ่อมครบวงจร & นอกสถานที่",
    rating: 4.9,
    reviewCount: 184,
    phone: "089-123-4567",
    address: "ใกล้สยามสแควร์ ปทุมวัน กรุงเทพฯ",
    lat: 13.7465,
    lng: 100.5348,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: true,         // รองรับรถยนต์
      motorcycle: true   // รองรับรถเครื่อง/มอเตอร์ไซค์
    },
    towingService: {
      available: true,   // มีรถลาก/รถยก
      truckType: "รถสไลด์ถาดกองพื้น & รถยกไฮดรอลิก",
      startPrice: 1200,
      note: "ยกรถเก๋ง, SUV, บิ๊กไบค์ และเวสป้า ปลอดภัย 100%"
    },
    services: [
      { id: "battery", name: "พ่วงแบต / เปลี่ยนแบตนอกสถานที่", price: "เริ่มต้น 300 - 2,500 บาท" },
      { id: "tire", name: "ปะยางสตรีม / เติมลมไนโตรเจน / สลับยางอะไหล่", price: "เริ่มต้น 200 - 450 บาท" },
      { id: "towing", name: "รถยก / รถสไลด์ฉุกเฉิน", price: "เริ่มต้น 1,200 บาท" },
      { id: "engine", name: "ตรวจเช็คเครื่องยนต์ สตาร์ทไม่ติด ไดชาร์จ ไดสตาร์ท", price: "เริ่มต้น 500 บาท" },
      { id: "fuel", name: "ส่งน้ำมันฉุกเฉิน (เบนซิน/ดีเซล)", price: "ตามระยะทาง + ค่าน้ำมัน" }
    ],
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    tags: ["24ชม.", "มีรถสไลด์", "ซ่อมรถยนต์", "ซ่อมบิ๊กไบค์", "พ่วงแบต"],
    avgResponseMinutes: 15,
    featured: true
  },
  {
    id: "shop-02",
    name: "มิตรภาพการช่าง & รถยกด่วน",
    category: "ศูนย์ช่วยเหลือฉุกเฉิน & รถยกสไลด์",
    rating: 4.8,
    reviewCount: 220,
    phone: "081-998-7744",
    address: "ถนนพญาไท ราชเทวี กรุงเทพฯ",
    lat: 13.7532,
    lng: 100.5312,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: false  // ไม่รับรถเครื่อง
    },
    towingService: {
      available: true,
      truckType: "รถสไลด์องศาต่ำพิเศษ (เหมาะกับรถโหลดเตี้ย/ซูเปอร์คาร์)",
      startPrice: 1500,
      note: "มีประกันภัยคุ้มครองตัวรถระหว่างยกย้าย สูงสุด 2 ล้านบาท"
    },
    services: [
      { id: "towing", name: "รถสไลด์ออน 4 ล้อ / 6 ล้อ", price: "เริ่มต้น 1,500 บาท" },
      { id: "battery", name: "พ่วงแบตเตอรี่ฉุกเฉิน", price: "เริ่มต้น 350 บาท" },
      { id: "lock", name: "ปลดล็อคประตูกรณีกุญแจลืมในรถ", price: "เริ่มต้น 600 บาท" },
      { id: "tire", name: "เปลี่ยนยางอะไหล่ด่วน", price: "เริ่มต้น 300 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
    tags: ["เฉพาะรถยนต์", "รถสไลด์พรีเมียม", "24ชม.", "ประกันวงเงินสูง"],
    avgResponseMinutes: 12,
    featured: true
  },
  {
    id: "shop-03",
    name: "ช่างเอก มอเตอร์ไซค์ด่วน (ช่างสองล้อโมบาย)",
    category: "ผู้เชี่ยวชาญรถเครื่อง & บิ๊กไบค์นอกสถานที่",
    rating: 4.9,
    reviewCount: 312,
    phone: "086-554-3210",
    address: "ซอยเกษมสันต์ ถ.พระราม 1 กรุงเทพฯ",
    lat: 13.7489,
    lng: 100.5285,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: false,        // ไม่รับรถยนต์
      motorcycle: true   // เฉพาะรถเครื่อง/มอเตอร์ไซค์/บิ๊กไบค์
    },
    towingService: {
      available: true,
      truckType: "กระบะคอกยกรถมอเตอร์ไซค์ พร้อมแรมป์โหลดไฮดรอลิก",
      startPrice: 600,
      note: "บริการยกรถมอเตอร์ไซค์ทุกซีซี สกู๊ตเตอร์ ออโต้ บิ๊กไบค์ ไม่ล้มไม่เป็นรอย"
    },
    services: [
      { id: "tire", name: "ปะยางแทงหนอน / เปลี่ยนยางนอก-ใน นอกสถานที่", price: "เริ่มต้น 150 - 350 บาท" },
      { id: "battery", name: "พ่วงแบตมอเตอร์ไซค์ / เปลี่ยนแบตเจล", price: "เริ่มต้น 250 - 1,200 บาท" },
      { id: "belt", name: "สายพานขาด / โซ่หลุด / หัวเทียนบอด", price: "เริ่มต้น 350 บาท" },
      { id: "towing", name: "ยกรถมอเตอร์ไซค์เข้าศูนย์/อู่", price: "เริ่มต้น 600 บาท" },
      { id: "fuel", name: "น้ำมันหมด เติมน้ำมันถึงที่", price: "เริ่มต้น 150 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    tags: ["เฉพาะรถเครื่อง", "บิ๊กไบค์", "ปะยางถึงที่", "รถยกรถมอเตอร์ไซค์", "24ชม."],
    avgResponseMinutes: 10,
    featured: true
  },
  {
    id: "shop-04",
    name: "สปีดดี้ เรสคิว (Speedy Auto & Bike)",
    category: "ซ่อมด่วนเคลื่อนที่ รถเก๋ง-กระบะ-มอเตอร์ไซค์",
    rating: 4.7,
    reviewCount: 95,
    phone: "082-345-6789",
    address: "ถ.บรรทัดทอง แขวงวังใหม่ ปทุมวัน กรุงเทพฯ",
    lat: 13.7420,
    lng: 100.5228,
    open24h: false,
    openTimeText: "06:00 - 24:00 น.",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: true   // รถเครื่อง
    },
    towingService: {
      available: false,  // ไม่มีรถลาก (เน้นซ่อมจบหน้างาน)
      truckType: "ไม่มีรถลาก (ช่างซ่อมเคลื่อนที่เร็ว)",
      startPrice: null,
      note: "เน้นซ่อมจบหน้างาน กรณีต้องการรถลากทางร้านจะประสานงานพันธมิตรให้"
    },
    services: [
      { id: "battery", name: "บริการพ่วงแบตเตอรี่ / จั๊มสตาร์ททันใจ", price: "เริ่มต้น 250 บาท" },
      { id: "tire", name: "ปะยางรถเก๋ง / ปะยางมอเตอร์ไซค์", price: "เริ่มต้น 150 - 300 บาท" },
      { id: "coolant", name: "หม้อน้ำแห้ง ความร้อนขึ้น ไล่ระบบน้ำหล่อเย็น", price: "เริ่มต้น 400 บาท" },
      { id: "brake", name: "เช็คระบบเบรกล็อค น้ำมันเบรก", price: "เริ่มต้น 500 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
    tags: ["รถยนต์และรถเครื่อง", "ไม่มีรถลาก", "ซ่อมเร็ว", "ย่านบรรทัดทอง"],
    avgResponseMinutes: 14,
    featured: false
  },
  {
    id: "shop-05",
    name: "โมเดิร์นคาร์ ยาง & แบตเตอรี่เดลิเวอรี่",
    category: "เปลี่ยนยาง เปลี่ยนแบตเตอรี่ นอกสถานที่",
    rating: 4.9,
    reviewCount: 430,
    phone: "084-776-5544",
    address: "ถนนพระราม 4 แขวงลุมพินี ปทุมวัน กรุงเทพฯ",
    lat: 13.7310,
    lng: 100.5420,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: true   // รถเครื่อง
    },
    towingService: {
      available: true,
      truckType: "รถลากจูงล้อเสริม & รถสไลด์ 6 ล้อ",
      startPrice: 1300,
      note: "มีบริการรถยกสำหรับรถชน รถตกคูน้ำ และรถขับเคลื่อน 4 ล้อ"
    },
    services: [
      { id: "battery", name: "เปลี่ยนแบตเตอรี่ใหม่แกะกล่อง มีใบรับประกัน 1-2 ปี", price: "ตามรุ่นแบตเตอรี่ ฟรีค่าแรง" },
      { id: "tire", name: "เปลี่ยนยางใหม่ 4 เส้น หรือยางอะไหล่ด่วน", price: "ตามขนาดยาง" },
      { id: "towing", name: "รถยก-รถลาก กู้ซากรถฉุกเฉิน", price: "เริ่มต้น 1,300 บาท" },
      { id: "fuel", name: "บริการเติมน้ำมันฉุกเฉิน", price: "เริ่มต้น 200 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
    tags: ["24ชม.", "มีรถลาก", "แบตเตอรี่แท้", "รองรับรถยนต์/มอเตอร์ไซค์"],
    avgResponseMinutes: 18,
    featured: false
  },
  {
    id: "shop-06",
    name: "วิชัยเซอร์วิส พระราม 3 รถสไลด์ 24 ชม.",
    category: "รถสไลด์ออนมาตรฐาน & ซ่อมช่วงล่างเครื่องยนต์",
    rating: 4.8,
    reviewCount: 167,
    phone: "083-999-1122",
    address: "ถนนพระราม 3 ยานนาวา กรุงเทพฯ",
    lat: 13.7025,
    lng: 100.5360,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: true   // รถเครื่อง (บิ๊กไบค์)
    },
    towingService: {
      available: true,
      truckType: "รถสไลด์ถาดกองพื้น ไฮดรอลิกเต็มระบบ",
      startPrice: 1200,
      note: "ขนย้ายรถยนต์ทุกชนิด รถโหลดเตี้ย รถแข่ง และบิ๊กไบค์ขนาดใหญ่"
    },
    services: [
      { id: "towing", name: "รถสไลด์ด่วนในเขต กทม. และปริมณฑล", price: "เริ่มต้น 1,200 บาท" },
      { id: "engine", name: "ตรวจเช็คหม้อน้ำ ไดสตาร์ท ช่วงล่างหลุด", price: "เริ่มต้น 600 บาท" },
      { id: "battery", name: "พ่วงสตาร์ทฉุกเฉิน", price: "เริ่มต้น 300 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    tags: ["รถสไลด์มืออาชีพ", "24ชม.", "ยกรถบิ๊กไบค์", "ยกรถยนต์"],
    avgResponseMinutes: 20,
    featured: false
  },
  {
    id: "shop-07",
    name: "ช่างนพ ยางด่วน & มอเตอร์ไซค์กู้ภัย",
    category: "ปะยาง-เปลี่ยนยาง มอเตอร์ไซค์และรถเก๋ง",
    rating: 4.6,
    reviewCount: 88,
    phone: "085-321-7654",
    address: "ถนนเพชรบุรีตัดใหม่ มักกะสัน ราชเทวี",
    lat: 13.7508,
    lng: 100.5590,
    open24h: false,
    openTimeText: "07:00 - 23:00 น.",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: true   // รถเครื่อง
    },
    towingService: {
      available: false,  // ไม่มีรถลาก
      truckType: "ไม่มีรถลาก (เน้นทีมช่างมอเตอร์ไซค์เคลื่อนที่เร็ว)",
      startPrice: null,
      note: "หน่วยเคลื่อนที่เร็วด้วยมอเตอร์ไซค์ เข้าถึงจุดรถติดได้เร็วที่สุด"
    },
    services: [
      { id: "tire", name: "ปะยางสตรีม ปะยางไหม หนอนไหม", price: "เริ่มต้น 150 บาท" },
      { id: "battery", name: "จั๊มแบตเตอรี่ด่วน", price: "เริ่มต้น 250 บาท" },
      { id: "fuel", name: "ส่งน้ำมันฉุกเฉินกรณีน้ำมันหมดกลางทาง", price: "เริ่มต้น 150 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    tags: ["เข้าถึงไว", "ไม่มีรถลาก", "ปะยางรถเครื่อง", "ปะยางรถยนต์"],
    avgResponseMinutes: 9,
    featured: false
  },
  {
    id: "shop-08",
    name: "บางกอก กุญแจรถยนต์ & กล่องไฟ ด่วน",
    category: "ช่างกุญแจรถยนต์ ระบบรีโมท & กล่อง ECU",
    rating: 4.9,
    reviewCount: 260,
    phone: "087-456-7890",
    address: "ถนนสีลม บางรัก กรุงเทพฯ",
    lat: 13.7278,
    lng: 100.5280,
    open24h: true,
    openTimeText: "เปิดบริการ 24 ชั่วโมง",
    supportedVehicles: {
      car: true,         // รถยนต์
      motorcycle: true   // รถเครื่อง (สมาร์ทคีย์)
    },
    towingService: {
      available: false,  // ไม่มีรถลาก
      truckType: "ไม่มีรถลาก",
      startPrice: null,
      note: "ช่างเฉพาะทางเปิดล็อคและทำดอกกุญแจรีโมท / คีย์เลส / Immobilizer"
    },
    services: [
      { id: "lock", name: "เปิดประตูกรณีกุญแจล็อคในรถ (ไม่เกิดริ้วรอย)", price: "เริ่มต้น 500 บาท" },
      { id: "lock", name: "ทำดอกกุญแจฝังชิพ / สมาร์ทคีย์ / กุญแจบิ๊กไบค์", price: "เริ่มต้น 1,200 บาท" },
      { id: "battery", name: "พ่วงแบตเตอรี่ปลุกระบบรีโมท", price: "เริ่มต้น 300 บาท" }
    ],
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
    tags: ["ช่างกุญแจด่วน", "เปิดรถไม่เป็นรอย", "24ชม.", "รถยนต์และรถเครื่อง"],
    avgResponseMinutes: 16,
    featured: false
  }
];

// รายการปัญหาที่พบบ่อยสำหรับฟอร์มขอความช่วยเหลือฉุกเฉิน
const EMERGENCY_ISSUES = [
  { id: "flat_tire", icon: "fa-compact-disc", label: "ยางแบน / ยางแตก / ยางระเบิด", desc: "ต้องการปะยาง หรือเปลี่ยนยางอะไหล่", needTowTruck: false },
  { id: "dead_battery", icon: "fa-car-battery", label: "แบตหมด / สตาร์ทไม่ติด", desc: "ต้องการพ่วงแบต หรือเปลี่ยนแบตเตอรี่ใหม่", needTowTruck: false },
  { id: "overheating", icon: "fa-temperature-high", label: "ความร้อนขึ้น / หม้อน้ำแตก", desc: "เครื่องร้อน ควันขึ้น น้ำหล่อเย็นรั่ว", needTowTruck: true },
  { id: "accident_tow", icon: "fa-truck-pickup", label: "รถชน / ขยับไม่ได้ / เพลาหลุด (ต้องใช้รถลาก)", desc: "ต้องการรถสไลด์หรือรถยกด่วน", needTowTruck: true },
  { id: "lockout", icon: "fa-key", label: "ลืมกุญแจในรถ / ประตูล็อคเอง", desc: "ช่างสะเดาะกุญแจ ช่างกุญแจฝังชิพ", needTowTruck: false },
  { id: "out_of_fuel", icon: "fa-gas-pump", label: "น้ำมันหมดกลางทาง", desc: "ต้องการน้ำมันเบนซิน/ดีเซลฉุกเฉิน 5 ลิตร", needTowTruck: false },
  { id: "engine_breakdown", icon: "fa-wrench", label: "เครื่องดับสตาร์ทไม่ติด / สายพานขาด", desc: "ซ่อมเครื่องยนต์เบื้องต้น หรือยกรถเข้าอู่", needTowTruck: true }
];

// จุดอ้างอิงพิกัดจำลองยอดนิยมในกรณีที่ไม่สามารถเข้าถึง GPS จริง
const PRESET_LOCATIONS = [
  { name: "สยามสแควร์ / ปทุมวัน (จุดเริ่มต้นแนะนำ)", lat: 13.7465, lng: 100.5348 },
  { name: "อนุสาวรีย์ชัยสมรภูมิ", lat: 13.7649, lng: 100.5383 },
  { name: "แยกอโศก - สุขุมวิท", lat: 13.7371, lng: 100.5604 },
  { name: "ห้าแยกลาดพร้าว", lat: 13.8166, lng: 100.5614 },
  { name: "สี่แยกบางนา", lat: 13.6682, lng: 100.6047 },
  { name: "วงเวียนใหญ่ ธนบุรี", lat: 13.7262, lng: 100.4930 }
];
