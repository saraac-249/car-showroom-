// assets/js/pages/inventory.js
// Shared Inventory Logic: Admin (CRUD) + Customer (Save/Book)

(function () {
  const IS_ADMIN_PAGE = window.location.pathname.includes("/admin/");

  // ----- Keys (same across app) -----
  const KEY_INVENTORY = "cs_inventory"; // cars list
  const KEY_WISHLIST  = "cs_cars";      // customer wishlist
  const KEY_BOOKINGS  = "cs_bookings";  // bookings
  const KEY_CUSTOMERS = "cs_customers"; // customers (optional)
  const KEY_INQUIRIES = "cs_inquiries"; // inquiries (optional)

  // ----- Guard (Admin pages only) -----
  if (IS_ADMIN_PAGE) {
    if (!window.AdminAuth || !window.AdminAuth.isLoggedIn()) {
      window.location.href = "../login.html"; // from admin/pages/*
      return;
    }
  }

  // ----- Helpers (safe localStorage) -----
  function readArray(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  function writeArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function uid() {
    return Date.now();
  }

  // ----- DOM -----
  const grid = document.getElementById("inventoryGrid");

  // Admin form elements (only exist on admin inventory page)
  const form = document.getElementById("carForm");
  const fId = document.getElementById("carId");
  const fName = document.getElementById("carName");
  const fBrand = document.getElementById("carBrand");
  const fModel = document.getElementById("carModel");
  const fPrice = document.getElementById("carPrice");
  const fImage = document.getElementById("carImage");

  // Customer filter elements (only exist on customer page)
  const searchInput = document.getElementById("searchInput");
  const brandSelect = document.getElementById("brandSelect");
  const countChip = document.getElementById("countChip");

  let inventory = readArray(KEY_INVENTORY);

  // Seed demo data if empty (optional)
  if (!inventory.length) {
    inventory = [
      { id: uid(), name: "Toyota Corolla", brand: "Toyota", model: "2022", price: 4500000, image: "" },
      { id: uid()+1, name: "Honda Civic", brand: "Honda", model: "2021", price: 5200000, image: "" }
    ];
    writeArray(KEY_INVENTORY, inventory);
  }

  // ----- Render -----
  function render(list) {
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-light border">No cars found.</div></div>`;
      if (countChip) countChip.textContent = "Cars: 0";
      return;
    }

    if (countChip) countChip.textContent = `Cars: ${list.length}`;

    grid.innerHTML = list.map(car => {
      const img = car.image ? `<img src="${car.image}" alt="" class="w-100 rounded-4 mb-3" style="height:180px;object-fit:cover;">` : "";
      const price = car.price ? `<div class="fw-bold">PKR ${Number(car.price).toLocaleString()}</div>` : "";

      // Buttons change depending on page
      const actions = IS_ADMIN_PAGE
        ? `
          <button class="btn btn-outline-primary btn-sm" data-edit="${car.id}">Edit</button>
          <button class="btn btn-outline-danger btn-sm" data-del="${car.id}">Delete</button>
        `
        : `
          <button class="btn btn-outline-primary btn-sm" data-save="${car.id}">Save</button>
          <button class="btn btn-primary btn-sm" data-book="${car.id}">Book</button>
        `;

      return `
        <div class="col-md-4">
          <div class="card p-3 h-100 border-0 shadow-sm" style="border-radius:20px;">
            ${img}
            <h5 class="mb-1">${car.name || "Untitled"}</h5>
            <div class="text-muted small">${car.brand || ""} ${car.model ? "• " + car.model : ""}</div>
            <div class="mt-2">${price}</div>
            <div class="d-flex gap-2 mt-3 flex-wrap">
              ${actions}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ----- Customer filters -----
  function populateBrands() {
    if (!brandSelect) return;
    const brands = [...new Set(inventory.map(x => (x.brand || "").trim()).filter(Boolean))].sort();
    brandSelect.innerHTML = `<option value="">All Brands</option>` + brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  function applyFilters() {
    let list = [...inventory];
    const q = (searchInput?.value || "").trim().toLowerCase();
    const b = (brandSelect?.value || "").trim().toLowerCase();

    if (q) {
      list = list.filter(c =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.brand || "").toLowerCase().includes(q) ||
        (c.model || "").toLowerCase().includes(q)
      );
    }
    if (b) {
      list = list.filter(c => (c.brand || "").toLowerCase() === b);
    }
    render(list);
  }

  // ----- Click actions -----
  grid?.addEventListener("click", (e) => {
    const t = e.target;

    const editId = t.dataset.edit;
    const delId  = t.dataset.del;
    const saveId = t.dataset.save;
    const bookId = t.dataset.book;

    // Admin: Edit
    if (editId && IS_ADMIN_PAGE) {
      const car = inventory.find(c => String(c.id) === String(editId));
      if (!car) return;

      if (fId) fId.value = car.id;
      if (fName) fName.value = car.name || "";
      if (fBrand) fBrand.value = car.brand || "";
      if (fModel) fModel.value = car.model || "";
      if (fPrice) fPrice.value = car.price || "";
      if (fImage) fImage.value = car.image || "";

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Admin: Delete
    if (delId && IS_ADMIN_PAGE) {
      inventory = inventory.filter(c => String(c.id) !== String(delId));
      writeArray(KEY_INVENTORY, inventory);
      populateBrands();
      render(inventory);
      return;
    }

    // Customer: Save
    if (saveId && !IS_ADMIN_PAGE) {
      const car = inventory.find(c => String(c.id) === String(saveId));
      if (!car) return;

      const wish = readArray(KEY_WISHLIST);
      if (!wish.some(x => String(x.id) === String(car.id))) {
        wish.push(car);
        writeArray(KEY_WISHLIST, wish);
        alert("Car saved to wishlist!");
      } else {
        alert("Already in wishlist.");
      }
      return;
    }

    // Customer: Book
    if (bookId && !IS_ADMIN_PAGE) {
      const car = inventory.find(c => String(c.id) === String(bookId));
      if (!car) return;

      const bookings = readArray(KEY_BOOKINGS);
      bookings.push({
        id: uid(),
        carId: car.id,
        carName: car.name,
        status: "active",
        createdAt: new Date().toISOString()
      });
      writeArray(KEY_BOOKINGS, bookings);
      alert("Booking created!");
      return;
    }
  });

  // ----- Admin: Add/Update from form -----
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!IS_ADMIN_PAGE) return;

    const id = (fId?.value || "").trim();
    const car = {
      id: id ? Number(id) : uid(),
      name: (fName?.value || "").trim(),
      brand: (fBrand?.value || "").trim(),
      model: (fModel?.value || "").trim(),
      price: Number((fPrice?.value || "0").trim() || 0),
      image: (fImage?.value || "").trim(),
    };

    if (!car.name) {
      alert("Car name is required.");
      return;
    }

    const idx = inventory.findIndex(c => String(c.id) === String(car.id));
    if (idx >= 0) inventory[idx] = car;
    else inventory.unshift(car);

    writeArray(KEY_INVENTORY, inventory);

    // reset
    if (fId) fId.value = "";
    form.reset();

    populateBrands();
    render(inventory);
  });

  // ----- Init -----
  populateBrands();
  if (IS_ADMIN_PAGE) render(inventory);
  else {
    render(inventory);
    searchInput?.addEventListener("input", applyFilters);
    brandSelect?.addEventListener("change", applyFilters);
  }
})();
