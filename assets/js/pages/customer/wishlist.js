/* assets/js/pages/customer/wishlist.js */
(() => {
  CustomerAuth?.requireAuth?.("../login.html");
  const $ = (s) => document.querySelector(s);

  function me() {
    return CustomerAuth?.getCustomer?.() || { id: "cust_demo_1" };
  }

  function key() {
    return `CS_WISHLIST_${me().id}`;
  }

  function getList() {
    return Store.get(key(), []);
  }
  function setList(arr) {
    Store.set(key(), arr);
  }

  function render() {
    const wrap = $("#wishlistWrap");
    const tbody = $("#wishlistBody");
    const list = getList();
    const cars = CSDB.listCars();

    const items = list
      .map((id) => cars.find((c) => c.id === id))
      .filter(Boolean);

    if (tbody) {
      tbody.innerHTML = items
        .map(
          (c) => `
        <tr>
          <td class="fw-semibold">${c.title}</td>
          <td><span class="badge ${c.status==="available"?"text-bg-success":c.status==="reserved"?"text-bg-warning":"text-bg-secondary"}">${c.status}</span></td>
          <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-rm="${c.id}">Remove</button></td>
        </tr>`
        )
        .join("");

      tbody.querySelectorAll("[data-rm]").forEach((b) =>
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-rm");
          setList(getList().filter((x) => x !== id));
          render();
        })
      );
    }

    // optional card render
    if (wrap && !tbody) {
      wrap.innerHTML = items
        .map(
          (c) => `
        <div class="card p-3 mb-2">
          <div class="fw-bold">${c.title}</div>
          <div class="text-muted">Status: ${c.status}</div>
          <button class="btn btn-sm btn-outline-danger mt-2" data-rm="${c.id}">Remove</button>
        </div>`
        )
        .join("");
      wrap.querySelectorAll("[data-rm]").forEach((b) =>
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-rm");
          setList(getList().filter((x) => x !== id));
          render();
        })
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    CSDB.ensureInit();
    render();
    CSDB.onChange(() => render());
  });
})();
