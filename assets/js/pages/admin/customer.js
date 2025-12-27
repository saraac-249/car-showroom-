/* assets/js/pages/admin/customers.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function render() {
    const tbody = $("#customersBody");
    if (!tbody) return;

    const items = CSDB.listCustomers();
    tbody.innerHTML = items
      .map((c) => {
        const dt = new Date(c.createdAt).toLocaleDateString();
        return `
          <tr>
            <td class="fw-semibold">${c.name || "—"}</td>
            <td>${c.email || "—"}</td>
            <td>${c.phone || "—"}</td>
            <td>${dt}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary" data-edit="${c.id}">Edit</button>
              <button class="btn btn-sm btn-outline-danger ms-1" data-del="${c.id}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const res = CSDB.deleteCustomer(id);
        if (res && res.ok === false) alert(res.reason || "Cannot delete");
      });
    });

    tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const c = CSDB.listCustomers().find((x) => x.id === id);
        if (!c) return;

        const name = prompt("Name:", c.name || "");
        if (name == null) return;
        const phone = prompt("Phone:", c.phone || "");
        if (phone == null) return;

        CSDB.updateCustomer(id, { name, phone });
      });
    });

    const count = $("#customerCount");
    if (count) count.textContent = String(items.length);
  }

  // Optional: add form
  function bindAddForm() {
    const form = $("#addCustomerForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      CSDB.createCustomer({
        name: fd.get("name") || "",
        email: fd.get("email") || "",
        phone: fd.get("phone") || "",
      });
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    bindAddForm();
    CSDB.onChange(() => render());
  });
})();
