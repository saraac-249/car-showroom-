/* assets/js/pages/customer/bookings.js */
(() => {
  CustomerAuth?.requireAuth?.("../login.html");
  const $ = (s) => document.querySelector(s);

  function me() {
    return CustomerAuth?.getCustomer?.() || { id: "cust_demo_1", name: "Demo Customer", email: "demo@customer.com" };
  }

  function renderCarsDropdown() {
    const sel = $("#carId");
    if (!sel) return;
    const cars = CSDB.listCars().filter((c) => c.status !== "sold");
    sel.innerHTML = cars
      .map((c) => `<option value="${c.id}">${c.title} (${c.status})</option>`)
      .join("");
  }

  function renderMyBookings() {
    const tbody = $("#myBookingsBody");
    if (!tbody) return;

    const m = me();
    const list = CSDB.listBookings().filter((b) => b.customerId === m.id);

    tbody.innerHTML = list
      .map(
        (b) => `
      <tr>
        <td class="fw-semibold">${b.carTitle}</td>
        <td>${b.date || "-"}</td>
        <td>${b.time || "-"}</td>
        <td><span class="badge ${b.status==="pending"?"text-bg-warning":b.status==="approved"?"text-bg-primary":b.status==="completed"?"text-bg-success":"text-bg-secondary"}">${b.status}</span></td>
      </tr>`
      )
      .join("");
  }

  function bindForm() {
    const form = $("#bookingForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const m = me();

      const res = CSDB.createBooking({
        customerId: m.id,
        customerName: m.name,
        carId: fd.get("carId"),
        date: fd.get("date"),
        time: fd.get("time"),
      });

      if (!res.ok) return alert(res.reason || "Booking failed");
      form.reset();
      alert("Booking sent ✅ (Admin panel me show hoga)");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    CSDB.ensureInit();
    renderCarsDropdown();
    bindForm();
    renderMyBookings();
    CSDB.onChange(() => {
      renderCarsDropdown();
      renderMyBookings();
    });
  });
})();
