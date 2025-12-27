/* assets/js/pages/customer/profile.js */
(() => {
  CustomerAuth?.requireAuth?.("../login.html");
  const $ = (s) => document.querySelector(s);

  function me() {
    return CustomerAuth?.getCustomer?.();
  }

  function load() {
    const m = me();
    if (!m) return;
    const c = CSDB.listCustomers().find((x) => x.id === m.id);
    if (!c) return;

    if ($("#name")) $("#name").value = c.name || "";
    if ($("#email")) $("#email").value = c.email || "";
    if ($("#phone")) $("#phone").value = c.phone || "";
  }

  function bind() {
    const form = $("#profileForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const m = me();
      if (!m) return;

      const fd = new FormData(form);
      CSDB.updateCustomer(m.id, { name: fd.get("name"), phone: fd.get("phone") });
      // keep auth name in sync
      CustomerAuth.setCustomer({ ...m, name: fd.get("name") });
      alert("Profile updated ✅");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    CSDB.ensureInit();
    load();
    bind();
    CSDB.onChange(() => load());
  });
})();
