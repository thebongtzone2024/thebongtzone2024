document.addEventListener("DOMContentLoaded", async () => {
  /* ================= SUPABASE ================= */
  const SUPABASE_URL = "https://gaawqovwiplzdmqviqyl.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdxb3Z3aXBsemRtcXZpcXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTA1NTcsImV4cCI6MjA4NDAyNjU1N30.N4qbON4Wqn0ghaUO8eCMMjwEIHhdH3693ySoJKZdVvU";

  const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { auth: { persistSession: true } }
  );
  const bannerImage = document.getElementById("bannerImage");
const bannerPreview = document.getElementById("bannerPreview");
  bannerImage.addEventListener("change", () => {
  const file = bannerImage.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById("bannerPreview");
    preview.src = reader.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});


  /* ================= AUTH ================= */
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "admin-login.html";
    return;
  }
  let editingProductId = null;
const stockModal = document.getElementById("stockModal");
const sizeStockList = document.getElementById("sizeStockList");
document.getElementById("saveStock").onclick = async () => {
  const checkboxes =
    document.querySelectorAll("#sizeStockList input[type='checkbox']");

  if (checkboxes.length === 0) {
    alert("No sizes found");
    return;
  }

  for (const checkbox of checkboxes) {
    const sizeId = checkbox.dataset.id;
    const inStock = checkbox.checked;

    const { error } = await supabaseClient
      .from("product_sizes")
      .update({ in_stock: inStock })
      .eq("id", sizeId);

    if (error) {
      console.error("Size update error:", error);
      alert("Failed to update size stock");
      return;
    }
  }

  // Close modal AFTER updates
  document.getElementById("stockModal").classList.add("hidden");
  editingProductId = null;

  // 🔴 VERY IMPORTANT
  await syncProductStock();
  loadAdminProducts();
};
document.getElementById("cancelStock").onclick = () => {
  document.getElementById("stockModal").classList.add("hidden");
  editingProductId = null;
};

async function syncProductStock() {
  const { data, error } = await supabaseClient
    .from("product_sizes")
    .select("product_id, in_stock");

  if (error) {
    console.error("Sync error:", error);
    return;
  }

  const productStockMap = {};

  // Build stock map
  data.forEach(row => {
    if (!(row.product_id in productStockMap)) {
      productStockMap[row.product_id] = false;
    }
    if (row.in_stock === true) {
      productStockMap[row.product_id] = true;
    }
  });

  // Update products table
  for (const productId in productStockMap) {
    await supabaseClient
      .from("products")
      .update({ is_active: productStockMap[productId] })
      .eq("id", productId);
  }
}
  /* ================= SIDEBAR ================= */
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  menuBtn.onclick = () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  };
  overlay.onclick = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  };

  document.querySelectorAll(".sidebar a[data-section]").forEach(link => {
    link.onclick = () => {
      document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
      document.getElementById(link.dataset.section).classList.add("active");
      link.classList.add("active");
      sidebar.classList.remove("open");
      overlay.classList.remove("show");

      if (link.dataset.section === "orders") {
        loadAdminOrders();
      }
    };
  });

  /* ================= LOGOUT ================= */
  document.getElementById("logoutBtn").onclick = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "admin-login.html";
  };

  /* ================= PRODUCTS (UNCHANGED) ================= */
  let existingImages = [];

  const editModal = document.getElementById("editModal");
  const editName = document.getElementById("editName");
  const editOriginalPrice = document.getElementById("editOriginalPrice");
  const editOfferPrice = document.getElementById("editOfferPrice");
  const editDescription = document.getElementById("editDescription");
  const editBestSeller = document.getElementById("editBestSeller");
  const editNewArrival = document.getElementById("editNewArrival");
  const editActive = document.getElementById("editActive");
  const editImages = document.getElementById("editImages");
  const editImagePreview = document.getElementById("editImagePreview");

  document.getElementById("cancelEdit").onclick = () => {
    editModal.classList.add("hidden");
    editingProductId = null;
    existingImages = [];
  };

  document.getElementById("saveEdit").onclick = async () => {
    if (!editingProductId) return;

    let imageUrls = [...existingImages];

    const files = editImages.files;
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const path = `products/${crypto.randomUUID()}-${files[i].name}`;
      await supabaseClient.storage.from("product-images").upload(path, files[i], { upsert: true });
      const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
      imageUrls[i] = data.publicUrl;
    }
    const sellingPrice = editOfferPrice.value
  ? Number(editOfferPrice.value)
  : Number(editOriginalPrice.value);

    await supabaseClient.from("products").update({
      name: editName.value,
      description: editDescription.value,
      original_price: Number(editOriginalPrice.value),
      offer_price: editOfferPrice.value ? Number(editOfferPrice.value) : null,
      price: sellingPrice,  
      is_best_seller: editBestSeller.checked,
      is_new_arrival: editNewArrival.checked,
      is_active: editActive.checked,
      image_url_1: imageUrls[0] || null,
      image_url_2: imageUrls[1] || null,
      image_url_3: imageUrls[2] || null,
      image_url_4: imageUrls[3] || null,
      image_url_5: imageUrls[4] || null,
    }).eq("id", editingProductId);

    editModal.classList.add("hidden");
    editingProductId = null;
    loadAdminProducts();
  };
  
  /* ================= PRODUCTS ================= */
  const productList = document.getElementById("productList");
  /* ================= ADD PRODUCT ================= */
