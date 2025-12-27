/* assets/js/db.js */
(function () {
  const DB_KEY = "CS_DB_V1";
  const SEEDED_KEY = "CS_DB_SEEDED_V1";

  const DEFAULT_DB = {
    customers: [],
    cars: [],
    inventory: [],
    bookings: [],
    inquiries: [],
    payments: [],
    owners: [],
    settings: { currency: "PKR", showSoldCars: true }
  };

  function read() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || "null") || structuredClone(DEFAULT_DB);
    } catch {
      return structuredClone(DEFAULT_DB);
    }
  }

  function write(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  async function seedOnce() {
    if (localStorage.getItem(SEEDED_KEY) === "true") return read();
    try {
      // data.json at project root => "/data/data.json"
      const res = await fetch("/data/data.json");
      if (!res.ok) throw new Error("Seed fetch failed");
      const seed = await res.json();
      const merged = { ...structuredClone(DEFAULT_DB), ...seed };
      write(merged);
      localStorage.setItem(SEEDED_KEY, "true");
      return merged;
    } catch (e) {
      // If fetch path issue, continue with empty DB
      const db = read();
      write(db);
      localStorage.setItem(SEEDED_KEY, "true");
      return db;
    }
  }

  // Generic helpers
  function list(table) { return read()[table] || []; }
  function get(table, id) { return list(table).find(x => x.id === id) || null; }

  function insert(table, row) {
    const db = read();
    db[table] = db[table] || [];
    db[table].unshift(row);
    return write(db), row;
  }

  function update(table, id, patch) {
    const db = read();
    const arr = db[table] || [];
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...patch };
    write(db);
    return arr[idx];
  }

  function remove(table, id) {
    const db = read();
    db[table] = (db[table] || []).filter(x => x.id !== id);
    write(db);
    return true;
  }

  // Business rules
  function setCarStatus(carId, status) {
    return update("cars", carId, { status });
  }

  function upsertInventory(carId, patch) {
    const db = read();
    let inv = db.inventory.find(x => x.carId === carId);
    if (!inv) {
      inv = { id: window.CSUtils.uid("inv"), carId, stock: 0, reserved: 0, sold: 0, updatedAt: new Date().toISOString() };
      db.inventory.push(inv);
    }
    Object.assign(inv, patch, { updatedAt: new Date().toISOString() });
    write(db);
    return inv;
  }

  function createInquiry({ customerId, name, email, phone, message }) {
    const row = {
      id: window.CSUtils.uid("inq"),
      customerId: customerId || null,
      name: name || "",
      email: email || "",
      phone: phone || "",
      message: message || "",
      status: "unread",
      createdAt: new Date().toISOString()
    };
    insert("inquiries", row);
    return row;
  }

  function markInquiry(id, status) {
    return update("inquiries", id, { status });
  }

  function createBooking({ customerId, carId, date, note }) {
    const row = {
      id: window.CSUtils.uid("bok"),
      customerId,
      carId,
      date: date || new Date().toISOString(),
      note: note || "",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    insert("bookings", row);
    // reserve inventory if exists
    const inv = read().inventory.find(x => x.carId === carId);
    if (inv) upsertInventory(carId, { reserved: Math.max(0, (inv.reserved || 0) + 1) });
    return row;
  }

  function setBookingStatus(id, status) {
    return update("bookings", id, { status });
  }

  function createPayment({ bookingId, amount, method }) {
    const row = {
      id: window.CSUtils.uid("pay"),
      bookingId,
      amount: window.CSUtils.safeNumber(amount),
      method: method || "cash",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    insert("payments", row);
    return row;
  }

  function setPaymentStatus(id, status) {
    return update("payments", id, { status });
  }

  window.CSDB = {
    seedOnce, read, write,
    list, get, insert, update, remove,
    setCarStatus, upsertInventory,
    createInquiry, markInquiry,
    createBooking, setBookingStatus,
    createPayment, setPaymentStatus
  };
})();
