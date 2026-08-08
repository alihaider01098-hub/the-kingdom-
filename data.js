/* ========== THE KINGDOM - Product Data ========== */
const DEFAULT_PRODUCTS = [
  { id: 1, name: "AMD Ryzen 7 7800X3D", brand: "AMD", category: "cpu", price: 359, oldPrice: 399, stock: 15, images: ["https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=450&fit=crop","https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=450&fit=crop"], desc: "8 أنوية / 16 خيط • 96MB Cache • أفضل معالج ألعاب في فئته", specs: ["Socket: AM5","Cores: 8/16","Boost: 5.0 GHz","TDP: 120W","Cache: 96MB"], badge: "جديد", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=Ryzen+7+7800X3D" },
  { id: 2, name: "AMD Ryzen 5 7600", brand: "AMD", category: "cpu", price: 189, oldPrice: 0, stock: 22, images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=450&fit=crop"], desc: "6 أنوية / 12 خيط • قيمة ممتازة للألعاب والعمل", specs: ["Socket: AM5","Cores: 6/12","Boost: 5.1 GHz","TDP: 65W"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Ryzen+5+7600" },
  { id: 3, name: "Intel Core i7-14700K", brand: "Intel", category: "cpu", price: 319, oldPrice: 379, stock: 10, images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=450&fit=crop"], desc: "20 نواة / 28 خيط • جيمنج + مونتاج احترافي", specs: ["Socket: LGA1700","Cores: 20/28","Boost: 5.6 GHz","TDP: 125W"], badge: "عرض", featured: true, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=i7-14700K" },
  { id: 4, name: "Intel Core i5-14600KF", brand: "Intel", category: "cpu", price: 229, oldPrice: 0, stock: 18, images: ["https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=450&fit=crop&sat=-40"], desc: "14 نواة • أداء قوي بسعر مناسب", specs: ["Socket: LGA1700","Cores: 14/20","Boost: 5.3 GHz","TDP: 125W"], badge: "", featured: false, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=i5-14600KF" },
  { id: 5, name: "RTX 4070 Super 12GB", brand: "NVIDIA", category: "gpu", price: 589, oldPrice: 649, stock: 8, images: ["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=450&fit=crop","https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=450&fit=crop"], desc: "1440p ممتاز • DLSS 3 • Ray Tracing", specs: ["VRAM: 12GB GDDR6X","CUDA: 7168","TDP: 220W"], badge: "جديد", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=RTX+4070+Super" },
  { id: 6, name: "RTX 4060 Ti 8GB", brand: "NVIDIA", category: "gpu", price: 389, oldPrice: 0, stock: 14, images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=450&fit=crop"], desc: "مثالي لـ 1080p/1440p • استهلاك منخفض", specs: ["VRAM: 8GB GDDR6","CUDA: 4352","TDP: 160W"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=RTX+4060+Ti" },
  { id: 7, name: "RX 7800 XT 16GB", brand: "AMD", category: "gpu", price: 479, oldPrice: 529, stock: 6, images: ["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=450&fit=crop&hue=20"], desc: "16GB VRAM • أداء قوي بسعر منافس", specs: ["VRAM: 16GB GDDR6","Stream Processors: 3840","TDP: 263W"], badge: "عرض", featured: true, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=RX+7800+XT" },
  { id: 8, name: "RTX 4090 24GB", brand: "NVIDIA", category: "gpu", price: 1599, oldPrice: 0, stock: 3, images: ["https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&h=450&fit=crop"], desc: "أقوى كرت شاشة • 4K Ultra", specs: ["VRAM: 24GB GDDR6X","CUDA: 16384","TDP: 450W"], badge: "", featured: true, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=RTX+4090" },
  { id: 9, name: "Corsair Vengeance 32GB 6000", brand: "Corsair", category: "ram", price: 109, oldPrice: 129, stock: 30, images: ["https://images.unsplash.com/photo-1562976540-1502c912fc12?w=600&h=450&fit=crop"], desc: "2x16GB DDR5 • CL30 • RGB", specs: ["Type: DDR5","Speed: 6000MHz","Latency: CL30","RGB: Yes"], badge: "عرض", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Corsair+Vengeance+32GB+6000" },
  { id: 10, name: "G.Skill Trident Z5 32GB 6400", brand: "G.Skill", category: "ram", price: 124, oldPrice: 0, stock: 20, images: ["https://images.unsplash.com/photo-1562976540-1502c912fc12?w=600&h=450&fit=crop&sat=-30"], desc: "أداء عالي للجيمنج والمونتاج", specs: ["Type: DDR5","Speed: 6400MHz","Capacity: 32GB"], badge: "جديد", featured: false, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=G.Skill+Trident+Z5+32GB" },
  { id: 11, name: "Kingston Fury Beast 16GB", brand: "Kingston", category: "ram", price: 42, oldPrice: 0, stock: 40, images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=450&fit=crop"], desc: "2x8GB DDR4 3200 • اقتصادي", specs: ["Type: DDR4","Speed: 3200MHz","Capacity: 16GB"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Kingston+Fury+16GB+3200" },
  { id: 12, name: "Corsair Dominator 64GB 6000", brand: "Corsair", category: "ram", price: 249, oldPrice: 0, stock: 7, images: ["https://images.unsplash.com/photo-1562976540-1502c912fc12?w=600&h=450&fit=crop&bri=-20"], desc: "2x32GB • للمحترفين", specs: ["Type: DDR5","Speed: 6000MHz","Capacity: 64GB"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Corsair+Dominator+64GB" },
  { id: 13, name: "Samsung 990 PRO 2TB", brand: "Samsung", category: "storage", price: 149, oldPrice: 179, stock: 25, images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=450&fit=crop"], desc: "NVMe • حتى 7450 MB/s", specs: ["Interface: PCIe 4.0","Read: 7450 MB/s","Capacity: 2TB"], badge: "جديد", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=Samsung+990+PRO+2TB" },
  { id: 14, name: "WD Black SN850X 1TB", brand: "WD", category: "storage", price: 89, oldPrice: 0, stock: 28, images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=450&fit=crop"], desc: "مصمم للجيمنج • سرعة عالية", specs: ["Interface: PCIe 4.0","Read: 7300 MB/s","Capacity: 1TB"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=WD+Black+SN850X+1TB" },
  { id: 15, name: "Crucial T500 1TB", brand: "Crucial", category: "storage", price: 79, oldPrice: 99, stock: 35, images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=450&fit=crop&sat=-40"], desc: "قيمة ممتازة • PCIe 4.0", specs: ["Interface: PCIe 4.0","Capacity: 1TB"], badge: "عرض", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Crucial+T500+1TB" },
  { id: 16, name: "Seagate Barracuda 4TB", brand: "Seagate", category: "storage", price: 75, oldPrice: 0, stock: 20, images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=450&fit=crop&bri=-30"], desc: "HDD • تخزين كبير للألعاب", specs: ["Type: HDD","RPM: 5400","Capacity: 4TB"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Seagate+4TB+Barracuda" },
  { id: 17, name: "MSI B650 Tomahawk WiFi", brand: "MSI", category: "mobo", price: 219, oldPrice: 0, stock: 12, images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=450&fit=crop"], desc: "AMD B650 • WiFi 6E", specs: ["Chipset: B650","Socket: AM5","WiFi: 6E","Form: ATX"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=MSI+B650+Tomahawk" },
  { id: 18, name: "ASUS ROG Strix X670E-F", brand: "ASUS", category: "mobo", price: 399, oldPrice: 449, stock: 5, images: ["https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=450&fit=crop"], desc: "فلاجشيب • PCIe 5.0", specs: ["Chipset: X670E","Socket: AM5","PCIe: 5.0","Form: ATX"], badge: "جديد", featured: true, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=ASUS+ROG+X670E" },
  { id: 19, name: "Gigabyte B760 Aorus Elite", brand: "Gigabyte", category: "mobo", price: 169, oldPrice: 0, stock: 15, images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=450&fit=crop&sat=-20"], desc: "Intel B760 • DDR5", specs: ["Chipset: B760","Socket: LGA1700","Form: ATX"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Gigabyte+B760+Aorus" },
  { id: 20, name: "MSI MPG Z790 Edge Ti", brand: "MSI", category: "mobo", price: 289, oldPrice: 0, stock: 9, images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=450&fit=crop"], desc: "Z790 • أوفركلوك", specs: ["Chipset: Z790","Socket: LGA1700","Form: ATX"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=MSI+Z790+Edge" },
  { id: 21, name: "Corsair RM850x 850W", brand: "Corsair", category: "psu", price: 139, oldPrice: 0, stock: 18, images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=450&fit=crop"], desc: "80+ Gold • Fully Modular", specs: ["Wattage: 850W","Cert: 80+ Gold","Modular: Full"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Corsair+RM850x" },
  { id: 22, name: "Seasonic Focus GX-750", brand: "Seasonic", category: "psu", price: 119, oldPrice: 139, stock: 16, images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=450&fit=crop"], desc: "80+ Gold • جودة يابانية", specs: ["Wattage: 750W","Cert: 80+ Gold","Modular: Full"], badge: "جديد", featured: false, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=Seasonic+Focus+GX-750" },
  { id: 23, name: "be quiet! Dark Power 12 1000W", brand: "be quiet!", category: "psu", price: 249, oldPrice: 0, stock: 4, images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=450&fit=crop&bri=-25"], desc: "80+ Platinum • شبه صامت", specs: ["Wattage: 1000W","Cert: 80+ Platinum"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=be+quiet+Dark+Power+1000W" },
  { id: 24, name: "EVGA 600W Bronze", brand: "EVGA", category: "psu", price: 55, oldPrice: 69, stock: 30, images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=450&fit=crop&sat=-50"], desc: "80+ Bronze • اقتصادي", specs: ["Wattage: 600W","Cert: 80+ Bronze"], badge: "عرض", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=EVGA+600W" },
  { id: 25, name: "Lian Li O11 Dynamic EVO", brand: "Lian Li", category: "case", price: 169, oldPrice: 0, stock: 11, images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=450&fit=crop"], desc: "Mid Tower • مثالي للـ RGB", specs: ["Form: Mid Tower","Material: Aluminum/Glass"], badge: "", featured: true, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Lian+Li+O11+Dynamic+EVO" },
  { id: 26, name: "NZXT H5 Flow RGB", brand: "NZXT", category: "case", price: 99, oldPrice: 119, stock: 14, images: ["https://images.unsplash.com/photo-1616587894289-86480e533129?w=600&h=450&fit=crop"], desc: "تبريد ممتاز • تصميم نظيف", specs: ["Form: Mid Tower","Airflow: High"], badge: "جديد", featured: false, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=NZXT+H5+Flow" },
  { id: 27, name: "Corsair 4000D Airflow", brand: "Corsair", category: "case", price: 94, oldPrice: 0, stock: 20, images: ["https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=450&fit=crop"], desc: "كلاسيكي موثوق", specs: ["Form: Mid Tower"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Corsair+4000D" },
  { id: 28, name: "Fractal Meshify 2", brand: "Fractal", category: "case", price: 149, oldPrice: 0, stock: 8, images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=450&fit=crop"], desc: "Full Tower • تبريد قوي", specs: ["Form: Full Tower"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Fractal+Meshify+2" },
  { id: 29, name: "PS5 Slim 1TB", brand: "Sony", category: "console", price: 449, oldPrice: 499, stock: 7, images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=450&fit=crop"], desc: "النسخة النحيفة • 1TB SSD", specs: ["Storage: 1TB SSD","4K: Yes","Ray Tracing: Yes"], badge: "جديد", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=PS5+Slim" },
  { id: 30, name: "Xbox Series X 1TB", brand: "Microsoft", category: "console", price: 499, oldPrice: 0, stock: 6, images: ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=450&fit=crop"], desc: "أقوى كونسول • 4K/120fps", specs: ["Storage: 1TB SSD","4K: Yes","FPS: 120"], badge: "", featured: true, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Xbox+Series+X" },
  { id: 31, name: "Xbox Series S 512GB", brand: "Microsoft", category: "console", price: 299, oldPrice: 349, stock: 12, images: ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=450&fit=crop&bri=20"], desc: "اقتصادي • ديجيتال فقط", specs: ["Storage: 512GB","Digital only"], badge: "عرض", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Xbox+Series+S" },
  { id: 32, name: "Nintendo Switch OLED", brand: "Nintendo", category: "console", price: 349, oldPrice: 0, stock: 10, images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=450&fit=crop"], desc: "شاشة OLED • محمول ومنزلي", specs: ["Screen: 7\" OLED","Storage: 64GB"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=Nintendo+Switch+OLED" },
  { id: 33, name: "Razer BlackWidow V4", brand: "Razer", category: "peripherals", price: 149, oldPrice: 0, stock: 15, images: ["https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=450&fit=crop"], desc: "كيبورد ميكانيكي • RGB", specs: ["Type: Mechanical","Switches: Green","RGB: Yes"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Razer+BlackWidow+V4" },
  { id: 34, name: "Logitech G Pro X Superlight 2", brand: "Logitech", category: "peripherals", price: 159, oldPrice: 179, stock: 11, images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=450&fit=crop"], desc: "ماوس خفيف • لاسلكي احترافي", specs: ["Weight: 60g","Wireless: Yes","Sensor: HERO 2"], badge: "جديد", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=G+Pro+X+Superlight+2" },
  { id: 35, name: "HyperX Cloud III", brand: "HyperX", category: "peripherals", price: 99, oldPrice: 0, stock: 20, images: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=450&fit=crop"], desc: "سماعة • صوت ممتاز وراحة طويلة", specs: ["Type: Over-ear","Mic: Yes"], badge: "", featured: false, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=HyperX+Cloud+III" },
  { id: 36, name: "Samsung Odyssey G5 27\"", brand: "Samsung", category: "peripherals", price: 229, oldPrice: 269, stock: 9, images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=450&fit=crop"], desc: "1440p • 165Hz • منحني", specs: ["Size: 27\"","Res: 1440p","Refresh: 165Hz"], badge: "عرض", featured: true, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Samsung+Odyssey+G5+27" },
  { id: 37, name: "Secretlab Titan Evo", brand: "Secretlab", category: "peripherals", price: 519, oldPrice: 0, stock: 4, images: ["https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&h=450&fit=crop"], desc: "كرسي جيمنج فاخر", specs: ["Material: Neo Hybrid","Lumbar: Yes"], badge: "", featured: false, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=Secretlab+Titan+Evo" },
  { id: 38, name: "HyperX QuadCast S", brand: "HyperX", category: "peripherals", price: 139, oldPrice: 0, stock: 13, images: ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=450&fit=crop"], desc: "مايك RGB للبث", specs: ["Type: Condenser","RGB: Yes","USB: Yes"], badge: "", featured: false, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=HyperX+QuadCast+S" },
  { id: 39, name: "مملكة المبتدئ", brand: "THE KINGDOM", category: "builds", price: 799, oldPrice: 899, stock: 5, images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&h=500&fit=crop"], desc: "تجميعة اقتصادية قوية: Ryzen 5 5600 + RTX 4060 + 16GB + 1TB", specs: ["CPU: Ryzen 5 5600","GPU: RTX 4060 8GB","RAM: 16GB DDR4","SSD: 1TB","PSU: 650W","Budget: Entry"], badge: "ENTRY", featured: true, bestseller: true, newArrival: false, link: "https://www.amazon.com/s?k=gaming+pc+rtx+4060" },
  { id: 40, name: "مملكة المحارب", brand: "THE KINGDOM", category: "builds", price: 1399, oldPrice: 0, stock: 4, images: ["https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=700&h=500&fit=crop"], desc: "تجميعة متوسطة: Ryzen 5 7600 + RTX 4070 Super + 32GB", specs: ["CPU: Ryzen 5 7600","GPU: RTX 4070 Super","RAM: 32GB DDR5","SSD: 2TB","PSU: 750W Gold","Budget: Mid"], badge: "MID", featured: true, bestseller: true, newArrival: true, link: "https://www.amazon.com/s?k=gaming+pc+rtx+4070" },
  { id: 41, name: "مملكة الفارس", brand: "THE KINGDOM", category: "builds", price: 2199, oldPrice: 2499, stock: 3, images: ["https://images.unsplash.com/photo-1625842268584-8f3296236761?w=700&h=500&fit=crop"], desc: "تجميعة عالية: 7800X3D + RTX 4080 Super + 32GB", specs: ["CPU: Ryzen 7 7800X3D","GPU: RTX 4080 Super","RAM: 32GB DDR5","SSD: 2TB 990 PRO","PSU: 850W","Budget: High"], badge: "HIGH", featured: true, bestseller: false, newArrival: false, link: "https://www.amazon.com/s?k=gaming+pc+rtx+4080" },
  { id: 42, name: "مملكة الملك", brand: "THE KINGDOM", category: "builds", price: 3899, oldPrice: 0, stock: 2, images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=700&h=500&fit=crop"], desc: "تجميعة فائقة: 7950X3D + RTX 4090 + 64GB", specs: ["CPU: Ryzen 9 7950X3D","GPU: RTX 4090 24GB","RAM: 64GB DDR5","SSD: 4TB","PSU: 1000W","Budget: Ultra"], badge: "ULTRA", featured: true, bestseller: false, newArrival: true, link: "https://www.amazon.com/s?k=gaming+pc+rtx+4090" },
];

const CATEGORIES = [
  { id: "all", name: "الكل", icon: "fa-border-all" },
  { id: "builds", name: "تجميعات", icon: "fa-desktop" },
  { id: "cpu", name: "معالجات", icon: "fa-microchip" },
  { id: "gpu", name: "كروت شاشة", icon: "fa-gamepad" },
  { id: "ram", name: "رامات", icon: "fa-memory" },
  { id: "storage", name: "تخزين", icon: "fa-hdd" },
  { id: "mobo", name: "مذربورد", icon: "fa-server" },
  { id: "psu", name: "بورسبلاي", icon: "fa-plug" },
  { id: "case", name: "كيسات", icon: "fa-box" },
  { id: "console", name: "كونسول", icon: "fa-tv" },
  { id: "peripherals", name: "ملحقات", icon: "fa-keyboard" },
  { id: "offers", name: "عروض", icon: "fa-tags" },
];


/* PC Builder slots */
const BUILDER_SLOTS = [
  { key: "cpu", name: "المعالج", icon: "fa-microchip", required: true },
  { key: "mobo", name: "المذربورد", icon: "fa-server", required: true },
  { key: "ram", name: "الرامات", icon: "fa-memory", required: true },
  { key: "gpu", name: "كرت الشاشة", icon: "fa-gamepad", required: false },
  { key: "storage", name: "التخزين", icon: "fa-hdd", required: true },
  { key: "psu", name: "البورسبلاي", icon: "fa-plug", required: true },
  { key: "case", name: "الكيس", icon: "fa-box", required: true },
];

const BUDGET_PRESETS = [
  { id: "budget", name: "اقتصادي", max: 700, color: "#2ecc71" },
  { id: "entry", name: "مبتدئ", max: 1000, color: "#3498db" },
  { id: "mid", name: "متوسط", max: 1600, color: "#f39c12" },
  { id: "high", name: "عالي", max: 2500, color: "#e74c3c" },
  { id: "ultra", name: "فائق", max: 5000, color: "#d4af37" },
];

const GAME_PROFILES = [
  { id: "esports", name: "ألعاب تنافسية (Valorant/CS)", minGpu: 200, targetFps: "240+ FPS" },
  { id: "aaa1080", name: "ألعاب AAA 1080p", minGpu: 350, targetFps: "100-144 FPS" },
  { id: "aaa1440", name: "ألعاب AAA 1440p", minGpu: 500, targetFps: "80-120 FPS" },
  { id: "aaa4k", name: "ألعاب 4K", minGpu: 1000, targetFps: "60 FPS" },
];


/* Bundles & Flash Sales */
const BUNDLES = [
  {
    id: "bundle-am5-start",
    name: "حزمة AM5 للبداية",
    desc: "Ryzen 5 7600 + B650 + 32GB DDR5",
    productIds: [2, 17, 9],
    discountPercent: 8,
    badge: "BUNDLE"
  },
  {
    id: "bundle-gpu-ram",
    name: "حزمة كرت + رام",
    desc: "RTX 4070 Super + 32GB DDR5",
    productIds: [5, 9],
    discountPercent: 5,
    badge: "BUNDLE"
  }
];

/* Flash sale ends in hours from now (client calculates) */
const FLASH_SALE_HOURS = 18;

const USD_TO_IQD = 1300;
const ADMIN_PASS = "kingdom2026"; // غيّر كلمة مرور الأدمن
const WHATSAPP = "9647000000000"; // رقم واتسابك

/* Supabase Config */
const SUPABASE_URL = "https://rfebkdpcevllzrkzowuo.supabase.co";
const SUPABASE_KEY = "sb_publishable_da09ug0Lsyl5RSz3IE9DTQ_fJzte00h";

