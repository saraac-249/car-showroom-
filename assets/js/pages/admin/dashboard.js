/* assets/js/pages/admin/dashboard.js */
(function () {
  AdminAuth.requireAuth("./login.html");

  const $ = (s) => document.querySelector(s);

  function setText(id, val) {
    const el = $(id);
    if (el) el.textContent = String(val);
  }

  function renderRecentInquiries() {
    const tbody = $("#recentInquiriesBody") || $("#inquiriesBody");
    if (!tbody) return;

    const items = CSDB.listInquiries().slice(0, 5);
    tbody.innerHTML = items
      .map((i) => {
        const dt = new Date(i.createdAt).toLocaleDateString();
        return `
          <tr>
            <td class="fw-semibold">${i.customerName || "—"}</td>
            <td>${i.message || ""}</td>
            <td><span class="badge ${i.status === "unread" ? "text-bg-warning" : "text-bg-success"}">${i.status}</span></td>
            <td>${dt}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderRecentBookings() {
    const tbody = $("#recentBookingsBody") || $("#bookingsBody");
    if (!tbody) return;

    const items = CSDB.listBookings().slice(0, 5);
    tbody.innerHTML = items
      .map((b) => {
        return `
          <tr>
            <td class="fw-semibold">${b.customerName || "—"}</td>
            <td>${b.carTitle || "—"}</td>
            <td><span class="badge text-bg-info">${b.status}</span></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderStats() {
    const s = CSDB.stats();
    // aapke dashboard cards me jo IDs hain unko match kar lena:
    setText("#activeBookingsCount", s.activeBookings);
    setText("#pendingPaymentsCount", s.pendingPayments);
    setText("#newInquiriesCount", s.unreadInquiries);
    setText("#totalCustomersCount", s.customers);
  }

  function render() {
    CSDB.ensureInit();
    renderStats();
    renderRecentInquiries();
    renderRecentBookings();
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    CSDB.onChange(() => render());
  });
})();
