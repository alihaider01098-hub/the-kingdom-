/* ========== THE KINGDOM v2 App ========== */
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem("tk_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("tk_favs") || "[]");
let currentCategory = "all";
let searchQuery = "";
let brandFilter = "all";
let stockFilter = "all";
let offerOnly = false;
let minPrice = 0, maxPrice = 99999;
let sortBy = "default";
let currentView = "home";
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // مؤقت أمان لإجبار الموقع على الفتح وإخفاء شاشة التحميل بعد 3 ثوانٍ
  // حتى لو تأخرت استجابة قاعدة البيانات
  const failsafeTimer = setTimeout(() => {
    hideLoader();
    loadTheme();
    handleRoute();
    bindGlobal();
  }, 3000);

  try {
    await loadProducts();
    await seedSupabaseIfEmpty();
    if (supabaseClient) {
      const { data } = await supabaseClient.from("products").select("*").order("id");
      if (data && data.length) PRODUCTS = data.map(mapFromDb);
    }
  } catch (e) {
    console.error("حدث خطأ أثناء جلب البيانات:", e);
  } finally {
    // إلغاء المؤقت إذا نجح التحميل بسرعة
    clearTimeout(failsafeTimer);
    loadTheme();
    hideLoader();
    handleRoute();
    bindGlobal();
    
    // منع تكرار إضافة الحدث
    if (!window._boundHash) {
      window.addEventListener("hashchange", handleRoute);
      window._boundHash = true;
    }
  }
});


let supabaseClient = null;

