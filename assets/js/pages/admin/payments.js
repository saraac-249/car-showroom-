/* assets/js/pages/admin/payments.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function money(n) {
    return Number(n || 0).toLocaleString();
  }

  function render() {
    const tbody = $("#paymentsBody");
    if (!tbody) return;

    const items = CSDB.listPayments();
    tbody.innerHTML = items
      .map((p) => {
        const dt = new Date(p.createdAt).toLocaleString();
        const badge =
          p.status === "pending" ? "text-bg-warning" :
          p.status === "verified" ? "text-bg-success" :
          "text-bg-danger";

        return `
          <tr>
            <td class="fw-semibold">${p.customerName || "—"}</td>
            <td>${p.carTitle || "—"}</td>
            <td>${money(p.amount)}</td>
            <td>${p.method || "—"}</td>
            <td><span class="badge ${badge}">${p.status}</span></td>
            <td>${dt}</td>
            <td class="text-end">
              <select class="form-select form-select-sm d-inline-block" style="width:160px" data-act="${p.id}">
                <option value="pending" ${p.status === "pending" ? "selected" : ""}>pending</option>
                <option value="verified" ${p.status === "verified" ? "selected" : ""}>verified</option>
                <option value="rejected" ${p.status === "rejected" ? "selected" : ""}>rejected</option>
              </select>
              <button class="btn btn-sm btn-outline-danger ms-2" data-del="${p.id}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("select[data-act]").forEach((sel) => {
      sel.addEventListener("change", () => {
        CSDB.updatePaymentStatus(sel.getAttribute("data-act"), sel.value);
      });
    });

    tbody.querySelectorAll("button[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        CSDB.deletePayment(btn.getAttribute("data-del"));
      });
    });

    const count = $("#paymentCount");
    if (count) count.textContent = String(items.length);
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    CSDB.onChange(() => render());
  });
})();
