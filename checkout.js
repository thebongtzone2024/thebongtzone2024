let cart = JSON.parse(localStorage.getItem("cart")) || [];

const itemsEl = document.getElementById("checkoutItems");
const totalEl = document.getElementById("checkoutTotal");

function loadCheckout() {
  itemsEl.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
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

  totalEl.textContent = total;
}

function placeOrder() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  alert("Order placed successfully! (Payment integration next)");

  localStorage.removeItem("cart");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", loadCheckout);