function initSupabase() {
  try {
    if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_KEY) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    console.warn("Supabase init failed", e);
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

async function loadProducts() {
  initSupabase();
  // 1) Try Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("products").select("*").order("id");
      if (!error && data && data.length) {
        PRODUCTS = data.map(mapFromDb);
        localStorage.setItem("tk_products", JSON.stringify(PRODUCTS));
        return;
      }
    } catch (e) {
      console.warn("Supabase load failed, fallback", e);
    }
  }
  // 2) localStorage
  const saved = localStorage.getItem("tk_products");
  PRODUCTS = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
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
  }, 600);
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
function closeCart() {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
}
function renderCartItems() {
  const container = document.getElementById("cartItems");
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>السلة فارغة</p></div>`;
    document.getElementById("cartTotal").textContent = "$0";
    return;
  }
  let total = 0;
  container.innerHTML = cart.map(c => {
    total += c.price * c.qty;
    return `<div class="cart-item">
      <img src="${c.image}" alt="">
      <div class="cart-item-info">
        <h4>${c.name}</h4>
        <div class="price">$${(c.price * c.qty).toLocaleString()}</div>
        <div class="cart-item-qty">
          <button onclick="changeQty(${c.id},-1)">−</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${c.id},1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${c.id})"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join("");
  document.getElementById("cartTotal").textContent = `$${total.toLocaleString()}`;
}
function checkoutWhatsApp() {
  if (!cart.length) { showToast("السلة فارغة", "error"); return; }
  let msg = "مرحباً، أريد طلب من THE KINGDOM:%0A%0A";
  let total = 0;
  cart.forEach(c => { msg += `• ${c.name} x${c.qty} = $${c.price * c.qty}%0A`; total += c.price * c.qty; });
  msg += `%0Aالمجموع: $${total}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
  showToast("جاري فتح واتساب...", "success");
}

/* Favorites / Wishlist */
function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    showToast("تمت الإزالة من المفضلة", "success");
  } else {
    favorites.push(id);
    showToast("تمت الإضافة للمفضلة", "success");
  }
  localStorage.setItem("tk_favs", JSON.stringify(favorites));
  updateFavCount();
  if (currentView === "home") renderProducts();
  if (currentView === "wishlist") renderWishlist();
  if (currentView === "detail") showProductPage(id);
}
function updateFavCount() {
  ["favCount", "bnFavCount"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = favorites.length; el.style.display = favorites.length > 0 ? "flex" : "none"; }
  });
}
function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  const list = PRODUCTS.filter(p => favorites.includes(p.id));
  if (!list.length) {
    grid.innerHTML = `<div class="wishlist-empty"><i class="fas fa-heart"></i><p>قائمة المفضلة فارغة</p>
      <button class="btn-primary" style="margin-top:16px" onclick="location.hash='home'">تصفح المنتجات</button></div>`;
    return;
  }
  grid.innerHTML = `<div class="products-grid">${list.map(p => cardHTML(p)).join("")}</div>`;
}

/* Toast */
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.className = "toast show " + type;
  t.innerHTML = `<i class="fas fa-${type === "error" ? "exclamation-circle" : "check-circle"}"></i> ${msg}`;
  setTimeout(() => t.classList.remove("show"), 2800);
}

/* ========== Admin ========== */
function showAdmin() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-admin");
  page.classList.add("active");
  const authed = sessionStorage.getItem("tk_admin") === "1";
  if (!authed) {
    page.innerHTML = `<div class="login-box">
      <h3><i class="fas fa-lock"></i> لوحة التحكم</h3>
      <input type="email" id="adminEmail" placeholder="البريد الإلكتروني">
      <input type="password" id="adminPass" placeholder="كلمة المرور">
      <button class="btn-primary" style="width:100%" onclick="adminLogin()">دخول</button>
      <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted)">يجب إضافة حساب المدير من لوحة Supabase Authentication</p>
    </div>`;
    return;
  }
  renderAdminPanel();
}

async function adminLogin() {
  const email = document.getElementById("adminEmail")?.value.trim();
  const pass = document.getElementById("adminPass")?.value;
  
  if (!email || !pass) {
    showToast("الرجاء إدخال البريد الإلكتروني وكلمة المرور", "error");
    return;
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: pass
    });

    if (error) {
      showToast("بيانات الدخول غير صحيحة", "error");
    } else {
      sessionStorage.setItem("tk_admin", "1");
      renderAdminPanel();
      showToast("مرحباً بك في لوحة التحكم", "success");
    }
  } else {
    showToast("فشل الاتصال بقاعدة البيانات", "error");
  }
}

function renderAdminPanel() {
  const page = document.getElementById("page-admin");
  page.innerHTML = `
  <div class="admin-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <h2><i class="fas fa-cog"></i> لوحة التحكم</h2>
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" onclick="location.hash='home'"><i class="fas fa-home"></i> الموقع</button>
        <button class="btn-secondary" onclick="sessionStorage.removeItem('tk_admin');showAdmin()"><i class="fas fa-sign-out-alt"></i></button>
      </div>
    </div>
    <h3 style="color:var(--gold);margin-bottom:10px">${editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
    <div class="admin-form" id="adminForm">
      <div><label>الاسم</label><input id="aName"></div>
      <div><label>الشركة</label><input id="aBrand"></div>
      <div><label>الفئة</label>
        <select id="aCat">${CATEGORIES.filter(c => c.id !== "all" && c.id !== "offers").map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
      </div>
      <div><label>السعر $</label><input type="number" id="aPrice"></div>
      <div><label>السعر القديم $ (للعرض)</label><input type="number" id="aOldPrice" value="0"></div>
      <div><label>المخزون</label><input type="number" id="aStock" value="10"></div>
      <div><label>الشارة</label><input id="aBadge" placeholder="جديد / عرض / ..."></div>
      <div><label>رابط الشراء</label><input id="aLink"></div>
      <div class="full"><label>الوصف</label><textarea id="aDesc"></textarea></div>
      <div class="full"><label>المواصفات (سطر لكل مواصفة)</label><textarea id="aSpecs" placeholder="Socket: AM5&#10;Cores: 8"></textarea></div>
      <div class="full"><label>رابط الصورة</label><input id="aImage" placeholder="https://..."></div>
      <div style="display:flex;gap:12px;align-items:center">
        <label><input type="checkbox" id="aFeatured"> مميز</label>
        <label><input type="checkbox" id="aBest"> الأكثر مبيعاً</label>
        <label><input type="checkbox" id="aNew"> وصل حديثاً</label>
      </div>
      <div class="full" style="display:flex;gap:10px">
        <button class="btn-primary" onclick="saveProduct()"><i class="fas fa-save"></i> حفظ</button>
        ${editingId ? `<button class="btn-secondary" onclick="editingId=null;renderAdminPanel()">إلغاء</button>` : ""}
      </div>
    </div>
    <h3 style="color:var(--gold);margin:20px 0 10px">المنتجات (${PRODUCTS.length})</h3>
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr><th>ID</th><th>الاسم</th><th>السعر</th><th>المخزون</th><th>فئة</th><th>إجراءات</th></tr></thead>
        <tbody>${PRODUCTS.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>$${p.price}${p.oldPrice ? ` <s style="color:var(--text-muted)">$${p.oldPrice}</s>` : ""}</td>
            <td>${p.stock}</td>
            <td>${p.category}</td>
            <td class="actions">
              <button onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
              <button class="del" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-secondary" onclick="exportProducts()"><i class="fas fa-download"></i> تصدير JSON</button>
      <button class="btn-secondary" onclick="document.getElementById('importFile').click()"><i class="fas fa-upload"></i> استيراد JSON</button>
      <button class="btn-secondary" onclick="resetProducts()"><i class="fas fa-undo"></i> استعادة الافتراضي</button>
      <input type="file" id="importFile" accept=".json" style="display:none" onchange="importProducts(event)">
    </div>
  </div>`;
  if (editingId) fillEditForm(editingId);
}

function fillEditForm(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  document.getElementById("aName").value = p.name;
  document.getElementById("aBrand").value = p.brand;
  document.getElementById("aCat").value = p.category;
  document.getElementById("aPrice").value = p.price;
  document.getElementById("aOldPrice").value = p.oldPrice || 0;
  document.getElementById("aStock").value = p.stock;
  document.getElementById("aBadge").value = p.badge || "";
  document.getElementById("aLink").value = p.link || "";
  document.getElementById("aDesc").value = p.desc || "";
  document.getElementById("aSpecs").value = (p.specs || []).join("\n");
  document.getElementById("aImage").value = (p.images || [])[0] || "";
  document.getElementById("aFeatured").checked = !!p.featured;
  document.getElementById("aBest").checked = !!p.bestseller;
  document.getElementById("aNew").checked = !!p.newArrival;
}

function saveProduct() {
  const name = document.getElementById("aName").value.trim();
  if (!name) { showToast("أدخل اسم المنتج", "error"); return; }
  const data = {
    name,
    brand: document.getElementById("aBrand").value.trim() || "Unknown",
    category: document.getElementById("aCat").value,
    price: Number(document.getElementById("aPrice").value) || 0,
    oldPrice: Number(document.getElementById("aOldPrice").value) || 0,
    stock: Number(document.getElementById("aStock").value) || 0,
    badge: document.getElementById("aBadge").value.trim(),
    link: document.getElementById("aLink").value.trim() || "#",
    desc: document.getElementById("aDesc").value.trim(),
    specs: document.getElementById("aSpecs").value.split("\n").map(s => s.trim()).filter(Boolean),
    images: [document.getElementById("aImage").value.trim() || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=450&fit=crop"],
    featured: document.getElementById("aFeatured").checked,
    bestseller: document.getElementById("aBest").checked,
    newArrival: document.getElementById("aNew").checked,
  };
  if (editingId) {
    const idx = PRODUCTS.findIndex(p => p.id === editingId);
    if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], ...data };
    showToast("تم تحديث المنتج", "success");
  } else {
    const newId = PRODUCTS.length ? Math.max(...PRODUCTS.map(p => p.id)) + 1 : 1;
    PRODUCTS.push({ id: newId, ...data });
    showToast("تمت إضافة المنتج", "success");
  }
  editingId = null;
  saveProducts();
  const saved = PRODUCTS.find(p => p.name === data.name && p.price === data.price);
  if (saved) syncProductToSupabase(saved);
  renderAdminPanel();
}

function editProduct(id) { editingId = id; renderAdminPanel(); }
function deleteProduct(id) {
  if (!confirm("حذف هذا المنتج؟")) return;
  PRODUCTS = PRODUCTS.filter(p => p.id !== id);
  saveProducts();
  deleteProductFromSupabase(id);
  renderAdminPanel();
  showToast("تم الحذف", "success");
}
function exportProducts() {
  const blob = new Blob([JSON.stringify(PRODUCTS, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kingdom-products.json";
  a.click();
}
function importProducts(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      PRODUCTS = JSON.parse(ev.target.result);
      saveProducts();
      renderAdminPanel();
      showToast("تم الاستيراد بنجاح", "success");
    } catch { showToast("ملف غير صالح", "error"); }
  };
  reader.readAsText(file);
}
function resetProducts() {
  if (!confirm("استعادة المنتجات الافتراضية؟")) return;
  PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  saveProducts();
  renderAdminPanel();
  showToast("تمت الاستعادة", "success");
}

// Init counts
updateCartUI();
updateFavCount();

/* ========== PC Builder ========== */
let builder = { cpu:null, mobo:null, ram:null, gpu:null, storage:null, psu:null, case:null };

function openBuilder() {
  location.hash = "builder";
  showBuilderPage();
}

function showBuilderPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-builder");
  page.classList.add("active");
  currentView = "builder";
  renderBuilder();
}

function getSocket(p) {
  if (!p || !p.specs) return null;
  for (const s of p.specs) {
    if (/socket/i.test(s)) return s.split(":")[1]?.trim();
    if (/AM5|AM4|LGA1700|LGA1200/i.test(s)) {
      const m = s.match(/AM5|AM4|LGA1700|LGA1200/i);
      if (m) return m[0].toUpperCase();
    }
  }
  if (p.category === "cpu") {
    if (/Ryzen\s*[7-9]\s*7|Ryzen\s*5\s*7|7800|7600|7950/i.test(p.name)) return "AM5";
    if (/5600|5500|5700/i.test(p.name)) return "AM4";
    if (/14\d{3}|13\d{3}|12\d{3}/i.test(p.name)) return "LGA1700";
  }
  if (p.category === "mobo") {
    if (/B650|X670|A620/i.test(p.name)) return "AM5";
    if (/B550|X570/i.test(p.name)) return "AM4";
    if (/B760|Z790|B660|Z690/i.test(p.name)) return "LGA1700";
  }
  return null;
}

function getWatt(p) {
  if (!p) return 0;
  if (p.category === "psu") {
    const m = (p.name + " " + (p.specs||[]).join(" ")).match(/(\d{3,4})\s*W/i);
    return m ? Number(m[1]) : 0;
  }
  if (p.category === "gpu") {
    const m = (p.specs||[]).join(" ").match(/TDP:\s*(\d+)/i);
    return m ? Number(m[1]) : 200;
  }
  if (p.category === "cpu") {
    const m = (p.specs||[]).join(" ").match(/TDP:\s*(\d+)/i);
    return m ? Number(m[1]) : 65;
  }
  return 0;
}

function checkCompatibility() {
  const issues = [];
  const ok = [];
  const cpu = builder.cpu, mobo = builder.mobo, ram = builder.ram, gpu = builder.gpu, psu = builder.psu;

  if (cpu && mobo) {
    const cs = getSocket(cpu), ms = getSocket(mobo);
    if (cs && ms && cs !== ms) issues.push(`عدم توافق السوكت: المعالج (${cs}) ≠ المذربورد (${ms})`);
    else if (cs && ms) ok.push(`السوكت متوافق: ${cs}`);
  }
  if (cpu && ram) {
    const isDDR5 = /7600|7800|7900|7950|14600|14700|14900|X670|B650|Z790|B760/i.test((cpu.name||"")+(mobo?.name||""));
    const ramDDR5 = /DDR5/i.test(ram.name + (ram.specs||[]).join(" "));
    const ramDDR4 = /DDR4/i.test(ram.name + (ram.specs||[]).join(" "));
    if (isDDR5 && ramDDR4) issues.push("المنصة تدعم DDR5 غالبًا بينما الرامات DDR4");
    else if (ramDDR5 || ramDDR4) ok.push("نوع الرامات مناسب مبدئيًا");
  }
  if (psu) {
    const need = 150 + getWatt(cpu) + getWatt(gpu);
    const have = getWatt(psu);
    if (have && have < need) issues.push(`البورسبلاي ضعيف: تحتاج ~${need}W والمتوفر ${have}W`);
    else if (have) ok.push(`البورسبلاي كافٍ: ${have}W (الاحتياج التقريبي ${need}W)`);
  }
  const required = BUILDER_SLOTS.filter(s => s.required);
  const missing = required.filter(s => !builder[s.key]);
  if (missing.length) issues.push("قطع ناقصة: " + missing.map(m => m.name).join("، "));

  return { issues, ok };
}

function builderTotal() {
  return BUILDER_SLOTS.reduce((s, slot) => s + (builder[slot.key]?.price || 0), 0);
}

function renderBuilder() {
  const page = document.getElementById("page-builder");
  if (!page) return;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  page.classList.add("active");
  const compat = checkCompatibility();
  const total = builderTotal();

  page.innerHTML = `
  <div class="detail-page">
    <button class="back-btn" onclick="location.hash='home'"><i class="fas fa-arrow-right"></i> رجوع</button>
    <h2 style="color:var(--gold);font-family:Orbitron,sans-serif;margin-bottom:8px"><i class="fas fa-tools"></i> منشئ التجميعات</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">اختر القطع وسنفحص التوافق تلقائيًا</p>

    <div class="filters-bar" style="margin-bottom:16px">
      <div class="filter-group"><label>ميزانية أقصى</label>
        <select id="budgetPreset" onchange="applyBudget(this.value)">
          <option value="">— اختر —</option>
          ${BUDGET_PRESETS.map(b => `<option value="${b.id}">${b.name} (حتى $${b.max})</option>`).join("")}
        </select>
      </div>
      <div class="filter-group"><label>حسب اللعبة</label>
        <select id="gameProfile" onchange="applyGameProfile(this.value)">
          <option value="">— اختر —</option>
          ${GAME_PROFILES.map(g => `<option value="${g.id}">${g.name}</option>`).join("")}
        </select>
      </div>
    </div>

    <div style="display:grid;gap:12px;margin-bottom:20px">
      ${BUILDER_SLOTS.map(slot => {
        const sel = builder[slot.key];
        return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <div><i class="fas ${slot.icon}" style="color:var(--gold)"></i> <strong>${slot.name}</strong> ${slot.required ? '<span style="color:var(--danger);font-size:0.75rem">*</span>' : ""}</div>
            <div style="display:flex;gap:8px;align-items:center">
              ${sel ? `<span style="color:var(--gold);font-weight:700">$${sel.price}</span>
                <button class="btn-secondary" style="padding:6px 10px" onclick="clearSlot('${slot.key}')">إزالة</button>` : ""}
              <button class="btn-primary" style="padding:6px 12px" onclick="pickForSlot('${slot.key}')">اختيار</button>
            </div>
          </div>
          ${sel ? `<div style="margin-top:8px;color:var(--text-muted);font-size:0.9rem">${sel.brand} — ${sel.name}</div>` : `<div style="margin-top:8px;color:var(--text-muted);font-size:0.85rem">لم يتم الاختيار</div>`}
        </div>`;
      }).join("")}
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:1.2rem;font-weight:800;color:var(--gold);margin-bottom:10px">المجموع: $${total.toLocaleString()} <small style="color:var(--text-muted);font-size:0.8rem">≈ ${(total*USD_TO_IQD).toLocaleString()} د.ع</small></div>
      <div style="margin-bottom:8px;font-weight:700">فحص التوافق:</div>
      ${compat.ok.map(x => `<div class="stock-ok">✓ ${x}</div>`).join("")}
      ${compat.issues.map(x => `<div class="stock-out">⚠ ${x}</div>`).join("")}
      ${!compat.issues.length && !compat.ok.length ? `<div style="color:var(--text-muted)">ابدأ باختيار القطع</div>` : ""}
      ${!compat.issues.length && BUILDER_SLOTS.filter(s=>s.required).every(s=>builder[s.key]) ? `<div class="stock-ok" style="margin-top:8px;font-weight:700">✓ التجميعة متوافقة مبدئيًا</div>` : ""}
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-primary" onclick="addBuildToCart()"><i class="fas fa-cart-plus"></i> أضف التجميعة للسلة</button>
      <button class="btn-secondary" onclick="clearBuilder()"><i class="fas fa-trash"></i> مسح الكل</button>
    </div>

    <div id="slotPicker" style="display:none;margin-top:20px"></div>
  </div>`;
}

function pickForSlot(key) {
  const list = PRODUCTS.filter(p => p.category === key && p.stock > 0);
  const box = document.getElementById("slotPicker");
  box.style.display = "block";
  box.innerHTML = `<div class="section-title">اختر ${BUILDER_SLOTS.find(s=>s.key===key).name}</div>
    <div class="products-grid">${list.map(p => `
      <div class="product-card" onclick="selectSlot('${key}',${p.id})">
        <div class="product-img"><img src="${(p.images||[])[0]}" loading="lazy"></div>
        <div class="product-body">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="price">$${p.price}</div>
        </div>
      </div>`).join("") || '<p style="color:var(--text-muted)">لا توجد قطع متاحة</p>'}</div>`;
  box.scrollIntoView({ behavior: "smooth" });
}

function selectSlot(key, id) {
  builder[key] = PRODUCTS.find(p => p.id === id) || null;
  renderBuilder();
  showToast("تم اختيار القطعة", "success");
}
function clearSlot(key) { builder[key] = null; renderBuilder(); }
function clearBuilder() {
  builder = { cpu:null, mobo:null, ram:null, gpu:null, storage:null, psu:null, case:null };
  renderBuilder();
}
function addBuildToCart() {
  const parts = BUILDER_SLOTS.map(s => builder[s.key]).filter(Boolean);
  if (!parts.length) { showToast("لم تختر أي قطع", "error"); return; }
  const compat = checkCompatibility();
  if (compat.issues.length) {
    if (!confirm("هناك مشاكل توافق:\n" + compat.issues.join("\n") + "\n\nهل تريد المتابعة؟")) return;
  }
  parts.forEach(p => addToCart(p.id));
  showToast("تمت إضافة التجميعة للسلة", "success");
}

function applyBudget(id) {
  if (!id) return;
  const preset = BUDGET_PRESETS.find(b => b.id === id);
  if (!preset) return;
  // greedy pick best value under budget
  clearBuilder();
  let remaining = preset.max;
  for (const slot of BUILDER_SLOTS) {
    const options = PRODUCTS.filter(p => p.category === slot.key && p.stock > 0 && p.price <= remaining * 0.45)
      .sort((a,b) => b.price - a.price);
    // prefer mid options
    const pick = options[Math.floor(options.length / 3)] || options[0];
    if (pick) { builder[slot.key] = pick; remaining -= pick.price; }
  }
  // fix compatibility roughly
  if (builder.cpu && builder.mobo) {
    const cs = getSocket(builder.cpu), ms = getSocket(builder.mobo);
    if (cs && ms && cs !== ms) {
      const mobo2 = PRODUCTS.filter(p => p.category === "mobo" && getSocket(p) === cs && p.price <= (builder.mobo.price + remaining))
        .sort((a,b)=>a.price-b.price)[0];
      if (mobo2) builder.mobo = mobo2;
    }
  }
  renderBuilder();
  showToast(`تم اقتراح تجميعة ضمن $${preset.max}`, "success");
}

function applyGameProfile(id) {
  if (!id) return;
  const g = GAME_PROFILES.find(x => x.id === id);
  if (!g) return;
  const gpu = PRODUCTS.filter(p => p.category === "gpu" && p.stock > 0 && p.price >= g.minGpu * 0.8)
    .sort((a,b) => a.price - b.price)[0];
  if (gpu) builder.gpu = gpu;
  if (!builder.cpu) {
    builder.cpu = PRODUCTS.filter(p => p.category === "cpu" && p.stock > 0).sort((a,b)=>a.price-b.price)[Math.min(2, PRODUCTS.length)] || null;
  }
  renderBuilder();
  showToast(`اقتراح لـ ${g.name}: ${g.targetFps}`, "success");
}

/* Compare */
let compareList = JSON.parse(localStorage.getItem("tk_compare") || "[]");

function addToCompare(id) {
  if (compareList.includes(id)) { showToast("موجود في المقارنة", "error"); return; }
  if (compareList.length >= 4) { showToast("يمكنك مقارنة 4 منتجات كحد أقصى", "error"); return; }
  compareList.push(id);
  localStorage.setItem("tk_compare", JSON.stringify(compareList));
  showToast("تمت الإضافة للمقارنة", "success");
}

function showCompare() {
  location.hash = "compare";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-compare");
  page.classList.add("active");
  const items = compareList.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  if (!items.length) {
    page.innerHTML = `<div class="detail-page"><button class="back-btn" onclick="location.hash='home'"><i class="fas fa-arrow-right"></i> رجوع</button>
      <div class="empty-state"><i class="fas fa-balance-scale"></i><p>لم تضف منتجات للمقارنة</p></div></div>`;
    return;
  }
  const allSpecs = [...new Set(items.flatMap(p => (p.specs||[]).map(s => s.split(":")[0].trim())))];
  page.innerHTML = `
  <div class="detail-page">
    <button class="back-btn" onclick="location.hash='home'"><i class="fas fa-arrow-right"></i> رجوع</button>
    <h2 style="color:var(--gold);font-family:Orbitron,sans-serif;margin-bottom:16px"><i class="fas fa-balance-scale"></i> مقارنة المنتجات</h2>
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr><th>المواصفة</th>${items.map(p => `<th>${p.name}<br><button class="btn-secondary" style="margin-top:6px;padding:4px 8px" onclick="removeCompare(${p.id})">إزالة</button></th>`).join("")}</tr></thead>
        <tbody>
          <tr><td>الشركة</td>${items.map(p => `<td>${p.brand}</td>`).join("")}</tr>
          <tr><td>السعر</td>${items.map(p => `<td style="color:var(--gold);font-weight:700">$${p.price}</td>`).join("")}</tr>
          <tr><td>المخزون</td>${items.map(p => `<td>${p.stock}</td>`).join("")}</tr>
          ${allSpecs.map(spec => `<tr><td>${spec}</td>${items.map(p => {
            const found = (p.specs||[]).find(s => s.startsWith(spec));
            return `<td>${found ? found.split(":").slice(1).join(":").trim() : "—"}</td>`;
          }).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function removeCompare(id) {
  compareList = compareList.filter(x => x !== id);
  localStorage.setItem("tk_compare", JSON.stringify(compareList));
  showCompare();
}

/* Extend route */
const _origHandle = handleRoute;
handleRoute = function() {
  const hash = location.hash.slice(1) || "home";
  if (hash === "builder") { showBuilderPage(); return; }
  if (hash === "compare") { showCompare(); return; }
  _origHandle();
};

/* ========== Flash Sale Timer ========== */
function getFlashEnd() {
  let end = localStorage.getItem("tk_flash_end");
  if (!end) {
    end = Date.now() + (typeof FLASH_SALE_HOURS !== "undefined" ? FLASH_SALE_HOURS : 18) * 3600 * 1000;
    localStorage.setItem("tk_flash_end", end);
  }
  return Number(end);
}

function renderFlashBanner() {
  const el = document.getElementById("flashBanner");
  if (!el) return;
  const end = getFlashEnd();
  const tick = () => {
    const left = end - Date.now();
    if (left <= 0) {
      el.innerHTML = `<i class="fas fa-bolt"></i> انتهت عروض Flash — ترقّب القادم`;
      return;
    }
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);
    el.innerHTML = `<i class="fas fa-bolt"></i> Flash Sale ينتهي خلال <strong>${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}</strong>`;
    setTimeout(tick, 1000);
  };
  tick();
}

/* ========== Bundles ========== */
function getBundlePrice(b) {
  const items = (b.productIds || []).map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  const sum = items.reduce((s, p) => s + p.price, 0);
  const final = Math.round(sum * (1 - (b.discountPercent || 0) / 100));
  return { items, sum, final, save: sum - final };
}

function renderBundlesSection() {
  const cont = document.getElementById("bundlesSection");
  if (!cont || typeof BUNDLES === "undefined") return;
  cont.innerHTML = `
    <div class="section-title"><i class="fas fa-gift"></i> حزم Bundles</div>
    <div class="horiz-scroll">
      ${BUNDLES.map(b => {
        const { items, sum, final, save } = getBundlePrice(b);
        if (!items.length) return "";
        return `<div class="product-card" style="min-width:240px;max-width:260px">
          <div class="product-img" style="display:flex;align-items:center;justify-content:center;background:var(--lead)">
            <span class="product-badge sale">${b.badge || "BUNDLE"}</span>
            <i class="fas fa-boxes" style="font-size:2.5rem;color:var(--gold)"></i>
          </div>
          <div class="product-body">
            <div class="product-brand">THE KINGDOM</div>
            <div class="product-name">${b.name}</div>
            <div class="product-desc">${b.desc}<br><small>${items.map(i => i.name).join(" + ")}</small></div>
            <div class="product-footer">
              <div class="price">
                <span class="old-price">$${sum}</span> $${final}
                <span class="iqd">توفير $${save}</span>
              </div>
              <button class="add-cart-btn" onclick="addBundleToCart('${b.id}')"><i class="fas fa-cart-plus"></i></button>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

function addBundleToCart(id) {
  const b = (BUNDLES || []).find(x => x.id === id);
  if (!b) return;
  const { items, final } = getBundlePrice(b);
  items.forEach(p => addToCart(p.id));
  showToast(`تمت إضافة الحزمة: ${b.name}`, "success");
}

/* ========== QR Code ========== */
function showProductQR(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const url = location.origin + location.pathname + "#product/" + id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `<div class="modal" style="max-width:320px;text-align:center;padding:24px">
    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
    <h3 style="color:var(--gold);margin-bottom:12px">QR — ${p.name}</h3>
    <img src="${qrUrl}" alt="QR" style="width:200px;height:200px;background:#fff;border-radius:8px">
    <p style="font-size:0.8rem;color:var(--text-muted);margin-top:10px;word-break:break-all">${url}</p>
  </div>`;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

/* ========== PDF Invoice ========== */
function generateInvoicePDF() {
  if (!cart.length) { showToast("السلة فارغة", "error"); return; }
  let total = 0;
  const rows = cart.map(c => {
    total += c.price * c.qty;
    return `<tr><td>${c.name}</td><td>${c.qty}</td><td>$${c.price}</td><td>$${c.price * c.qty}</td></tr>`;
  }).join("");
  const orderNo = "TK-" + Date.now().toString().slice(-8);
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
    <title>فاتورة ${orderNo}</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#111}
      h1{color:#b8860b} table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ccc;padding:8px;text-align:right}
      th{background:#f5f5f5} .total{font-size:1.2rem;font-weight:bold;margin-top:16px}
      .meta{color:#666;font-size:0.9rem}
    </style></head><body>
    <h1>THE KINGDOM — فاتورة</h1>
    <p class="meta">رقم الطلب: ${orderNo}<br>التاريخ: ${new Date().toLocaleString("ar")}</p>
    <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="total">الإجمالي: $${total.toLocaleString()} ≈ ${(total * USD_TO_IQD).toLocaleString()} د.ع</p>
    <p class="meta">شكرًا لتسوقك من THE KINGDOM</p>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  showToast("تم إنشاء الفاتورة", "success");
}

/* Hook flash + bundles into home render */
const _origHome = typeof renderHomeSections === "function" ? renderHomeSections : null;
if (_origHome) {
  renderHomeSections = function() {
    _origHome();
    renderBundlesSection();
    renderFlashBanner();
  };
}

/* Extend checkout footer buttons via DOM when cart opens */
const _origOpenCart = openCart;
openCart = function() {
  _origOpenCart();
  const footer = document.querySelector(".cart-footer");
  if (footer && !document.getElementById("invoiceBtn")) {
    const btn = document.createElement("button");
    btn.id = "invoiceBtn";
    btn.className = "btn-secondary";
    btn.style.cssText = "width:100%;justify-content:center;margin-top:8px";
    btn.innerHTML = '<i class="fas fa-file-invoice"></i> فاتورة PDF';
    btn.onclick = generateInvoicePDF;
    footer.appendChild(btn);
  }
};

/* PWA register */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* ========== Language ========== */
function toggleLang() {
  LANG = LANG === "ar" ? "en" : "ar";
  localStorage.setItem("tk_lang", LANG);
  document.documentElement.lang = LANG === "ar" ? "ar" : "en";
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  showToast(LANG === "ar" ? "تم التبديل للعربية" : "Switched to English", "success");
  location.hash = "home";
  setTimeout(() => location.reload(), 400);
}

/* ========== Orders (Supabase + local) ========== */
function makeOrderNumber() {
  return "TK-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);
}

async function submitOrder(customerName, customerPhone, notes) {
  if (!cart.length) { showToast(t("emptyCart"), "error"); return null; }
  let total = 0;
  const items = cart.map(c => {
    total += c.price * c.qty;
    return { id: c.id, name: c.name, price: c.price, qty: c.qty };
  });
  const order = {
    order_number: makeOrderNumber(),
    customer_name: customerName || "عميل",
    customer_phone: customerPhone || "",
    items,
    total,
    status: "new",
    notes: notes || "",
    created_at: new Date().toISOString()
  };

  // Save local
  const localOrders = JSON.parse(localStorage.getItem("tk_orders") || "[]");
  localOrders.unshift(order);
  localStorage.setItem("tk_orders", JSON.stringify(localOrders));

  // Save Supabase
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("orders").insert({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.items,
        total: order.total,
        status: "new",
        notes: order.notes
      });
      if (error) console.warn("order supabase", error);
    } catch (e) { console.warn(e); }
  }

  // Decrease stock locally
  items.forEach(it => {
    const p = PRODUCTS.find(x => x.id === it.id);
    if (p) {
      p.stock = Math.max(0, (p.stock || 0) - it.qty);
      syncProductToSupabase(p);
    }
  });
  saveProducts();

  cart = [];
  saveCart();
  updateCartUI();
  closeCart();
  return order;
}

function checkoutWhatsApp() {
  if (!cart.length) { showToast(t("emptyCart"), "error"); return; }
  const name = prompt(LANG === "ar" ? "اسمك:" : "Your name:") || "عميل";
  const phone = prompt(LANG === "ar" ? "رقم الهاتف:" : "Phone:") || "";
  submitOrder(name, phone).then(order => {
    if (!order) return;
    let msg = (LANG === "ar" ? "طلب جديد من THE KINGDOM" : "New order from THE KINGDOM") + "%0A";
    msg += "Order: " + order.order_number + "%0A%0A";
    order.items.forEach(c => { msg += `• ${c.name} x${c.qty} = $${c.price * c.qty}%0A`; });
    msg += `%0ATotal: $${order.total}%0A${name} | ${phone}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
    showToast(LANG === "ar" ? "تم تسجيل الطلب " + order.order_number : "Order saved " + order.order_number, "success");
  });
}

async function loadOrders() {
  let orders = JSON.parse(localStorage.getItem("tk_orders") || "[]");
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && data) orders = data;
    } catch (e) {}
  }
  return orders;
}

async function updateOrderStatus(orderNumber, status) {
  let orders = JSON.parse(localStorage.getItem("tk_orders") || "[]");
  orders = orders.map(o => o.order_number === orderNumber ? { ...o, status } : o);
  localStorage.setItem("tk_orders", JSON.stringify(orders));
  if (supabaseClient) {
    try {
      await supabaseClient.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("order_number", orderNumber);
    } catch (e) {}
  }
  showToast("تم تحديث الحالة", "success");
  renderAdminOrders();
}

/* ========== Admin Dashboard ========== */
async function renderAdminDashboard() {
  const orders = await loadOrders();
  const totalSales = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
  const newOrders = orders.filter(o => o.status === "new").length;
  const lowStock = PRODUCTS.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outStock = PRODUCTS.filter(p => p.stock <= 0).length;

  // top products from cart history approx via orders
  const sold = {};
  orders.forEach(o => (o.items || []).forEach(it => {
    sold[it.name] = (sold[it.name] || 0) + (it.qty || 1);
  }));
  const topSold = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:var(--gold)">${PRODUCTS.length}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${t("products")}</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:var(--gold)">${orders.length}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${t("orders")}</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:var(--success)">$${totalSales.toLocaleString()}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">المبيعات</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:${newOrders ? "var(--danger)" : "var(--text)"}">${newOrders}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">طلبات جديدة</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:#f39c12">${lowStock}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">مخزون منخفض</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.6rem;font-weight:800;color:var(--danger)">${outStock}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">نفد المخزون</div>
    </div>
  </div>
  ${topSold.length ? `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px">
    <h4 style="color:var(--gold);margin-bottom:8px">الأكثر طلبًا</h4>
    ${topSold.map(([n, q], i) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>${i + 1}. ${n}</span><strong>${q}</strong></div>`).join("")}
  </div>` : ""}
  `;
}

async function renderAdminOrders() {
  const box = document.getElementById("adminOrdersBox");
  if (!box) return;
  const orders = await loadOrders();
  if (!orders.length) {
    box.innerHTML = `<p style="color:var(--text-muted)">لا توجد طلبات بعد</p>`;
    return;
  }
  box.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>رقم</th><th>العميل</th><th>المجموع</th><th>الحالة</th><th>تاريخ</th><th></th></tr></thead>
    <tbody>${orders.map(o => `
      <tr>
        <td>${o.order_number}</td>
        <td>${o.customer_name || "—"}<br><small>${o.customer_phone || ""}</small></td>
        <td>$${Number(o.total || 0).toLocaleString()}</td>
        <td>
          <select onchange="updateOrderStatus('${o.order_number}', this.value)" style="background:var(--input-bg);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px">
            ${["new","processing","completed","cancelled"].map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${t(s)}</option>`).join("")}
          </select>
        </td>
        <td style="font-size:0.75rem">${o.created_at ? new Date(o.created_at).toLocaleString("ar") : "—"}</td>
        <td><button onclick="alert(JSON.stringify(o.items||[],null,2))"><i class="fas fa-eye"></i></button></td>
      </tr>`).join("")}
    </tbody></table></div>`;
}

/* Patch admin panel to include dashboard + orders tabs */
const _origRenderAdmin = typeof renderAdminPanel === "function" ? renderAdminPanel : null;
if (_origRenderAdmin) {
  renderAdminPanel = async function() {
    await _origRenderAdmin();
    const page = document.getElementById("page-admin");
    if (!page || !sessionStorage.getItem("tk_admin")) return;
    const panel = page.querySelector(".admin-panel");
    if (!panel || document.getElementById("adminDash")) return;
    const dash = document.createElement("div");
    dash.id = "adminDash";
    dash.innerHTML = `<h3 style="color:var(--gold);margin:8px 0 12px"><i class="fas fa-chart-line"></i> ${t("stats")}</h3>
      <div id="adminStatsBox">جاري التحميل...</div>
      <h3 style="color:var(--gold);margin:20px 0 12px"><i class="fas fa-receipt"></i> ${t("orders")}</h3>
      <div id="adminOrdersBox"></div>`;
    panel.insertBefore(dash, panel.children[1] || null);
    document.getElementById("adminStatsBox").innerHTML = await renderAdminDashboard();
    await renderAdminOrders();
  };
}

/* Language button bind */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("langToggle");
  if (btn) {
    btn.textContent = t("language");
    btn.onclick = toggleLang;
  }
  document.documentElement.lang = LANG === "ar" ? "ar" : "en";
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
});

/* ========== Order Tracking (Customer) ========== */
function showTrackPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-track");
  if (!page) return;
  page.classList.add("active");
  currentView = "track";
  page.innerHTML = `
  <div class="detail-page">
    <button class="back-btn" onclick="location.hash='home'"><i class="fas fa-arrow-right"></i> رجوع</button>
    <h2 style="color:var(--gold);font-family:Orbitron,sans-serif;margin-bottom:8px"><i class="fas fa-truck"></i> تتبع الطلب</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">أدخل رقم الطلب الذي وصلك عند الإرسال</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
      <input id="trackInput" placeholder="مثال: TK-XXXX-123" style="flex:1;min-width:200px;background:var(--input-bg);border:1px solid var(--border);color:var(--text);padding:12px;border-radius:10px;font-family:inherit">
      <button class="btn-primary" onclick="trackOrder()"><i class="fas fa-search"></i> تتبع</button>
    </div>
    <div id="trackResult"></div>
  </div>`;
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  // support #track/ORDERNUM
  const parts = location.hash.slice(1).split("/");
  if (parts[0] === "track" && parts[1]) {
    document.getElementById("trackInput").value = decodeURIComponent(parts[1]);
    trackOrder();
  }
}

async function trackOrder() {
  const input = document.getElementById("trackInput");
  const box = document.getElementById("trackResult");
  if (!input || !box) return;
  const num = (input.value || "").trim().toUpperCase();
  if (!num) { showToast("أدخل رقم الطلب", "error"); return; }
  box.innerHTML = `<p style="color:var(--text-muted)">جاري البحث...</p>`;

  let order = null;
  // local
  const local = JSON.parse(localStorage.getItem("tk_orders") || "[]");
  order = local.find(o => (o.order_number || "").toUpperCase() === num);

  // supabase
  if (!order && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("orders").select("*").eq("order_number", num).maybeSingle();
      if (!error && data) order = data;
    } catch (e) { console.warn(e); }
  }

  if (!order) {
    box.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>لم يتم العثور على طلب بهذا الرقم</p>
      <p style="font-size:0.85rem;color:var(--text-muted)">تأكد من الرقم أو أن الطلب سُجّل من نفس المتصفح/قاعدة البيانات</p></div>`;
    return;
  }

  const statusMap = {
    new: { ar: "جديد", color: "var(--gold)", icon: "fa-clock" },
    processing: { ar: "قيد التجهيز", color: "#3498db", icon: "fa-cog" },
    completed: { ar: "مكتمل", color: "var(--success)", icon: "fa-check-circle" },
    cancelled: { ar: "ملغي", color: "var(--danger)", icon: "fa-times-circle" }
  };
  const st = statusMap[order.status] || statusMap.new;
  const items = order.items || [];
  const steps = ["new", "processing", "completed"];
  const curIdx = steps.indexOf(order.status);

  box.innerHTML = `
  <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px">
      <div>
        <div style="font-size:0.8rem;color:var(--text-muted)">رقم الطلب</div>
        <div style="font-weight:800;color:var(--gold);font-size:1.1rem">${order.order_number}</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:0.8rem;color:var(--text-muted)">الحالة</div>
        <div style="font-weight:800;color:${st.color}"><i class="fas ${st.icon}"></i> ${st.ar}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin:20px 0;position:relative">
      ${steps.map((s, i) => {
        const active = order.status === "cancelled" ? false : i <= curIdx;
        const label = statusMap[s].ar;
        return `<div style="flex:1;text-align:center;position:relative;z-index:1">
          <div style="width:28px;height:28px;border-radius:50%;margin:0 auto 6px;background:${active ? "var(--gold)" : "var(--lead)"};color:#111;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem">${i + 1}</div>
          <div style="font-size:0.7rem;color:${active ? "var(--gold)" : "var(--text-muted)"}">${label}</div>
        </div>`;
      }).join("")}
    </div>

    <div style="margin-bottom:12px;color:var(--text-muted);font-size:0.85rem">
      ${order.customer_name ? `العميل: ${order.customer_name}<br>` : ""}
      ${order.created_at ? `التاريخ: ${new Date(order.created_at).toLocaleString("ar")}<br>` : ""}
      المجموع: <strong style="color:var(--gold)">$${Number(order.total || 0).toLocaleString()}</strong>
    </div>

    <h4 style="color:var(--gold);margin:12px 0 8px">المنتجات</h4>
    ${(items.length ? items : []).map(it => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem">
        <span>${it.name} × ${it.qty || 1}</span>
        <span>$${(it.price * (it.qty || 1)).toLocaleString()}</span>
      </div>`).join("") || "<p style='color:var(--text-muted)'>—</p>"}
  </div>`;
}

// extend router
const __prevHandle = handleRoute;
handleRoute = function() {
  const hash = location.hash.slice(1) || "home";
  if (hash === "track" || hash.startsWith("track/")) {
    showTrackPage();
    return;
  }
  __prevHandle();
};


/* ========== Visual FX ========== */
function spawnParticles() {
  const box = document.getElementById("particles");
  if (!box) return;
  box.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = (8 + Math.random() * 12) + "s";
    p.style.animationDelay = (Math.random() * 10) + "s";
    p.style.width = p.style.height = (2 + Math.random() * 3) + "px";
    box.appendChild(p);
  }
}

function setupReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.12 });
  document.querySelectorAll(".product-card, .section-title, .hero").forEach(el => {
    el.classList.add("reveal");
    obs.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  spawnParticles();
  setTimeout(setupReveal, 800);
});
