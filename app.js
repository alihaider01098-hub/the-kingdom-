/* ========== THE KINGDOM App ========== */

let cart = JSON.parse(localStorage.getItem("tk_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("tk_favs") || "[]");
let currentCategory = "all";
let searchQuery = "";
let brandFilter = "all";
let minPrice = 0;
let maxPrice = 99999;
let sortBy = "default";

// ========== Init ==========
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  renderCategories();
  renderBrandFilter();
  renderProducts();
  updateCartUI();
  updateFavCount();
  bindEvents();
});

function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  document.getElementById("brandFilter").addEventListener("change", (e) => {
    brandFilter = e.target.value;
    renderProducts();
  });

  document.getElementById("minPrice").addEventListener("change", (e) => {
    minPrice = Number(e.target.value) || 0;
    renderProducts();
  });

  document.getElementById("maxPrice").addEventListener("change", (e) => {
    maxPrice = Number(e.target.value) || 99999;
    renderProducts();
  });

  document.getElementById("sortBy").addEventListener("change", (e) => {
    sortBy = e.target.value;
    renderProducts();
  });

  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById("favBtn").addEventListener("click", showFavorites);
  document.getElementById("checkoutBtn").addEventListener("click", checkoutWhatsApp);
}

// ========== Theme ==========
function loadTheme() {
  const theme = localStorage.getItem("tk_theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("tk_theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggle");
  btn.innerHTML = theme === "dark"
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
}

// ========== Categories ==========
function renderCategories() {
  const nav = document.getElementById("catNav");
  nav.innerHTML = CATEGORIES.map((c) => `
    <button class="cat-btn ${c.id === currentCategory ? "active" : ""}"
            onclick="setCategory('${c.id}')">
      <i class="fas ${c.icon}"></i> ${c.name}
    </button>
  `).join("");
}

function setCategory(id) {
  currentCategory = id;
  renderCategories();
  renderProducts();
}

// ========== Brand Filter ==========
function renderBrandFilter() {
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))].sort();
  const select = document.getElementById("brandFilter");
  select.innerHTML = `<option value="all">كل الشركات</option>` +
    brands.map((b) => `<option value="${b}">${b}</option>`).join("");
}

