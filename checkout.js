// 🔹 Supabase client (INLINE, no conflict)
const supabaseClient = window.supabase.createClient(
  "https://gaawqovwiplzdmqviqyl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdxb3Z3aXBsemRtcXZpcXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTA1NTcsImV4cCI6MjA4NDAyNjU1N30.N4qbON4Wqn0ghaUO8eCMMjwEIHhdH3693ySoJKZdVvU"
);

// 🔹 Cart data
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const itemsEl = document.getElementById("checkoutItems");
const totalEl = document.getElementById("checkoutTotal");

let originalTotal = 0;
let discountedTotal = 0;
let coupons = [];

// 🔹 Load checkout items
function loadCheckout() {
  itemsEl.innerHTML = "";
  let total = 0;

  if (!cart || cart.length === 0) {
    itemsEl.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "0";
    return;
  }

  cart.forEach(item => {
    total += item.price * item.qty;

    itemsEl.innerHTML += `
      <div class="checkout-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>₹${item.price}</p>
          <div class="qty">Quantity: ${item.qty}</div>
        </div>
      </div>
    `;
  });

  originalTotal = total;
  discountedTotal = total;
  totalEl.textContent = total;
}

// 🔹 Fetch coupons from Supabase
async function fetchCoupons() {
  const { data, error } = await supabaseClient
    .from("coupons")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error("Coupon fetch error:", error);
    return;
  }

  coupons = data || [];
  showAvailableCoupons();
}

// 🔹 Show available coupons
function showAvailableCoupons() {
  const list = document.getElementById("availableCoupons");
  list.innerHTML = "";

  coupons.forEach(c => {
    list.innerHTML += `
      <li>
        <strong>${c.code}</strong><br>
        Get ${c.discount}% off on orders above ₹${c.min_amount}
      </li>
    `;
  });
}

// 🔹 Apply coupon
function applyCoupon() {
  const input = document
    .getElementById("couponInput")
    .value
    .trim()
    .toUpperCase();

  const message = document.getElementById("couponMessage");

  const coupon = coupons.find(c => c.code === input);

  if (!coupon) {
    message.textContent = "Invalid coupon code";
    return;
  }

  if (originalTotal < coupon.min_amount) {
    message.textContent = `Minimum order ₹${coupon.min_amount} required`;
    return;
  }

  const discountAmount = (originalTotal * coupon.discount) / 100;
  discountedTotal = Math.floor(originalTotal - discountAmount);

  totalEl.textContent = discountedTotal;
  message.textContent = `Coupon applied! You saved ₹${discountAmount}`;
}

// 🔹 Place order
function placeOrder() {
  if (!cart || cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  alert("Order placed successfully!");

  localStorage.removeItem("cart");
  window.location.href = "index.html";
}

// 🔹 Init
document.addEventListener("DOMContentLoaded", () => {
  loadCheckout();
  fetchCoupons();
});
