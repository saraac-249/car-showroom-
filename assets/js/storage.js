/* ../assets/js/storage.js
   Common LocalStorage DB (Customer + Admin shared)

   FIXED:
   - Single session key: cs_current_customer (ONLY source of truth)
   - No guest fallback
   - Helper: requireCustomerSession()
   - Clear legacy keys on setCurrentCustomer()
*/
(function () {
  const KEYS = {
    sessionCustomer: "cs_current_customer",   // ✅ single source of truth
    customers: "cs_customers",
    inquiries: "cs_inquiries",
    bookings: "cs_bookings",
    payments: "cs_payments",
    cars: "cs_cars"
  };

  const EVENTS = { carsChanged: "cs:carsChanged" };

  const safeJSON = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch {}
    }
  };

  const uid = () =>
    "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  const nowISO = () => new Date().toISOString();

  function upsertById(arr, item) {
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) arr.unshift(item);
    else arr[idx] = item;
    return arr;
  }

  function normalizeMoney(v) {
    const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function normalizeYear(v) {
    const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(n)) return "";
    return String(n).slice(0, 4);
  }

  function makeInvoiceNo() {
    const t = Date.now().toString().slice(-6);
    return "INV-" + t + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  function notifyCarsChanged() {
    try { window.dispatchEvent(new CustomEvent(EVENTS.carsChanged)); } catch {}
  }

  function writeCars(list) {
    safeJSON.write(KEYS.cars, list);
    notifyCarsChanged();
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  // ✅ Read session customer ONLY from cs_current_customer
  function readSessionCustomer() {
    const obj = safeJSON.read(KEYS.sessionCustomer, null);
    if (!obj) return null;

    const email = normalizeEmail(obj.email || obj.customerEmail);
    if (!email) return null;

    return {
      id: obj.id || "",
      email,
      name: obj.name || obj.customerName || "Customer"
    };
  }

  function writeSessionCustomer(customer) {
    const email = normalizeEmail(customer?.email || customer?.customerEmail);
    if (!email) return null;

    const obj = {
      id: customer.id || "",
      email,
      name: customer.name || customer.customerName || "Customer",
      updatedAt: nowISO()
    };
    safeJSON.write(KEYS.sessionCustomer, obj);

    // ✅ cleanup legacy keys so old system can't override later
    try { localStorage.removeItem("customerEmail"); } catch {}
    try { localStorage.removeItem("customerName"); } catch {}
    try { localStorage.removeItem("currentCustomer"); } catch {}
    try { localStorage.removeItem("loggedInCustomer"); } catch {}
    try { localStorage.removeItem("cs_customer"); } catch {}
    try { localStorage.removeItem("customer"); } catch {}
    try { localStorage.removeItem("sessionCustomer"); } catch {}

    return obj;
  }

  function clearSessionCustomer() {
    safeJSON.remove(KEYS.sessionCustomer);
  }

  // ✅ If payload missing customer info, pull from session
  function fillCustomerFromSession(payload) {
    const p = payload || {};
    const email = normalizeEmail(p.customerEmail || p.email);
    const name = String(p.customerName || p.name || "").trim();

    if (email) {
      return {
        ...p,
        customerEmail: email,
        customerName: name || "Customer"
      };
    }

    const session = readSessionCustomer();
    if (session) {
      return {
        ...p,
        customerEmail: session.email,
        customerName: name || session.name
      };
    }

    // ✅ If no session: keep empty email so it won't match any customer
    return {
      ...p,
      customerEmail: "",
      customerName: name || "Customer"
    };
  }

  window.AppDB = {
    // ---------- SESSION ----------
    setCurrentCustomer(customer) {
      return writeSessionCustomer(customer);
    },
    getCurrentCustomer() {
      return readSessionCustomer();
    },
    clearCurrentCustomer() {
      clearSessionCustomer();
      // optional auth flag cleanup if you use it
      try { localStorage.removeItem("customerLoggedIn"); } catch {}
    },

    // ✅ helper for customer pages
    requireCustomerSession(loginUrl = "login.html") {
      const c = readSessionCustomer();
      if (!c || !c.email) {
        alert("Please login first.");
        window.location.replace(loginUrl);
        return null;
      }
      return c;
    },

    // ---------- Customers ----------
    addOrUpdateCustomer(customer) {
      const list = safeJSON.read(KEYS.customers, []);
      const c = {
        id: customer.id || uid(),
        email: normalizeEmail(customer.email),
        name: customer.name || "",
        phone: customer.phone || "",
        city: customer.city || "",
        createdAt: customer.createdAt || nowISO(),
        updatedAt: nowISO()
      };
      safeJSON.write(KEYS.customers, upsertById(list, c));
      return c;
    },
    getCustomers() { return safeJSON.read(KEYS.customers, []); },
    getCustomerByEmail(email) {
      const e = normalizeEmail(email);
      return this.getCustomers().find((c) => normalizeEmail(c.email) === e) || null;
    },

    // ---------- Inquiries ----------
    addInquiry(payload) {
      const p = fillCustomerFromSession(payload);
      const list = safeJSON.read(KEYS.inquiries, []);
      const item = {
        id: uid(),
        customerEmail: normalizeEmail(p.customerEmail),
        customerName: p.customerName || "Customer",
        phone: p.phone || "",
        subject: p.subject || "Inquiry",
        message: p.message || "",
        status: p.status || "Unread",
        createdAt: nowISO()
      };
      list.unshift(item);
      safeJSON.write(KEYS.inquiries, list);
      return item;
    },
    getInquiries() { return safeJSON.read(KEYS.inquiries, []); },
    getInquiriesByEmail(email) {
      const e = normalizeEmail(email);
      if (!e) return [];
      return this.getInquiries().filter((x) => normalizeEmail(x.customerEmail) === e);
    },
    markInquiryRead(id) {
      const list = this.getInquiries();
      const item = list.find((x) => x.id === id);
      if (item) item.status = "Read";
      safeJSON.write(KEYS.inquiries, list);
      return item;
    },
    deleteInquiry(id) {
      const list = this.getInquiries().filter((x) => x.id !== id);
      safeJSON.write(KEYS.inquiries, list);
    },

    // ---------- Bookings ----------
    addBooking(payload) {
      const p = fillCustomerFromSession(payload);
      const list = safeJSON.read(KEYS.bookings, []);

      const item = {
        id: uid(),
        customerEmail: normalizeEmail(p.customerEmail),
        customerName: p.customerName || "Customer",
        carId: p.carId || "",
        carName: p.carName || "Car",
        carBrand: p.carBrand || "",
        carModel: p.carModel || "",
        qty: Number(p.qty || 1),
        days: Number(p.days || 1),
        amount: normalizeMoney(p.amount),
        status: p.status || "Confirmed",
        createdAt: nowISO()
      };

      list.unshift(item);
      safeJSON.write(KEYS.bookings, list);
      return item;
    },
    getBookings() { return safeJSON.read(KEYS.bookings, []); },
    getBookingsByEmail(email) {
      const e = normalizeEmail(email);
      if (!e) return [];
      return this.getBookings().filter(b => normalizeEmail(b.customerEmail) === e);
    },

    // ---------- Payments ----------
    addPayment(payload) {
      const p = fillCustomerFromSession(payload);
      const list = safeJSON.read(KEYS.payments, []);

      const item = {
        id: uid(),
        invoiceNo: p.invoiceNo || makeInvoiceNo(),
        bookingId: p.bookingId || "",
        customerEmail: normalizeEmail(p.customerEmail),
        customerName: p.customerName || "Customer",
        carId: p.carId || "",
        carName: p.carName || "Car",
        carBrand: p.carBrand || "",
        carModel: p.carModel || "",
        amount: normalizeMoney(p.amount),
        method: p.method || "",
        status: p.status || "Pending",
        createdAt: p.createdAt || nowISO(),
        updatedAt: nowISO()
      };

      list.unshift(item);
      safeJSON.write(KEYS.payments, list);
      return item;
    },
    getPayments() {
      const list = safeJSON.read(KEYS.payments, []);
      return Array.isArray(list) ? list : [];
    },
    getPaymentsByEmail(email) {
      const e = normalizeEmail(email);
      if (!e) return []; // ✅ no email = no payments
      return this.getPayments().filter(p => normalizeEmail(p.customerEmail) === e);
    },
    markPaymentPaid(paymentId, method) {
      const list = this.getPayments();
      const item = list.find(p => p.id === paymentId);
      if (!item) return null;
      item.status = "Paid";
      item.method = method || item.method || "Cash";
      item.updatedAt = nowISO();
      safeJSON.write(KEYS.payments, list);
      return item;
    },
    clearPaidPayments() {
      const list = this.getPayments().filter(p => (p.status || "").toLowerCase() !== "paid");
      safeJSON.write(KEYS.payments, list);
      return list;
    },

    // ✅ Booking confirm => invoice create
    createBookingWithInvoice(payload) {
      const booking = this.addBooking(payload);

      const payment = this.addPayment({
        bookingId: booking.id,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        carId: booking.carId,
        carName: booking.carName,
        carBrand: booking.carBrand,
        carModel: booking.carModel,
        amount: booking.amount,
        status: "Pending"
      });

      return { booking, payment };
    },

    // ---------- Cars ----------
    addCar(payload) {
      const list = safeJSON.read(KEYS.cars, []);
      const car = {
        id: uid(),
        name: String(payload.name || payload.carName || "").trim() || "Untitled Car",
        year: normalizeYear(payload.year),
        price: normalizeMoney(payload.price),
        status: String(payload.status || "Available"),
        images: Array.isArray(payload.images)
          ? payload.images.filter(Boolean).map(String)
          : (payload.image ? [String(payload.image)] : []),
        brand: payload.brand ? String(payload.brand) : (payload.brand || ""),
        model: payload.model ? String(payload.model) : (payload.model || ""),
        createdAt: nowISO(),
        updatedAt: nowISO()
      };
      list.unshift(car);
      writeCars(list);
      return car;
    },
    updateCar(id, patch) {
      const list = safeJSON.read(KEYS.cars, []);
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) return null;

      const prev = list[idx];
      const next = {
        ...prev,
        name: patch.name !== undefined ? String(patch.name).trim() : prev.name,
        year: patch.year !== undefined ? normalizeYear(patch.year) : prev.year,
        price: patch.price !== undefined ? normalizeMoney(patch.price) : prev.price,
        status: patch.status !== undefined ? String(patch.status) : prev.status,
        images: patch.images !== undefined
          ? (Array.isArray(patch.images) ? patch.images.filter(Boolean).map(String) : prev.images)
          : prev.images,
        brand: patch.brand !== undefined ? String(patch.brand) : prev.brand,
        model: patch.model !== undefined ? String(patch.model) : prev.model,
        updatedAt: nowISO()
      };
      list[idx] = next;
      writeCars(list);
      return next;
    },
    deleteCar(id) {
      const list = safeJSON.read(KEYS.cars, []).filter((c) => c.id !== id);
      writeCars(list);
    },
    getCars() { return safeJSON.read(KEYS.cars, []); },
    getCarById(id) { return this.getCars().find((c) => c.id === id) || null; },

    onCarsChange(cb) {
      if (typeof cb !== "function") return () => {};
      const handler = () => cb(this.getCars());
      window.addEventListener(EVENTS.carsChanged, handler);
      window.addEventListener("storage", (e) => {
        if (e && e.key === KEYS.cars) handler();
      });
      handler();
      return () => window.removeEventListener(EVENTS.carsChanged, handler);
    },

    getAdminSummary() {
      const inquiries = this.getInquiries();
      const customers = this.getCustomers();
      const payments = safeJSON.read(KEYS.payments, []);
      const pendingPayments = Array.isArray(payments)
        ? payments.filter((p) => (p.status || "").toLowerCase() !== "paid").length
        : 0;
      const unread = inquiries.filter((i) => (i.status || "").toLowerCase() === "unread").length;

      return {
        pendingPayments,
        newInquiries: unread,
        totalCustomers: customers.length
      };
    },

    resetAll() {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    }
  };
})();
