/* assets/js/pages/admin/bookings.js */
(function () {
  AdminAuth.requireAuth("./login.html");

  const $ = (s) => document.querySelector(s);

  function badge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "text-bg-warning";
    if (s === "approved") return "text-bg-primary";
    if (s === "cancelled") return "text-bg-secondary";
    if (s === "completed") return "text-bg-success";
    return "text-bg-light";
  }

  function render() {
    const tbody = $("#bookingsBody");
    if (!tbody) return;

    const items = CSDB.listBookings();
    tbody.innerHTML = items
      .map((b) => {
        const act = `
          <select class="form-select form-select-sm d-inline-block" style="width:160px" data-act="${b.id}">
            <option value="pending" ${b.status === "pending" ? "selected" : ""}>pending</option>
            <option value="approved" ${b.status === "approved" ? "selected" : ""}>approved</option>
            <option value="cancelled" ${b.status === "cancelled" ? "selected" : ""}>cancelled</option>
            <option value="completed" ${b.status === "completed" ? "selected" : ""}>completed</option>
          </select>
          <button class="btn btn-sm btn-outline-danger ms-2" data-del="${b.id}">Delete</button>
        `;

        return `
          <tr>
            <td class="fw-semibold">${b.customerName || "—"}</td>
            <td>${b.carTitle || "—"}</td>
            <td>${b.date || "—"}</td>
            <td>${b.time || "—"}</td>
            <td><span class="badge ${badge(b.status)}">${b.status}</span></td>
            <td class="text-end">${act}</td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("select[data-act]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-act");
        CSDB.updateBookingStatus(id, sel.value);
      });
    });

    tbody.querySelectorAll("button[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        CSDB.deleteBooking(id);
      });
    });

    // optional count
    const count = $("#bookingCount");
    if (count) count.textContent = String(items.length);
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    CSDB.onChange(() => render());
  });
})();
