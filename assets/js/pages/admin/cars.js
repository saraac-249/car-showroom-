/* assets/js/pages/admin/cars.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString();
  }

  function render() {
    const tbody = $("#carsBody");
    if (!tbody) return;

    const items = CSDB.listCars();
    tbody.innerHTML = items
      .map((c) => {
        const img = (c.images && c.images[0]) ? `<img src="${c.images[0]}" style="width:70px;height:45px;object-fit:cover;border-radius:8px;">` : "—";
        return `
          <tr>
            <td>${img}</td>
            <td class="fw-semibold">${c.title || "—"}</td>
            <td>${c.make || "—"}</td>
            <td>${c.model || "—"}</td>
            <td>${c.year || "—"}</td>
            <td>${money(c.price)}</td>
            <td><span class="badge ${c.status === "available" ? "text-bg-success" : c.status === "reserved" ? "text-bg-warning" : "text-bg-secondary"}">${c.status}</span></td>
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
        const res = CSDB.deleteCar(id);
        if (res && res.ok === false) alert(res.reason || "Cannot delete");
      });
    });

    // simple edit via prompt (aap modal use karna chaho to bata dena)
    tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const car = CSDB.listCars().find((x) => x.id === id);
        if (!car) return;

        const price = prompt("Update price:", String(car.price || 0));
        if (price == null) return;

        const status = prompt("Status: available/reserved/sold", car.status || "available");
        CSDB.updateCar(id, { price: Number(price || 0), status: (status || car.status) });
      });
    });

    const count = $("#carCount");
    if (count) count.textContent = String(items.length);
  }

  // Optional: Add Car form (if exists)
  function bindAddForm() {
    const form = $("#addCarForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      // image input (multiple)
      const fileInput = form.querySelector('input[type="file"][name="images"]');
      let images = [];
      if (fileInput && fileInput.files && fileInput.files.length) {
        images = await Promise.all([...fileInput.files].map(fileToBase64));
      }

      CSDB.createCar({
        title: fd.get("title") || "",
        make: fd.get("make") || "",
        model: fd.get("model") || "",
        year: fd.get("year") || "",
        price: fd.get("price") || "",
        status: fd.get("status") || "available",
        images,
      });

      form.reset();
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    bindAddForm();
    CSDB.onChange(() => render());
  });
})();
