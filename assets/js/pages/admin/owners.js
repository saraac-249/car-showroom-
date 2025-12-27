/* assets/js/pages/admin/owners.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function render() {
    const tbody = $("#ownersBody");
    if (!tbody) return;

    const items = CSDB.listOwners();
    tbody.innerHTML = items
      .map((o) => `
        <tr>
          <td class="fw-semibold">${o.name || "—"}</td>
          <td>${o.email || "—"}</td>
          <td>${o.phone || "—"}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-del="${o.id}">Delete</button>
          </td>
        </tr>
      `)
      .join("");

    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => CSDB.deleteOwner(btn.getAttribute("data-del")));
    });
  }

  function bindAddForm() {
    const form = $("#addOwnerForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      CSDB.createOwner({
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
