/**************************************************
 * SUPABASE
 **************************************************/
const SUPABASE_URL = "https://gaawqovwiplzdmqviqyl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdxb3Z3aXBsemRtcXZpcXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTA1NTcsImV4cCI6MjA4NDAyNjU1N30.N4qbON4Wqn0ghaUO8eCMMjwEIHhdH3693ySoJKZdVvU";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

/**************************************************
 * LOAD ALL PRODUCTS
 **************************************************/
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Load products error:", error);
    return;
  }

  allProducts = data || [];
  renderProducts(allProducts);
}

/**************************************************
 * LOAD BEST SELLERS
 **************************************************/
async function loadBestSellers() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_best_seller", true)
    .eq("is_active", true);

  if (error) {
    console.error("Best sellers error:", error);
    return;
  }

  renderProductsToGrid(data, "bestSellerGrid");
}

/**************************************************
 * LOAD NEW ARRIVALS
 **************************************************/
async function loadNewArrivals() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_new_arrival", true)
    .eq("is_active", true);

  if (error) {
    console.error("New arrivals error:", error);
    return;
  }

  renderProductsToGrid(data, "newArrivalGrid");
}

/**************************************************
 * RENDER ALL PRODUCTS
 **************************************************/
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  if (!products || products.length === 0) {
    grid.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product) => {
    renderSingleProduct(product, grid, true);
  });
}

/**************************************************
 * RENDER PRODUCTS TO SPECIFIC GRID
 **************************************************/
function renderProductsToGrid(products, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = "";

  if (!products || products.length === 0) {
    grid.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product) => {
    renderSingleProduct(product, grid, false);
  });
}

/**************************************************
 * SINGLE PRODUCT CARD (REUSABLE)
 **************************************************/