// ========== Filter & Render Products ==========
function getFilteredProducts() {
  let list = [...PRODUCTS];

  if (currentCategory !== "all") {
    list = list.filter((p) => p.category === currentCategory);
  }
  if (searchQuery) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery) ||
      p.desc.toLowerCase().includes(searchQuery)
    );
  }
  if (brandFilter !== "all") {
    list = list.filter((p) => p.brand === brandFilter);
  }
  list = list.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return list;
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("resultsCount");
  const list = getFilteredProducts();

  countEl.textContent = `${list.length} منتج`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-search"></i>
        <p>لا توجد منتجات مطابقة للبحث أو الفلترة</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p) => {
    const isFav = favorites.includes(p.id);
    const badgeHtml = p.badge
      ? `<span class="product-badge ${p.badge === "عرض" ? "sale" : ""}">${p.badge}</span>`
      : "";
    return `
      <div class="product-card" onclick="openProduct(${p.id})">
        <div class="product-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=300&fit=crop'">
          ${badgeHtml}
          <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation();toggleFav(${p.id})">
            <i class="${isFav ? "fas" : "far"} fa-heart"></i>
          </button>
        </div>
        <div class="product-body">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-footer">
            <div class="price">$${p.price.toLocaleString()}
              <span class="iqd">≈ ${(p.price * USD_TO_IQD).toLocaleString()} د.ع</span>
            </div>
            <button class="add-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})">
              <i class="fas fa-cart-plus"></i> أضف
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

// ========== Product Modal ==========
function openProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  document.getElementById("modalImg").src = p.image;
  document.getElementById("modalBrand").textContent = p.brand;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalDesc").textContent = p.desc;
  document.getElementById("modalPrice").innerHTML =
    `$${p.price.toLocaleString()} <small style="font-size:0.8rem;color:var(--text-muted)">≈ ${(p.price * USD_TO_IQD).toLocaleString()} د.ع</small>`;

  document.getElementById("modalSpecs").innerHTML =
    (p.specs || []).map((s) => {
      const parts = s.split(":");
      return parts.length > 1
        ? `<li><strong>${parts[0]}:</strong> ${parts.slice(1).join(":")}</li>`
        : `<li>${s}</li>`;
    }).join("");

  document.getElementById("modalAddCart").onclick = () => addToCart(id);
  document.getElementById("modalBuy").href = p.link;

  const favBtn = document.getElementById("modalFav");
  const isFav = favorites.includes(id);
  favBtn.innerHTML = `<i class="${isFav ? "fas" : "far"} fa-heart"></i> ${isFav ? "بالمفضلة" : "مفضلة"}`;
  favBtn.onclick = () => { toggleFav(id); openProduct(id); };

  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

// ========== Cart ==========
function addToCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const existing = cart.find((c) => c.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`تمت إضافة ${p.name} للسلة`);
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); renderCartItems(); }
}

function saveCart() {
  localStorage.setItem("tk_cart", JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById("cartCount").textContent = total;
  document.getElementById("cartCount").style.display = total > 0 ? "flex" : "none";
}

function openCart() {
  renderCartItems();
  document.getElementById("cartOverlay").classList.add("open");
  document.getElementById("cartDrawer").classList.add("open");
}

function closeCart() {
  document.getElementById("cartOverlay").classList.remove("open");
  document.getElementById("cartDrawer").classList.remove("open");
}

function renderCartItems() {
  const container = document.getElementById("cartItems");
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart"></i>
        <p>السلة فارغة</p>
      </div>`;
    document.getElementById("cartTotal").textContent = "$0";
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((c) => {
    total += c.price * c.qty;
    return `
      <div class="cart-item">
        <img src="${c.image}" alt="${c.name}">
        <div class="cart-item-info">
          <h4>${c.name}</h4>
          <div class="price">$${(c.price * c.qty).toLocaleString()}</div>
          <div class="cart-item-qty">
            <button onclick="changeQty(${c.id}, -1)">−</button>
            <span>${c.qty}</span>
            <button onclick="changeQty(${c.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${c.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
  }).join("");

  document.getElementById("cartTotal").textContent = `$${total.toLocaleString()}`;
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    showToast("السلة فارغة");
    return;
  }
  let msg = "مرحباً، أريد طلب المنتجات التالية من THE KINGDOM:%0A%0A";
  let total = 0;
  cart.forEach((c) => {
    msg += `• ${c.name} x${c.qty} = $${c.price * c.qty}%0A`;
    total += c.price * c.qty;
  });
  msg += `%0Aالمجموع: $${total}`;
  // غيّر الرقم لرقم واتسابك
  const phone = "9647000000000";
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

// ========== Favorites ==========
function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((f) => f !== id);
    showToast("تمت الإزالة من المفضلة");
  } else {
    favorites.push(id);
    showToast("تمت الإضافة للمفضلة");
  }
  localStorage.setItem("tk_favs", JSON.stringify(favorites));
  updateFavCount();
  renderProducts();
}

function updateFavCount() {
  const el = document.getElementById("favCount");
  el.textContent = favorites.length;
  el.style.display = favorites.length > 0 ? "flex" : "none";
}

function showFavorites() {
  if (favorites.length === 0) {
    showToast("لا توجد منتجات في المفضلة");
    return;
  }
  currentCategory = "all";
  brandFilter = "all";
  searchQuery = "";
  document.getElementById("searchInput").value = "";
  document.getElementById("brandFilter").value = "all";
  minPrice = 0;
  maxPrice = 99999;

  const grid = document.getElementById("productsGrid");
  const list = PRODUCTS.filter((p) => favorites.includes(p.id));
  document.getElementById("resultsCount").textContent = `${list.length} في المفضلة`;
  renderCategories();

  grid.innerHTML = list.map((p) => {
    return `
      <div class="product-card" onclick="openProduct(${p.id})">
        <div class="product-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <button class="fav-btn active" onclick="event.stopPropagation();toggleFav(${p.id})">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="product-body">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-footer">
            <div class="price">$${p.price.toLocaleString()}</div>
            <button class="add-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})">
              <i class="fas fa-cart-plus"></i> أضف
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

// ========== Toast ==========
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ========== Firebase (اختياري) ==========
  لتفعيل Firebase:
  1. أنشئ مشروع على https://console.firebase.google.com
  2. أضف تطبيق Web وانسخ الإعدادات
  3. ألغِ التعليق عن الكود أدناه وضع إعداداتك
  4. أنشئ مجموعة "products" في Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadFromFirebase() {
  const snap = await getDocs(collection(db, "products"));
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  if (items.length) {
    PRODUCTS.length = 0;
    PRODUCTS.push(...items);
    renderBrandFilter();
    renderProducts();
  }
}
// loadFromFirebase();
*/
