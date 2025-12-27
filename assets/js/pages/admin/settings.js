/* assets/js/pages/admin/settings.js */
(function () {
  AdminAuth.requireAuth("./login.html");
  const $ = (s) => document.querySelector(s);

  function render() {
    const s = CSDB.getSettings();

    const name = $("#showroomName");
    const currency = $("#currency");

    if (name) name.value = s.showroomName || "";
    if (currency) currency.value = s.currency || "";
  }

  function bind() {
    const form = $("#settingsForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      CSDB.updateSettings({
        showroomName: fd.get("showroomName") || "",
        currency: fd.get("currency") || "",
      });
      alert("Settings saved");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    bind();
    CSDB.onChange(() => render());
  });
})();
