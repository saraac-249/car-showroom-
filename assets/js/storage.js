/* assets/js/storage.js
   CarShowroom LocalStorage Database (Admin + Customer linked)
*/
(function () {
  const DB_KEY = "CS_DB_V1";
  const SEEDED_KEY = "CS_DB_SEEDED_V1";

  const listeners = new Set();

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
  function nowISO() {
    return new Date().toISOString();
  }

  function readDB() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || "null");
    } catch {
      return null;
    }
  }
  function writeDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function seedDB() {
    const db = {
      meta: { version: 1, createdAt: nowISO(), updatedAt: nowISO() },

      customers: [
        {
          id: "cust_demo_1",
          name: "Demo Customer",
          email: "demo@customer.com",
          phone: "0300-0000000",
          createdAt: nowISO(),
        },
      ],

      cars: [
        {
          id: "car_demo_1",
          title: "Toyota Corolla 2020",
          make: "Toyota",
          model: "Corolla",
          year: 2020,
          price: 4200000,
          status: "available", // available | reserved | sold
          images: [], // base64 strings
          specs: { color: "White", transmission: "Auto", fuel: "Petrol" },
          createdAt: nowISO(),
        },
      ],

      inquiries: [
        {
          id: "inq_demo_1",
          customerId: "cust_demo_1",
          customerName: "Demo Customer",
          email: "demo@customer.com",
          subject: "Test drive",
          message: "Is car available for test drive?",
          status: "unread", // unread | read
          createdAt: nowISO(),
        },
      ],

      bookings: [
        {
          id: "bk_demo_1",
          customerId: "cust_demo_1",
          customerName: "Demo Customer",
          carId: "car_demo_1",
          carTitle: "Toyota Corolla 2020",
          date: "2025-12-26",
          time: "11:00",
          status: "pending", // pending | approved | cancelled | completed
          createdAt: nowISO(),
        },
      ],

      payments: [], // {id, bookingId, customerId, amount, method, status, createdAt}
      wishlist: [], // {id, customerId, carId, createdAt}

      owners: [],

      settings: {
        showroomName: "CarShowroom",
        currency: "PKR",
        updatedAt: nowISO(),
      },
    };

    writeDB(db);
    localStorage.setItem(SEEDED_KEY, "true");
    return db;
  }

  function ensureDB() {
    let db = readDB();
    if (!db) db = seedDB();
    return db;
  }

  function save(db, eventName = "db:update", payload = null) {
    db.meta.updatedAt = nowISO();
    writeDB(db);
    listeners.forEach((fn) => {
      try {
        fn(eventName, payload);
      } catch {}
    });
    return db;
  }

  // Cross-tab refresh (optional but useful)
  window.addEventListener("storage", (e) => {
    if (e.key === DB_KEY) {
      listeners.forEach((fn) => {
        try {
          fn("db:external", null);
        } catch {}
      });
    }
  });

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function findById(list, id) {
    return (list || []).find((x) => x.id === id) || null;
  }

  // -------- Customers --------
  function listCustomers() {
    return [...ensureDB().customers];
  }

  function upsertCustomer(data) {
    const db = ensureDB();
    const email = String(data.email || "").trim().toLowerCase();
    let c = db.customers.find((x) => x.email === email);

    if (!c) {
      c = {
        id: uid("cust"),
        name: data.name || "Customer",
        email,
        phone: data.phone || "",
        createdAt: nowISO(),
      };
      db.customers.unshift(c);
      save(db, "customer:create", c);
      return c;
    }

    c.name = data.name ?? c.name;
    c.phone = data.phone ?? c.phone;
    save(db, "customer:update", c);
    return c;
  }

  // -------- Cars --------
  function listCars() {
    return [...ensureDB().cars];
  }

  function createCar(data) {
    const db = ensureDB();
    const car = {
      id: uid("car"),
      title: data.title || `${data.make || "Car"} ${data.model || ""} ${data.year || ""}`.trim(),
      make: data.make || "",
      model: data.model || "",
      year: Number(data.year || new Date().getFullYear()),
      price: Number(data.price || 0),
      status: data.status || "available",
      images: Array.isArray(data.images) ? data.images : [],
      specs: data.specs || {},
      createdAt: nowISO(),
    };
    db.cars.unshift(car);
    save(db, "car:create", car);
    return car;
  }

  function updateCar(id, patch) {
    const db = ensureDB();
    const car = findById(db.cars, id);
    if (!car) return null;

    Object.assign(car, patch);

    if (!patch.title && (patch.make || patch.model || patch.year)) {
      car.title = `${car.make} ${car.model} ${car.year}`.trim();
    }

    save(db, "car:update", car);
    return car;
  }

  function deleteCar(id) {
    const db = ensureDB();
    const hasBooking = db.bookings.some((b) => b.carId === id);
    if (hasBooking) return { ok: false, reason: "Car has bookings" };

    db.cars = db.cars.filter((c) => c.id !== id);
    save(db, "car:delete", { id });
    return { ok: true };
  }

  // -------- Inquiries --------
  function listInquiries() {
    return [...ensureDB().inquiries];
  }

  function createInquiry(data) {
    const db = ensureDB();
    const cust = data.customerId ? findById(db.customers, data.customerId) : null;

    const item = {
      id: uid("inq"),
      customerId: data.customerId || cust?.id || null,
      customerName: data.customerName || cust?.name || "Customer",
      email: String(data.email || cust?.email || "").trim().toLowerCase(),
      subject: data.subject || "Inquiry",
      message: data.message || "",
      status: "unread",
      createdAt: nowISO(),
    };

    db.inquiries.unshift(item);
    save(db, "inquiry:create", item);
    return item;
  }

  function markInquiry(id, status) {
    const db = ensureDB();
    const inq = findById(db.inquiries, id);
    if (!inq) return null;
    inq.status = status; // read/unread
    save(db, "inquiry:update", inq);
    return inq;
  }

  // -------- Bookings --------
  function listBookings() {
    return [...ensureDB().bookings];
  }

  function createBooking(data) {
    const db = ensureDB();
    const car = findById(db.cars, data.carId);
    if (!car) return { ok: false, reason: "Car not found" };
    if (car.status === "sold") return { ok: false, reason: "Car already sold" };

    const cust = data.customerId ? findById(db.customers, data.customerId) : null;

    const booking = {
      id: uid("bk"),
      customerId: data.customerId || cust?.id || null,
      customerName: data.customerName || cust?.name || "Customer",
      carId: car.id,
      carTitle: car.title,
      date: data.date || "",
      time: data.time || "",
      status: "pending",
      createdAt: nowISO(),
    };

    db.bookings.unshift(booking);

    // auto reserve if available
    if (car.status === "available") car.status = "reserved";

    save(db, "booking:create", booking);
    return { ok: true, booking };
  }

  function updateBooking(id, patch) {
    const db = ensureDB();
    const b = findById(db.bookings, id);
    if (!b) return null;

    Object.assign(b, patch);

    // if approved -> keep reserved
    // if cancelled -> set car available (if not sold)
    const car = findById(db.cars, b.carId);
    if (car) {
      if (b.status === "cancelled" && car.status !== "sold") car.status = "available";
      if ((b.status === "approved" || b.status === "pending") && car.status === "available") car.status = "reserved";
      if (b.status === "completed") car.status = "sold";
    }

    save(db, "booking:update", b);
    return b;
  }

  // -------- Payments --------
  function listPayments() {
    return [...ensureDB().payments];
  }

  function createPayment(data) {
    const db = ensureDB();
    const item = {
      id: uid("pay"),
      bookingId: data.bookingId || null,
      customerId: data.customerId || null,
      amount: Number(data.amount || 0),
      method: data.method || "cash", // cash/bank/online
      status: data.status || "pending", // pending/verified/rejected
      createdAt: nowISO(),
    };
    db.payments.unshift(item);
    save(db, "payment:create", item);
    return item;
  }

  function updatePayment(id, patch) {
    const db = ensureDB();
    const p = findById(db.payments, id);
    if (!p) return null;
    Object.assign(p, patch);
    save(db, "payment:update", p);
    return p;
  }

  // -------- Wishlist --------
  function listWishlist(customerId) {
    const db = ensureDB();
    return db.wishlist.filter((w) => w.customerId === customerId);
  }
  function toggleWishlist(customerId, carId) {
    const db = ensureDB();
    const existing = db.wishlist.find((w) => w.customerId === customerId && w.carId === carId);
    if (existing) {
      db.wishlist = db.wishlist.filter((w) => w.id !== existing.id);
      save(db, "wishlist:remove", { customerId, carId });
      return { liked: false };
    }
    db.wishlist.unshift({ id: uid("wish"), customerId, carId, createdAt: nowISO() });
    save(db, "wishlist:add", { customerId, carId });
    return { liked: true };
  }

  // -------- Dashboard helpers --------
  function counts() {
    const db = ensureDB();
    return {
      customers: db.customers.length,
      unreadInquiries: db.inquiries.filter((i) => i.status === "unread").length,
      activeBookings: db.bookings.filter((b) => b.status === "pending" || b.status === "approved").length,
      pendingPayments: db.payments.filter((p) => p.status === "pending").length,
    };
  }

  window.CSDB = {
    ensureDB,
    onChange,

    // customers
    listCustomers,
    upsertCustomer,

    // cars
    listCars,
    createCar,
    updateCar,
    deleteCar,

    // inquiries
    listInquiries,
    createInquiry,
    markInquiry,

    // bookings
    listBookings,
    createBooking,
    updateBooking,

    // payments
    listPayments,
    createPayment,
    updatePayment,

    // wishlist
    listWishlist,
    toggleWishlist,

    // dashboard
    counts,
  };
})();
