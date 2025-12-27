/* assets/js/pages/admin/inquiries.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function render() {
    const tbody = $("#inquiriesBody");
    if (!tbody) return;

    const items = CSDB.listInquiries();
    tbody.innerHTML = items
      .map((i) => {
        const dt = new Date(i.createdAt).toLocaleString();
        const badge = i.status === "unread" ? "text-bg-warning" : "text-bg-success";
        return `
          <tr>
            <td class="fw-semibold">${i.customerName || "—"}</td>
            <td>${i.email || "—"}</td>
            <td>${i.subject || "—"}</td>
            <td>${i.message || ""}</td>
            <td><span class="badge ${badge}">${i.status}</span></td>
            <td>${dt}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary" data-read="${i.id}">
                ${i.status === "unread" ? "Mark Read" : "Mark Unread"}
              </button>
              <button class="btn btn-sm btn-outline-danger ms-1" data-del="${i.id}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("[data-read]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-read");
        const row = CSDB.listInquiries().find((x) => x.id === id);
        CSDB.markInquiryRead(id, !(row && row.status === "read"));
      });
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        CSDB.deleteInquiry(id);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    CSDB.onChange(() => render());
  });
})();
