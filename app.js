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

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadTheme();
  hideLoader();
  handleRoute();
  bindGlobal();
  window.addEventListener("hashchange", handleRoute);
});

function loadProducts() {
  const saved = localStorage.getItem("tk_products");
  PRODUCTS = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
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
      <input type="password" id="adminPass" placeholder="كلمة المرور">
      <button class="btn-primary" style="width:100%" onclick="adminLogin()">دخول</button>
      <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted)">الافتراضية: kingdom2026</p>
    </div>`;
    return;
  }
  renderAdminPanel();
}

function adminLogin() {
  const pass = document.getElementById("adminPass")?.value;
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem("tk_admin", "1");
    renderAdminPanel();
    showToast("مرحباً بك في لوحة التحكم", "success");
  } else showToast("كلمة المرور خاطئة", "error");
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
  renderAdminPanel();
}

function editProduct(id) { editingId = id; renderAdminPanel(); }
function deleteProduct(id) {
  if (!confirm("حذف هذا المنتج؟")) return;
  PRODUCTS = PRODUCTS.filter(p => p.id !== id);
  saveProducts();
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