const productForm = document.getElementById("productForm");

productForm.addEventListener("submit", async (e) => {
  const sizesRaw = document.getElementById("sizes").value;

  e.preventDefault();
   
  const name = document.getElementById("name").value.trim();
  const originalPrice = Number(document.getElementById("originalPrice").value);
  const offerPrice = document.getElementById("offerPrice").value
    ? Number(document.getElementById("offerPrice").value)
    : null;
  const costPrice = Number(document.getElementById("costPrice").value);
  const description = document.getElementById("description").value.trim();

  const isBestSeller = document.getElementById("isBestSeller").checked;
  const isNewArrival = document.getElementById("isNewArrival").checked;
  const isActive = document.getElementById("isActive").checked;

  const imagesInput = document.getElementById("images");
  const files = imagesInput.files;

  if (!name || !originalPrice || !costPrice) {
    alert("Please fill required fields");
    return;
  }
const sizes = sizesRaw
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => s.toUpperCase());

const uniqueSizes = [...new Set(sizes)];

if (uniqueSizes.length === 0) {
  alert("Please add at least one size");
  return;
}

  // 🔹 Upload images
  const imageUrls = [];
  for (let i = 0; i < Math.min(files.length, 5); i++) {
    const path = `products/${crypto.randomUUID()}-${files[i].name}`;
    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(path, files[i]);

    if (uploadError) {
      alert("Image upload failed");
      console.error(uploadError);
      return;
    }

    const { data } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(path);

    imageUrls.push(data.publicUrl);
  }

  // 🔹 Insert product
  const sellingPrice =
  offerPrice !== null && offerPrice > 0
    ? offerPrice
    : originalPrice;

  const { data: product, error } = await supabaseClient
  .from("products")
  .insert({
    name,
    description,
    original_price: originalPrice,
    offer_price: offerPrice,
    price: sellingPrice,
    cost_price: costPrice,
    is_best_seller: isBestSeller,
    is_new_arrival: isNewArrival,
    is_active: true,
    image_url_1: imageUrls[0] || null,
    image_url_2: imageUrls[1] || null,
    image_url_3: imageUrls[2] || null,
    image_url_4: imageUrls[3] || null,
    image_url_5: imageUrls[4] || null,
  })
  .select()
  .single();

  if (error) {
    alert("Failed to add product");
    console.error(error);
    return;
  }
  const sizeRows = uniqueSizes.map(size => ({
  product_id: product.id,
  size,
  in_stock: true
}));

const { error: sizeError } = await supabaseClient
  .from("product_sizes")
  .insert(sizeRows);

if (sizeError) {
  alert("Failed to save sizes");
  console.error(sizeError);
  return;
}

  // ✅ Reset + reload
  productForm.reset();
  document.getElementById("imagePreview").innerHTML = "";
  loadAdminProducts();
});

  async function loadAdminProducts() {
    const { data } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    productList.innerHTML = "";

    for (const p of data) {
    const { data: sizes } = await supabaseClient
    .from("product_sizes")
    .select("size, in_stock")
    .eq("product_id", p.id);
    let sizesHtml = "";

if (sizes && sizes.length > 0) {
  sizesHtml = sizes
    .map(s =>
      `<span class="size-badge ${s.in_stock ? "in" : "out"}">
        ${s.size}
      </span>`
    )
    .join("");
} else {
  sizesHtml = `<span class="size-badge out">No sizes</span>`;
}
const allSizesOut =
  sizes && sizes.length > 0 && sizes.every(s => s.in_stock === false);

      const discount = p.offer_price
        ? Math.round(((p.original_price - p.offer_price) / p.original_price) * 100)
        : null;

      const card = document.createElement("div");
      card.className = "admin-product";

      card.innerHTML = `
      
        <img src="${p.image_url_1 || "https://via.placeholder.com/70"}">
        <div>
          <strong>${p.name}</strong><br>
          ${
            p.offer_price
              ? `<del>₹${p.original_price}</del> <b>₹${p.offer_price}</b>
                 <span style="color:#f4b400">(${discount}% OFF)</span>`
              : `₹${p.original_price}`
          }
          <div class="admin-sizes">
  <strong>Sizes:</strong>
  ${sizesHtml}
</div>

${allSizesOut ? `<div class="stock-label out">OUT OF STOCK</div>` : ""}

          <br>
          <small>
            ${p.is_best_seller ? "🔥 Best Seller " : ""}
            ${p.is_new_arrival ? "🆕 New Arrival" : ""}
          </small>
        </div>
        <div class="admin-actions">
          <button class="btn-primary edit-btn">Edit</button>
          <button class="btn-warning stock-btn">Out of Stock</button>
          <button class="btn-danger delete-btn">Delete</button>
        </div>
      `;
       card.querySelector(".stock-btn").onclick = async () => {
  editingProductId = p.id;
  sizeStockList.innerHTML = "";

  const { data: sizes, error } = await supabaseClient
    .from("product_sizes")
    .select("*")
    .eq("product_id", p.id);

  if (error) {
    alert("Failed to load sizes");
    console.error(error);
    return;
  }

  sizes.forEach(s => {
    const row = document.createElement("div");
    row.innerHTML = `
      <label>
        <input
          type="checkbox"
          data-id="${s.id}"
          ${s.in_stock ? "checked" : ""}
        />
        ${s.size}
      </label>
    `;
    sizeStockList.appendChild(row);
  });

  stockModal.classList.remove("hidden");
};

      card.querySelector(".edit-btn").onclick = () => {
        editingProductId = p.id;

        editName.value = p.name;
        editOriginalPrice.value = p.original_price;
        editOfferPrice.value = p.offer_price || "";
        editDescription.value = p.description || "";
        editBestSeller.checked = p.is_best_seller;
        editNewArrival.checked = p.is_new_arrival;
        editActive.checked = p.is_active;

        existingImages = [
          p.image_url_1,
          p.image_url_2,
          p.image_url_3,
          p.image_url_4,
          p.image_url_5
        ].filter(Boolean);

        editImagePreview.innerHTML = "";
        existingImages.forEach(url => {
          const img = document.createElement("img");
          img.src = url;
          editImagePreview.appendChild(img);
        });

        editModal.classList.remove("hidden");
      };

      card.querySelector(".delete-btn").onclick = async () => {
        if (!confirm("Delete product permanently?")) return;
        await supabaseClient.from("products").delete().eq("id", p.id);
        loadAdminProducts();
      };

      productList.appendChild(card);
    }
  }
  /* ================= DASHBOARD CHARTS (UNCHANGED) ================= */
  let dailyChart, monthlyChart;

  async function loadRevenueCharts() {
    const { data: orders } = await supabaseClient
      .from("orders")
      .select("total_amount, created_at");

    const dailyMap = {};
    const monthlyMap = {};

    (orders || []).forEach(o => {
      const d = new Date(o.created_at);
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      const month = d.toLocaleDateString("en-US", { month: "short" });

      dailyMap[day] = (dailyMap[day] || 0) + o.total_amount;
      monthlyMap[month] = (monthlyMap[month] || 0) + o.total_amount;
    });

    const dailyLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const dailyData = dailyLabels.map(d => dailyMap[d] || 0);

    const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthData = monthLabels.map(m => monthlyMap[m] || 0);

    if (dailyChart) dailyChart.destroy();
    if (monthlyChart) monthlyChart.destroy();

    dailyChart = new Chart(document.getElementById("dailyChart"), {
      type: "line",
      data: {
        labels: dailyLabels,
        datasets: [{
          label: "Daily Revenue",
          data: dailyData,
          borderColor: "#f4b400",
          tension: 0.4
        }]
      }
    });

    monthlyChart = new Chart(document.getElementById("monthlyChart"), {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [{
          label: "Monthly Revenue",
          data: monthData,
          backgroundColor: "#f4b400"
        }]
      }
    });
  }

  /* ================= ORDERS (3B + 3C) ================= */
  async function loadAdminOrders() {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Order fetch error:", error);
      return;
    }

    const table = document.getElementById("ordersTable");
    if (!table) return;

    table.innerHTML = "";

    data.forEach(o => {
      table.innerHTML += `
        <tr>
          <td>${o.gokwik_order_id}</td>
          <td>${o.customer_email || "-"}</td>
          <td>₹${o.total_amount}</td>
          <td>${o.payment_status}</td>
          <td>${o.order_status}</td>
          <td>
            <select onchange="updateOrderStatus('${o.id}', this.value)">
              <option ${o.order_status==="CREATED"?"selected":""}>CREATED</option>
              <option ${o.order_status==="PAID"?"selected":""}>PAID</option>
              <option ${o.order_status==="SHIPPED"?"selected":""}>SHIPPED</option>
              <option ${o.order_status==="DELIVERED"?"selected":""}>DELIVERED</option>
              <option ${o.order_status==="CANCELLED"?"selected":""}>CANCELLED</option>
            </select>
          </td>
        </tr>
      `;
    });
  }

  window.updateOrderStatus = async (orderId, status) => {
    const { error } = await supabaseClient
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    if (error) {
      alert("Failed to update order");
      console.error(error);
      return;
    }

    loadAdminOrders();
    loadRevenueCharts();
    loadDashboardKPIs();
    loadRealProfit();


  };