function renderSingleProduct(product, grid, withThumbs) {
  const images = [
    product.image_url_1,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
    product.image_url_5
  ].filter(Boolean);

  const mainImage = images[0] || "";

  const discountPercent =
    product.offer_price && product.original_price
      ? Math.round(
          ((product.original_price - product.offer_price) /
            product.original_price) * 100
        )
      : 0;

  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <div class="product-img-wrapper">

      <div class="product-main-img"
        style="background-image:url('${mainImage}')"></div>

      ${product.is_new_arrival ? `<span class="product-badge new">NEW ARRIVALS</span>` : ""}
      ${product.is_best_seller ? `<span class="product-badge best">BESTSELLER</span>` : ""}

      ${
        withThumbs && images.length > 1
          ? `<div class="product-thumbs">
              ${images
                .map(
                  (img, i) => `
                <div class="product-thumb ${i === 0 ? "active" : ""}"
                     style="background-image:url('${img}')"
                     data-img="${img}">
                </div>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>

    <h3>${product.name}</h3>

    ${
      product.offer_price
        ? `
        <p class="price">
          <span class="old-price">₹${product.original_price}</span>
          <span class="new-price">₹${product.offer_price}</span>
          <span class="discount">(${discountPercent}% OFF)</span>
        </p>`
        : `
        <p class="price">
          <span class="new-price">₹${product.original_price}</span>
        </p>`
    }

    <div class="product-actions">
      <button class="add-to-cart">Add to Cart</button>
      <button class="buy-now">Buy Now</button>
    </div>
  `;

  grid.appendChild(card);

  card.querySelector(".add-to-cart").onclick = () =>
    addToCart(product, mainImage);

  card.querySelector(".buy-now").onclick = () =>
    alert(`Buying ${product.name} (checkout coming soon)`);

  if (withThumbs) {
    const mainImg = card.querySelector(".product-main-img");
    const thumbs = card.querySelectorAll(".product-thumb");

    thumbs.forEach((thumb) => {
      thumb.onclick = () => {
        thumbs.forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
        mainImg.style.backgroundImage = `url('${thumb.dataset.img}')`;
      };
    });
  }
}

/**************************************************
 * CART HELPERS
 **************************************************/
function addToCart(product, image) {
  const existing = cart.find(item => item.id === product.id);

  if (existing) existing.qty++;
  else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.offer_price || product.original_price,
      image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  animateCartIcon();
  
}

function updateCartCount() {
  document.getElementById("cartCount").textContent =
    cart.reduce((s, i) => s + i.qty, 0);
}
function increaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty++;
  saveAndRefreshCart();
}

function decreaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty--;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveAndRefreshCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveAndRefreshCart();
}

function saveAndRefreshCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCartDrawer();
}

/**************************************************
 * CART DRAWER
 **************************************************/
let cartDrawer, cartOverlay, closeCartBtn, drawerItemsEl, drawerTotalEl;

function openCartDrawer() {
  renderCartDrawer();
  cartDrawer.classList.add("active");
  cartOverlay.classList.add("active");

  // lock scroll
  document.body.classList.add("cart-open");
}


function closeCartDrawer() {
  cartDrawer.classList.remove("active");
  cartOverlay.classList.remove("active");

  // unlock scroll
  document.body.classList.remove("cart-open");
}

function renderCartDrawer() {
  drawerItemsEl.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    drawerItemsEl.innerHTML = "<p>Your cart is empty</p>";
    drawerTotalEl.textContent = "0";
    return;
  }

  cart.forEach(item => {
    total += item.price * item.qty;

    drawerItemsEl.innerHTML += `
      <div class="drawer-item">
        <img src="${item.image}" />

        <div class="drawer-info">
          <h4>${item.name}</h4>
          <p class="drawer-price">₹${item.price}</p>

          <div class="qty-row">
            <button class="qty-btn" onclick="decreaseQty('${item.id}')">−</button>
            <span class="qty-count">${item.qty}</span>
            <button class="qty-btn" onclick="increaseQty('${item.id}')">+</button>
          </div>

          <button class="remove-item" onclick="removeItem('${item.id}')">
            Remove
          </button>
        </div>
      </div>
    `;
  });

  drawerTotalEl.textContent = total;
}
/**************************************************
 * CART ICON ANIMATION
 **************************************************/
function animateCartIcon() {
  const btn = document.querySelector(".cart-btn");
  btn.classList.remove("animate");
  void btn.offsetWidth;
  btn.classList.add("animate");
}

/**************************************************
 * HAMBURGER MENU
 **************************************************/
let menuDrawer, menuOverlay, closeMenuBtn;
function openMenu() {
  menuDrawer.classList.add("active");
  menuOverlay.classList.add("active");

  // DIFFERENT CLASS
  document.body.classList.add("menu-open");
}

function closeMenu() {
  menuDrawer.classList.remove("active");
  menuOverlay.classList.remove("active");

  document.body.classList.remove("menu-open");
}

function showBestSellers() {
  closeMenu();
  const filtered = allProducts.filter(p => p.is_best_seller === true);
  renderProducts(filtered);
}

function showNewArrivals() {
  closeMenu();
  const filtered = allProducts.filter(p => p.is_new_arrival === true);
  renderProducts(filtered);
}

function showAllProducts() {
  closeMenu();
  renderProducts(allProducts);
}

/**************************************************
 * INIT
 **************************************************/
document.addEventListener("DOMContentLoaded", async () => {

  loadProducts();
  setupSearch();
  updateCartCount();
document.getElementById("closeAuth")?.addEventListener("click", closeAuthModal);
document.getElementById("authOverlay")?.addEventListener("click", closeAuthModal);

  // ================================
// HAMBURGER MENU ACTION HANDLER
// ================================
document.querySelectorAll(".menu-links a[data-action]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const action = link.dataset.action;
    closeMenu(); // close drawer first

    switch (action) {
      case "login":
      openAuthModal();
      break;

      case "new":
        showNewArrivals();
        break;

      case "best":
        showBestSellers();
        break;

      case "all":
        showAllProducts();
        break;

      case "account":
        openMyAccount();
        break;

      case "orders":
        openMyOrders();
        break;

      case "about":
        window.location.href = "about.html";
        break;
    }
  });
});

  const { data } = await supabaseClient.auth.getUser();

const brand = document.querySelector(".brand-name");

if (brand) {
  const text = brand.innerText;
  brand.innerHTML = "";

  [...text].forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.animationDelay = `${i * 0.06}s`;
    span.classList.add("brand-char");
    brand.appendChild(span);
  });
}




  cartDrawer = document.getElementById("cartDrawer");
  cartOverlay = document.getElementById("cartOverlay");
  closeCartBtn = document.getElementById("closeCart");
  drawerItemsEl = document.getElementById("drawerCartItems");
  drawerTotalEl = document.getElementById("drawerTotal");

  menuDrawer = document.getElementById("menuDrawer");
  menuOverlay = document.getElementById("menuOverlay");
  closeMenuBtn = document.getElementById("closeMenu");

  document.querySelector(".cart-btn").onclick = openCartDrawer;
  closeCartBtn.onclick = closeCartDrawer;
  cartOverlay.onclick = closeCartDrawer;

  document.querySelector(".menu-toggle").onclick = openMenu;
  closeMenuBtn.onclick = closeMenu;
  menuOverlay.onclick = closeMenu;
});
function openSizeChart() {
  closeMenu();
  alert("Size chart modal coming next"); 
}

/**************************************************
 * SEARCH
 **************************************************/
function setupSearch() {
  document.getElementById("searchInput").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
  });
}
// expose cart functions globally
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.removeItem = removeItem;
function proceedToCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  window.location.href = "checkout.html";
}
function openAuthModal() {
  document.getElementById("authOverlay").style.display = "block";
  document.getElementById("authModal").style.display = "block";
  document.body.classList.add("auth-open");
}

function closeAuthModal() {
  document.getElementById("authOverlay").style.display = "none";
  document.getElementById("authModal").style.display = "none";
  document.body.classList.remove("auth-open");
}
