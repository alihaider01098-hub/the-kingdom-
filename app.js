/* ========== THE KINGDOM v2 App ========== */
let PRODUCTS = [];
let cart = [];
let favorites = [];

// حماية الكود من الانهيار إذا كانت الذاكرة المحلية للمتصفح تالفة
try { cart = JSON.parse(localStorage.getItem("tk_cart") || "[]"); } catch(e) {}
try { favorites = JSON.parse(localStorage.getItem("tk_favs") || "[]"); } catch(e) {}

let currentCategory = "all";
let searchQuery = "";
let brandFilter = "all";
let stockFilter = "all";
let offerOnly = false;
let minPrice = 0, maxPrice = 99999;
let sortBy = "default";
let currentView = "home";
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. تجهيز الواجهة وإخفاء شاشة التحميل فوراً
  loadTheme();
  hideLoader();
  bindGlobal();

  // 2. تحميل البيانات المحلية (بدون انتظار الإنترنت) لكي تظهر المنتجات فوراً
  loadProductsLocally();
  handleRoute();
  
  if (!window._boundHash) {
    window.addEventListener("hashchange", handleRoute);
    window._boundHash = true;
  }

  // 3. الاتصال بقاعدة البيانات في الخلفية لتحديث المنتجات إن لزم الأمر
  setTimeout(() => {
    initSupabase();
    if (supabaseClient) {
      seedSupabaseIfEmpty().catch(e => console.warn(e));
      supabaseClient.from("products").select("*").order("id").then(({ data, error }) => {
        if (!error && data && data.length) {
          PRODUCTS = data.map(mapFromDb);
          localStorage.setItem("tk_products", JSON.stringify(PRODUCTS));
          if (currentView === "home") renderProducts(); // تحديث المنتجات بصمت
        }
      }).catch(e => console.warn("Supabase background sync failed", e));
    }
  }, 1500);
});

let supabaseClient = null;

// دالة مخصصة للتحميل المحلي الفوري وتصحيح الذاكرة
function loadProductsLocally() {
  // 1. مسح الذاكرة المعطوبة وإجبار الموقع على قراءة المنتجات الأساسية من ملف data.js
  if (typeof DEFAULT_PRODUCTS !== "undefined") {
    PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem("tk_products", JSON.stringify(PRODUCTS)); // تحديث الذاكرة بنسخة سليمة
  } else {
    console.error("تحذير: ملف data.js غير متصل أو لم يتم تحميله!");
  }
}


function mapFromDb(row) {
  return {
    id: Number(row.id),
    name: row.name,
    brand: row.brand || "Unknown",
    category: row.category || "peripherals",
    price: Number(row.price) || 0,
    oldPrice: Number(row.old_price) || 0,
    stock: Number(row.stock) || 0,
    images: row.images && row.images.length ? row.images : ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=450&fit=crop"],
    desc: row.description || "",
    specs: row.specs || [],
    badge: row.badge || "",
    featured: !!row.featured,
    bestseller: !!row.bestseller,
    newArrival: !!row.new_arrival,
    link: row.link || "#",
  };
}

function mapToDb(p) {
  return {
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    old_price: p.oldPrice || 0,
    stock: p.stock || 0,
    images: p.images || [],
    description: p.desc || "",
    specs: p.specs || [],
    badge: p.badge || "",
    featured: !!p.featured,
    bestseller: !!p.bestseller,
    new_arrival: !!p.newArrival,
    link: p.link || "#",
    updated_at: new Date().toISOString(),
  };
}

// دالة مخصصة للتحميل المحلي الفوري
function loadProductsLocally() {
  const saved = localStorage.getItem("tk_products");
  if (saved) {
    try {
      PRODUCTS = JSON.parse(saved);
      if (!PRODUCTS || PRODUCTS.length === 0) throw new Error("Empty");
    } catch(e) {
      PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }
  } else {
    PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
}

async function loadProducts() {
  return true; 
}

async function syncProductToSupabase(p) {
  if (!supabaseClient) return;
  try {
    const row = mapToDb(p);
    if (p.id) {
      const { error } = await supabaseClient.from("products").upsert({ id: p.id, ...row });
      if (error) console.warn("supabase upsert", error);
    }
  } catch (e) {
    console.warn(e);
  }
}

async function deleteProductFromSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from("products").delete().eq("id", id);
  } catch (e) {
    console.warn(e);
  }
}

async function seedSupabaseIfEmpty() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from("products").select("id").limit(1);
    if (error) { console.warn(error); return; }
    if (data && data.length) return;
    // seed defaults
    const rows = DEFAULT_PRODUCTS.map(p => ({ id: p.id, ...mapToDb(p) }));
    const { error: insErr } = await supabaseClient.from("products").insert(rows);
    if (insErr) console.warn("seed error", insErr);
    else console.log("Seeded Supabase products");
  } catch (e) {
    console.warn(e);
  }
}

