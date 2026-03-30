/* assets/js/app-db.js */
(function () {
  const KEYS = {
    customers: "cs_customers",
    bookings: "cs_bookings",
    inquiries: "cs_inquiries",
    payments: "cs_payments"
  };

  const uid = () => "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();

  const safeParse = (raw, fallback) => {
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  };

  const read = (key, fallback) => safeParse(localStorage.getItem(key), fallback);
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function getCurrentCustomer() {
    return safeParse(localStorage.getItem("customerData"), null);
  }

  function upsertCustomerProfile(profile) {
    // profile: {id,email,name,phone,city}
    const list = read(KEYS.customers, []);
    const email = String(profile?.email || "").toLowerCase().trim();
    if (!email) return null;

    const now = new Date().toISOString();
    const existingIdx = list.findIndex(c => String(c.email).toLowerCase() === email);

    const normalized = {
      id: profile.id || (existingIdx >= 0 ? list[existingIdx].id : uid()),
      email,
      name: profile.name || (existingIdx >= 0 ? list[existingIdx].name : ""),
      phone: profile.phone || (existingIdx >= 0 ? list[existingIdx].phone : ""),
      city: profile.city || (existingIdx >= 0 ? list[existingIdx].city : ""),
      updatedAt: now,
      createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : now
    };

    if (existingIdx >= 0) list[existingIdx] = normalized;
    else list.unshift(normalized);

    write(KEYS.customers, list);
    return normalized;
  }

  function addInquiry({ customerEmail, customerName, message, phone }) {
    const list = read(KEYS.inquiries, []);
    const item = {
      id: uid(),
      customerEmail: String(customerEmail || "").trim(),
      customerName: String(customerName || "").trim(),
      phone: String(phone || "").trim(),
      message: String(message || "").trim(),
      status: "Unread",
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    write(KEYS.inquiries, list);
    return item;
  }

  function markInquiryRead(id) {
    const list = read(KEYS.inquiries, []);
    const i = list.findIndex(x => x.id === id);
    if (i >= 0) {
      list[i].status = "Read";
      list[i].readAt = new Date().toISOString();
      write(KEYS.inquiries, list);
    }
    return list[i] || null;
  }

  function addBooking({ customerEmail, customerName, carName, slot }) {
    const list = read(KEYS.bookings, []);
    const item = {
      id: uid(),
      customerEmail: String(customerEmail || "").trim(),
      customerName: String(customerName || "").trim(),
      carName: String(carName || "").trim(),
      slot: String(slot || "").trim(),
      status: "Pending",
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    write(KEYS.bookings, list);
    return item;
  }

  function getAdminSummary() {
    const customers = read(KEYS.customers, []);
    const inquiries = read(KEYS.inquiries, []);
    const payments = read(KEYS.payments, []);

    const newInquiries = inquiries.filter(x => String(x.status || "").toLowerCase() === "unread").length;
    const pendingPayments = payments.filter(p => String(p.status || "").toLowerCase() !== "paid").length;

    return {
      totalCustomers: customers.length,
      newInquiries,
      pendingPayments
    };
  }

  window.AppDB = {
    KEYS,
    read,
    write,
    uid,
    getCurrentCustomer,
    upsertCustomerProfile,
    addInquiry,
    markInquiryRead,
    addBooking,
    getAdminSummary
  };
})();