async function loadDashboardKPIs() {
  const { data: orders, error } = await supabaseClient
    .from("orders")
    .select("total_amount, created_at, payment_status");

  if (error) {
    console.error("KPI fetch error:", error);
    return;
  }

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalOrders = 0;
  let todayRevenue = 0;
  let monthlyRevenue = 0;

  (orders || []).forEach(o => {
    if (o.payment_status !== "PAID") return;

    totalOrders += 1;

    const orderDate = new Date(o.created_at);

    if (orderDate >= startOfToday) {
      todayRevenue += Number(o.total_amount || 0);
    }

    if (orderDate >= startOfMonth) {
      monthlyRevenue += Number(o.total_amount || 0);
    }
  });

  document.getElementById("totalOrders").innerText = totalOrders;
  document.getElementById("totalRevenue").innerText = `₹${todayRevenue.toFixed(2)}`;
  document.getElementById("monthlyRevenue").innerText = `₹${monthlyRevenue.toFixed(2)}`;
}

async function loadRealProfit() {
  const { data, error } = await supabaseClient
    .from("order_items")
    .select(`
      price,
      quantity,
      products ( cost_price )
    `);

  if (error) {
    console.error("Profit fetch error:", error);
    return;
  }

  let totalProfit = 0;

  (data || []).forEach(item => {
    if (!item.products?.cost_price) return;

    totalProfit +=
      (Number(item.price) - Number(item.products.cost_price)) *
      Number(item.quantity);
  });

  document.getElementById("totalProfit").innerText =
    `₹${totalProfit.toFixed(2)}`;
}
/* ================= COUPONS ================= */

