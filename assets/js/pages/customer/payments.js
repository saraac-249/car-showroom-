// assets/js/pages/payments.js
(() => {
  const $ = (s) => document.querySelector(s);

  const money = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  let currentTab = "pending";

  const getPayments = () => {
    const p = window.Store.get("cs_payments", []);
    return Array.isArray(p) ? p : [];
  };

  const setPayments = (arr) => window.Store.set("cs_payments", arr);

  const renderCounts = (list) => {
    const pending = list.filter(x => String(x?.status).toLowerCase() === "pending").length;
    const paid = list.filter(x => String(x?.status).toLowerCase() === "paid").length;

    $("#payPendingCount").textContent = String(pending);
    $("#payPaidCount").textContent = String(paid);
  };

  const render = () => {
    const body = $("#paymentsBody");
    const empty = $("#emptyState");
    if (!body) return;

    const list = getPayments();
    renderCounts(list);

    const show = list.filter(p => {
      const s = String(p?.status || "").toLowerCase();
      if (currentTab === "pending") return s === "pending";
      if (currentTab === "paid") return s === "paid";
      return true;
    });

    if (!show.length) {
      body.innerHTML = "";
      empty?.classList.remove("d-none");
      return;
    }
    empty?.classList.add("d-none");

    body.innerHTML = show.map((p) => {
      const id = p?.id;
      const inv = id ? id.slice(-6).toUpperCase() : "—";
      const bookingId = p?.bookingId ? p.bookingId.slice(-6).toUpperCase() : "—";
      const amount = money(p?.amount ?? 0);
      const status = String(p?.status || "pending").toLowerCase();

      const statusBadge =
        status === "paid"
          ? `<span class="badge text-bg-success">Paid</span>`
          : status === "cancelled"
            ? `<span class="badge text-bg-secondary">Cancelled</span>`
            : `<span class="badge text-bg-warning">Pending</span>`;

      const action =
        status === "pending"
          ? `<button class="btn btn-primary btn-sm" data-paid="${id}"><i class="bi bi-check2-circle me-1"></i>Mark Paid</button>`
          : "";

      return `
        <tr>
          <td class="fw-semibold">INV-${inv}</td>
          <td>BK-${bookingId}</td>
          <td class="fw-bold">${amount}</td>
          <td>${statusBadge}</td>
          <td class="text-end">${action}</td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll("button[data-paid]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-paid");
        const list = getPayments();
        const next = list.map(p => {
          if (String(p?.id) === String(id)) return { ...p, status: "paid", paidAt: new Date().toISOString() };
          return p;
        });
        setPayments(next);
        render();
      });
    });
  };

  const initTabs = () => {
    const tabs = document.querySelectorAll("#payTabs .nav-link");
    tabs.forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.getAttribute("data-tab") || "pending";
        render();
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    initTabs();
    render();
  });
})();
