/* assets/js/pages/admin/inventory.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function render() {
    const tbody = $("#inventoryBody");
    if (!tbody) return;

    const cars = CSDB.listCars();
    tbody.innerHTML = cars
      .map((c) => {
        return `
          <tr>
            <td class="fw-semibold">${c.title}</td>
            <td>${c.make || "—"} ${c.model || ""}</td>
            <td>${c.year || "—"}</td>
            <td><span class="badge ${c.status === "available" ? "text-bg-success" : c.status === "reserved" ? "text-bg-warning" : "text-bg-secondary"}">${c.status}</span></td>
            <td class="text-end">
              <select class="form-select form-select-sm d-inline-block" style="width:160px" data-status="${c.id}">
                <option value="available" ${c.status === "available" ? "selected" : ""}>available</option>
                <option value="reserved" ${c.status === "reserved" ? "selected" : ""}>reserved</option>
                <option value="sold" ${c.status === "sold" ? "selected" : ""}>sold</option>
              </select>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("select[data-status]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-status");
        CSDB.updateCar(id, { status: sel.value });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    CSDB.onChange(() => render());
  });
})();