function saveProducts() {
  localStorage.setItem("tk_products", JSON.stringify(PRODUCTS));
}

function hideLoader() {
  setTimeout(() => {
    const el = document.getElementById("loader");
    if (el) el.classList.add("hide");
  }, 100);
}

function handleRoute() {
  const hash = location.hash.slice(1) || "home";
  if (hash.startsWith("product/")) {
    const id = Number(hash.split("/")[1]);
    showProductPage(id);
  } else if (hash === "wishlist") showPage("wishlist");
  else if (hash === "admin") showAdmin();
  else if (hash === "cart") { showPage("home"); openCart(); }
  else showPage("home");
}

function showPage(name) {
  currentView = name;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + name);
  if (el) el.classList.add("active");
  updateBottomNav(name);
  if (name === "home") {
    renderCategories();
    renderBrandFilter();
    renderHomeSections();
    renderProducts();
  }
  if (name === "wishlist") renderWishlist();
  window.scrollTo(0, 0);
}

function updateBottomNav(name) {
  document.querySelectorAll(".bottom-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.page === name || (name === "home" && b.dataset.page === "home"));
  });
}

function bindGlobal() {
  const si = document.getElementById("searchInput");
  if (si) si.addEventListener("input", e => { searchQuery = e.target.value.trim().toLowerCase(); renderProducts(); });
  const bf = document.getElementById("brandFilter");
  if (bf) bf.addEventListener("change", e => { brandFilter = e.target.value; renderProducts(); });
  const mp = document.getElementById("minPrice");
  if (mp) mp.addEventListener("change", e => { minPrice = Number(e.target.value) || 0; renderProducts(); });
  const xp = document.getElementById("maxPrice");
  if (xp) xp.addEventListener("change", e => { maxPrice = Number(e.target.value) || 99999; renderProducts(); });
  const sb = document.getElementById("sortBy");
  if (sb) sb.addEventListener("change", e => { sortBy = e.target.value; renderProducts(); });
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  document.getElementById("cartBtn")?.addEventListener("click", openCart);
  document.getElementById("cartClose")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click", checkoutWhatsApp);
  document.getElementById("favBtn")?.addEventListener("click", () => location.hash = "wishlist");
}

/* Theme */
function loadTheme() {
  const t = localStorage.getItem("tk_theme") || "dark";
  document.documentElement.setAttribute("data-theme", t);
  updateThemeIcon(t);
}
function toggleTheme() {
  const c = document.documentElement.getAttribute("data-theme");
  const n = c === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem("tk_theme", n);
  updateThemeIcon(n);
}
function updateThemeIcon(t) {
  const b = document.getElementById("themeToggle");
  if (b) b.innerHTML = t === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* Categories */
function renderCategories() {
  const nav = document.getElementById("catNav");
  if (!nav) return;
  nav.innerHTML = CATEGORIES.map(c => `
    <button class="cat-btn ${c.id === currentCategory ? "active" : ""}" onclick="setCategory('${c.id}')">
      <i class="fas ${c.icon}"></i> ${c.name}
    </button>`).join("");
}
function setCategory(id) {
  currentCategory = id;
  offerOnly = id === "offers";
  if (id === "offers") currentCategory = "all";
  renderCategories();
  renderProducts();
  document.getElementById("productsSection")?.scrollIntoView({ behavior: "smooth" });
}

function renderBrandFilter() {
  const brands = [...new Set(PRODUCTS.map(p => p.brand))].sort();
  const sel = document.getElementById("brandFilter");
  if (!sel) return;
  const cur = brandFilter;
  sel.innerHTML = `<option value="all">كل الشركات</option>` + brands.map(b => `<option value="${b}">${b}</option>`).join("");
  sel.value = cur;
}

/* Home sections */
function renderHomeSections() {
  const cont = document.getElementById("homeSections");
  if (!cont) return;
  const offers = PRODUCTS.filter(p => p.oldPrice && p.oldPrice > p.price);
  const bestsellers = PRODUCTS.filter(p => p.bestseller);
  const news = PRODUCTS.filter(p => p.newArrival);
  const featured = PRODUCTS.filter(p => p.featured);
  const builds = PRODUCTS.filter(p => p.category === "builds");

  let html = "";
  if (offers.length) html += sectionHTML("عروض خاصة", "fa-tags", offers.slice(0, 8));
  if (bestsellers.length) html += sectionHTML("الأكثر مبيعًا", "fa-fire", bestsellers.slice(0, 8));
  if (news.length) html += sectionHTML("وصل حديثًا", "fa-sparkles", news.slice(0, 8));
  if (builds.length) html += sectionHTML("تجميعات PC", "fa-desktop", builds);
  if (featured.length) html += sectionHTML("أفضل الاختيارات", "fa-star", featured.slice(0, 8));
  cont.innerHTML = html;
}

function sectionHTML(title, icon, list) {
  return `<div class="section-title"><i class="fas ${icon}"></i> ${title}</div>
    <div class="horiz-scroll">${list.map(p => cardHTML(p)).join("")}</div>`;
}

/* Filter */
function getFiltered() {
  let list = [...PRODUCTS];
  if (currentCategory !== "all") list = list.filter(p => p.category === currentCategory);
  if (offerOnly) list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
  if (searchQuery) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery) ||
      p.desc.toLowerCase().includes(searchQuery) ||
      (p.specs || []).some(s => s.toLowerCase().includes(searchQuery))
    );
  }
  if (brandFilter !== "all") list = list.filter(p => p.brand === brandFilter);
  if (stockFilter === "in") list = list.filter(p => p.stock > 0);
  if (stockFilter === "out") list = list.filter(p => p.stock <= 0);
  list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);
  if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return list;
}