const couponForm = document.getElementById("couponForm");
const couponList = document.getElementById("couponList");
couponForm.addEventListener("submit", async e => {
  e.preventDefault();

  const code = document
    .getElementById("couponCode")
    .value
    .trim()
    .toUpperCase();

  const discount = Number(
    document.getElementById("couponDiscount").value
  );

  const minAmount = Number(
    document.getElementById("couponMinAmount").value
  );

  const active = document.getElementById("couponActive").checked;

  if (!code || !discount || minAmount < 0) {
    alert("Please fill all coupon fields correctly");
    return;
  }

  const { error } = await supabaseClient
    .from("coupons")
    .insert({
      code,
      discount,
      min_amount: minAmount,
      active
    });

  if (error) {
    alert("Failed to create coupon");
    console.error(error);
    return;
  }

  couponForm.reset();
  loadCoupons();
});
async function loadCoupons() {
  const { data, error } = await supabaseClient
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Coupon fetch error:", error);
    return;
  }

  couponList.innerHTML = "";

  data.forEach(c => {
    const div = document.createElement("div");
    div.className = "admin-product";

    div.innerHTML = `
      <strong>${c.code}</strong>
      <p>${c.discount}% OFF on orders above ₹${c.min_amount}</p>
      <small>Status: ${c.active ? "Active" : "Inactive"}</small>
      <div class="admin-actions">
        <button class="btn-warning toggle-btn">
          ${c.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    `;

    div.querySelector(".toggle-btn").onclick = async () => {
      await toggleCoupon(c.id, !c.active);
    };

    couponList.appendChild(div);
  });
}
async function toggleCoupon(id, newStatus) {
  const { error } = await supabaseClient
    .from("coupons")
    .update({ active: newStatus })
    .eq("id", id);

  if (error) {
    alert("Failed to update coupon");
    console.error(error);
    return;
  }

  loadCoupons();
}

