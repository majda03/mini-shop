// ====== PRODUCT DATA ======
const products = [
  {
    id: 1,
    name: "Glow Serum",
    description: "Hydrating face serum for daily use.",
    price: 35.0,
    category: "serum",
    image: "img/glow-serum.jpeg"
  },
  {
    id: 2,
    name: "Velvet Moisturizer",
    description: "Lightweight cream with a satin finish.",
    price: 29.0,
    category: "cream",
    image: "img/velvet-cream.jpeg"
  },
  {
    id: 3,
    name: "Night Repair Mask",
    description: "Overnight mask for deep regeneration.",
    price: 42.0,
    category: "mask",
    image: "img/night-mask.jpg"
  },
  {
    id: 4,
    name: "Daily Cleanser",
    description: "Gentle cleanser for all skin types.",
    price: 19.0,
    category: "cleanser",
    image: "img/daily-cleanser.jpg"
  }
];

let cart = [];
let favourites = []; // wishlist product IDs
let currentFilter = "all";
let currentSearch = "";

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartShippingEl = document.getElementById("cart-shipping");
const cartTotalEl = document.getElementById("cart-total");
const checkoutForm = document.getElementById("checkout-form");
const checkoutMessageEl = document.getElementById("checkout-message");
const searchInput = document.getElementById("search-input");
const themeToggleBtn = document.getElementById("theme-toggle");
const toastEl = document.getElementById("toast");

const SHIPPING_COST = 5.0;

/* ========== LOCAL STORAGE HELPERS ========== */
function loadCartFromStorage() {
  const saved = localStorage.getItem("miniShopCart");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) cart = parsed;
  } catch (e) {
    console.error("Error parsing cart:", e);
  }
}

function saveCartToStorage() {
  localStorage.setItem("miniShopCart", JSON.stringify(cart));
}

function loadFavouritesFromStorage() {
  const saved = localStorage.getItem("miniShopFavourites");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) favourites = parsed;
  } catch (e) {
    console.error("Error parsing favourites:", e);
  }
}

function saveFavouritesToStorage() {
  localStorage.setItem("miniShopFavourites", JSON.stringify(favourites));
}

function loadThemeFromStorage() {
  const saved = localStorage.getItem("miniShopTheme");
  if (saved === "light") {
    document.body.classList.add("light-mode");
  }
}

function saveThemeToStorage(theme) {
  localStorage.setItem("miniShopTheme", theme);
}

/* ========== TOAST (POPUP) ========== */
let toastTimeoutId = null;
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, 1800);
}

/* ========== PRODUCTS RENDER ========== */
function renderProducts() {
  productListEl.innerHTML = "";

  const search = currentSearch.toLowerCase();

  const filtered = products.filter((product) => {
    const matchesCategory =
      currentFilter === "all" || product.category === currentFilter;

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    productListEl.innerHTML =
      '<p class="cart-empty">No products match your search.</p>';
    return;
  }

  filtered.forEach((product) => {
    const isFav = favourites.includes(product.id);

    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <button 
        class="wishlist-btn ${isFav ? "active" : ""}" 
        data-id="${product.id}" 
        aria-label="Toggle favourite"
      >
        ${isFav ? "❤" : "♡"}
      </button>

      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-description">${product.description}</p>
      <div class="product-bottom">
        <span class="product-price">${product.price.toFixed(2)} KM</span>
        <button class="btn-primary" data-id="${product.id}">
          Add to cart
        </button>
      </div>
    `;

    productListEl.appendChild(card);
  });

  // Add-to-cart buttons
  document
    .querySelectorAll(".btn-primary[data-id]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"), 10);
        addToCart(id);
      })
    );

  // Wishlist buttons
  document
    .querySelectorAll(".wishlist-btn[data-id]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"), 10);
        toggleFavourite(id);
      })
    );
}

/* ========== FILTERI ========== */
function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      currentFilter = category;

      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderProducts();
    });
  });
}

/* ========== SEARCH ========== */
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    renderProducts();
  });
}

/* ========== WISHLIST ========== */
function toggleFavourite(productId) {
  const index = favourites.indexOf(productId);
  if (index >= 0) {
    favourites.splice(index, 1);
    showToast("Removed from favourites");
  } else {
    favourites.push(productId);
    showToast("Added to favourites");
  }
  saveFavouritesToStorage();
  renderProducts();
}

/* ========== CART LOGIC ========== */
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCartToStorage();
  renderCart();
  showToast("Added to cart");
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
  } else {
    cart.forEach((item) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";

      cartItem.innerHTML = `
        <div>
          <div class="cart-item-header">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">
              ${(item.price * item.quantity).toFixed(2)} KM
            </span>
          </div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-action="decrease" data-id="${
              item.id
            }">-</button>
            <span class="cart-qty">${item.quantity}</span>
            <button class="cart-qty-btn" data-action="increase" data-id="${
              item.id
            }">+</button>
            <span class="cart-remove" data-action="remove" data-id="${
              item.id
            }">Remove</span>
          </div>
        </div>
      `;

      cartItemsEl.appendChild(cartItem);
    });
  }

  updateSummary();
  attachCartEvents();
}

function attachCartEvents() {
  const buttons = cartItemsEl.querySelectorAll("[data-action]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      const id = parseInt(btn.getAttribute("data-id"), 10);

      if (action === "increase") {
        changeQuantity(id, 1);
      } else if (action === "decrease") {
        changeQuantity(id, -1);
      } else if (action === "remove") {
        removeFromCart(id);
      }
    });
  });
}

function changeQuantity(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  }

  saveCartToStorage();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((i) => i.id !== productId);
  saveCartToStorage();
  renderCart();
}

/* ========== SUMMARY ========== */
function updateSummary() {
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  cartSubtotalEl.textContent = `${subtotal.toFixed(2)} KM`;
  cartShippingEl.textContent = `${shipping.toFixed(2)} KM`;
  cartTotalEl.textContent = `${total.toFixed(2)} KM`;
  cartCountEl.textContent = itemCount;
}

/* ========== CHECKOUT ========== */
checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    checkoutMessageEl.textContent =
      "Your cart is empty. Add something before checkout.";
    checkoutMessageEl.style.color = "#ffb3b3";
    return;
  }

  checkoutMessageEl.textContent =
    "Order placed (front-end demo only). Thank you!";
  checkoutMessageEl.style.color = "#c0ffb3";

  checkoutForm.reset();
  cart = [];
  saveCartToStorage();
  renderCart();
});

/* ========== THEME TOGGLE ========== */
function updateThemeToggleUI() {
  const isLight = document.body.classList.contains("light-mode");
  const iconSpan = themeToggleBtn.querySelector(".theme-toggle-icon");
  const textSpan = themeToggleBtn.querySelector(".theme-toggle-text");

  if (isLight) {
    iconSpan.textContent = "☀️";
    textSpan.textContent = "Light";
  } else {
    iconSpan.textContent = "🌙";
    textSpan.textContent = "Dark";
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    saveThemeToStorage(isLight ? "light" : "dark");
    updateThemeToggleUI();
  });
}

/* ========== INIT ========== */
loadCartFromStorage();
loadFavouritesFromStorage();
loadThemeFromStorage();
renderProducts();
renderCart();
setupFilters();
updateThemeToggleUI();