function setStockFilter(v) {
  stockFilter = v;
  document.querySelectorAll(".chip[data-stock]").forEach(c => c.classList.toggle("active", c.dataset.stock === v));
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("resultsCount");
  if (!grid) return;
  const list = getFiltered();
  if (countEl) countEl.textContent = `${list.length} منتج`;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><p>لا توجد منتجات مطابقة</p></div>`;
    return;
  }
  grid.innerHTML = list.map(p => cardHTML(p)).join("");
  setTimeout(setupReveal, 50);
}

function cardHTML(p) {
  const isFav = favorites.includes(p.id);
  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const badge = p.badge ? `<span class="product-badge ${p.badge === "عرض" || disc ? "sale" : ""}">${p.badge || (disc ? disc + "%" : "")}</span>` : (disc ? `<span class="product-badge sale">-${disc}%</span>` : "");
  const stockCls = p.stock <= 0 ? "stock-out" : p.stock <= 5 ? "stock-low" : "stock-ok";
  const stockTxt = p.stock <= 0 ? "غير متوفر" : p.stock <= 5 ? `متبقي ${p.stock}` : "متوفر";
  const img = (p.images && p.images[0]) || "";
  return `
  <div class="product-card" onclick="goProduct(${p.id})">
    <div class="product-img">
      <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=300&fit=crop'">
      ${badge}
      <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation();toggleFav(${p.id})">
        <i class="${isFav ? "fas" : "far"} fa-heart"></i>
      </button>
    </div>
    <div class="product-body">
      <div class="product-brand">${p.brand}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="${stockCls}" style="margin-bottom:6px"><i class="fas fa-box"></i> ${stockTxt}</div>
      <div class="product-footer">
        <div class="price">
          ${disc ? `<span class="old-price">$${p.oldPrice}</span> ` : ""}
          $${p.price.toLocaleString()}
          <span class="iqd">≈ ${(p.price * USD_TO_IQD).toLocaleString()} د.ع</span>
        </div>
        <button class="add-cart-btn" ${p.stock <= 0 ? "disabled style='opacity:0.5'" : ""} onclick="event.stopPropagation();addToCart(${p.id})">
          <i class="fas fa-cart-plus"></i>
        </button>
      </div>
    </div>
  </div>`;
}

function goProduct(id) { location.hash = "product/" + id; }

/* Product detail page */
function showProductPage(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) { location.hash = "home"; return; }
  document.querySelectorAll(".page").forEach(pg => pg.classList.remove("active"));
  const page = document.getElementById("page-detail");
  page.classList.add("active");
  currentView = "detail";
  updateBottomNav("home");

  const disc = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const stockCls = p.stock <= 0 ? "stock-out" : p.stock <= 5 ? "stock-low" : "stock-ok";
  const stockTxt = p.stock <= 0 ? "غير متوفر حالياً" : p.stock <= 5 ? `متبقي ${p.stock} فقط` : "متوفر في المخزون";
  const imgs = p.images || [""];

  // SEO
  document.title = `${p.name} | THE KINGDOM`;
  setMeta("description", p.desc);
  setMeta("og:title", p.name, "property");
  setMeta("og:description", p.desc, "property");
  setMeta("og:image", imgs[0], "property");

  page.innerHTML = `
  <div class="detail-page">
    <button class="back-btn" onclick="location.hash='home'"><i class="fas fa-arrow-right"></i> رجوع</button>
    <div class="detail-grid">
      <div class="detail-gallery">
        <img class="detail-main-img" id="mainImg" src="${imgs[0]}" alt="${p.name}">
        <div class="detail-thumbs">${imgs.map((im, i) => `<img src="${im}" class="${i === 0 ? "active" : ""}" onclick="swapImg(this,'${im}')">`).join("")}</div>
      </div>
      <div class="detail-info">
        <div class="product-brand">${p.brand} · ${catName(p.category)}</div>
        <h1>${p.name}</h1>
        <div class="detail-meta">
          <span class="${stockCls}"><i class="fas fa-box"></i> ${stockTxt}</span>
          ${disc ? `<span class="discount-badge">خصم ${disc}%</span>` : ""}
          ${p.badge ? `<span class="product-badge" style="position:static">${p.badge}</span>` : ""}
        </div>
        <p style="color:var(--text-muted);margin-bottom:12px;line-height:1.7">${p.desc}</p>
        <div class="modal-price" style="margin-bottom:8px">
          ${disc ? `<span class="old-price" style="font-size:1rem;margin-left:8px">$${p.oldPrice}</span>` : ""}
          $${p.price.toLocaleString()}
          <small style="font-size:0.8rem;color:var(--text-muted);display:block;margin-top:4px">≈ ${(p.price * USD_TO_IQD).toLocaleString()} د.ع</small>
        </div>
        <div class="detail-specs">
          <h4><i class="fas fa-list"></i> المواصفات</h4>
          <table>${(p.specs || []).map(s => {
            const parts = s.split(":");
            return parts.length > 1
              ? `<tr><td>${parts[0]}</td><td>${parts.slice(1).join(":").trim()}</td></tr>`
              : `<tr><td colspan="2">${s}</td></tr>`;
          }).join("")}</table>
        </div>
        <div class="detail-actions">
          <button class="btn-primary" ${p.stock <= 0 ? "disabled" : ""} onclick="addToCart(${p.id})">
            <i class="fas fa-cart-plus"></i> أضف للسلة
          </button>
          <a class="btn-secondary" href="${p.link}" target="_blank" rel="noopener">
            <i class="fas fa-external-link-alt"></i> شراء من المتجر
          </a>
          <button class="btn-secondary" onclick="toggleFav(${p.id})">
            <i class="${favorites.includes(p.id) ? "fas" : "far"} fa-heart"></i> مفضلة
          </button>
          <button class="share-btn" onclick="shareProduct(${p.id})">
            <i class="fas fa-share-alt"></i> مشاركة
          </button>
          <button class="share-btn" onclick="showProductQR(${p.id})">
            <i class="fas fa-qrcode"></i> QR
          </button>
        </div>
      </div>
    </div>
    <div class="section-title" style="margin-top:32px"><i class="fas fa-th"></i> منتجات مشابهة</div>
    <div class="horiz-scroll" id="similarProducts"></div>
  </div>`;

  const similar = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 8);
  document.getElementById("similarProducts").innerHTML = similar.map(x => cardHTML(x)).join("") || "<p style='color:var(--text-muted)'>لا توجد منتجات مشابهة</p>";
}

function swapImg(el, src) {
  document.getElementById("mainImg").src = src;
  el.parentElement.querySelectorAll("img").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
}

function catName(id) {
  return (CATEGORIES.find(c => c.id === id) || {}).name || id;
}

function setMeta(name, content, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute("content", content || "");
}

function shareProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const url = location.origin + location.pathname + "#product/" + id;
  if (navigator.share) {
    navigator.share({ title: p.name, text: p.desc, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
    showToast("تم نسخ رابط المنتج", "success");
  }
}

/* Cart */
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock <= 0) { showToast("المنتج غير متوفر", "error"); return; }
  const ex = cart.find(c => c.id === id);
  if (ex) {
    if (ex.qty >= p.stock) { showToast("تجاوزت الكمية المتوفرة", "error"); return; }
    ex.qty += 1;
  } else cart.push({ id: p.id, name: p.name, price: p.price, image: (p.images || [])[0], qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`تمت إضافة ${p.name} للسلة`, "success");
}
function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); updateCartUI(); renderCartItems();
  showToast("تم الحذف من السلة", "success");
}
function changeQty(id, d) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  const p = PRODUCTS.find(x => x.id === id);
  item.qty += d;
  if (item.qty <= 0) removeFromCart(id);
  else if (p && item.qty > p.stock) { item.qty = p.stock; showToast("الكمية القصوى المتوفرة", "error"); }
  saveCart(); updateCartUI(); renderCartItems();
}
function saveCart() { localStorage.setItem("tk_cart", JSON.stringify(cart)); }
function updateCartUI() {
  const t = cart.reduce((s, c) => s + c.qty, 0);
  ["cartCount", "bnCartCount"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = t; el.style.display = t > 0 ? "flex" : "none"; }
  });
}
function openCart() {
  renderCartItems();
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartDrawer")?.classList.add("open");
}
fun