/* ================= BANNERS (SUPABASE DB) ================= */

const bannerForm = document.getElementById("bannerForm");
const bannerList = document.getElementById("bannerList");

async function loadBanners() {
  const { data, error } = await supabaseClient
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Banner fetch error:", error);
    return;
  }

  bannerList.innerHTML = "";

  data.forEach(b => {
    const div = document.createElement("div");
    div.className = "admin-product";

    div.innerHTML = `
      <img src="${b.image_url}" style="width:100%; border-radius:8px">
      <strong>${b.title || ""}</strong>
      <p>${b.subtitle || ""}</p>
      <small>${b.is_active ? "Active" : "Inactive"}</small>
      <br>
      <button class="btn-danger">Delete</button>
    `;

    div.querySelector("button").onclick = async () => {
      if (!confirm("Delete banner?")) return;
      await supabaseClient.from("banners").delete().eq("id", b.id);
      loadBanners();
    };

    bannerList.appendChild(div);
  });
}

bannerForm.addEventListener("submit", async e => {
  e.preventDefault();

  const file = bannerImage.files[0];
  if (!file) {
    alert("Please upload banner image");
    return;
  }

  // Upload image to Supabase Storage
  const path = `banners/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("banner-images")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    alert("Image upload failed");
    console.error(uploadError);
    return;
  }

  const { data: imageData } = supabaseClient
    .storage
    .from("banner-images")
    .getPublicUrl(path);

  // Insert banner into DB
  const { error } = await supabaseClient.from("banners").insert({
    title: bannerTitle.value,
    subtitle: bannerSubtitle.value,
    link: bannerLink.value,
    image_url: imageData.publicUrl,
    is_active: bannerActive.checked,
    position: "home"
  });

  if (error) {
    alert("Failed to save banner");
    console.error(error);
    return;
  }

  bannerForm.reset();
  bannerPreview.style.display = "none";
  loadBanners();
});

loadBanners();


  /* ================= INIT ================= */
  loadAdminProducts(); 
  loadAdminOrders();
  loadRevenueCharts();
  loadDashboardKPIs(); 
  loadRealProfit()
  loadCoupons();
}); 
