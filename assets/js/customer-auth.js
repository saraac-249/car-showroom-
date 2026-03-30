/* /assets/js/customer-auth.js
   - Customer session in localStorage
   - No blink: requireAuthEarly() for <head>
   - Also upsert customer into AppDB so Admin can see total customers
*/
(function () {
  const DATA_KEY = "customerData";

  const safeParse = (v) => { try { return JSON.parse(v); } catch { return null; } };
  const norm = (v) => String(v || "").trim();

  function getCustomer() {
    const d = safeParse(localStorage.getItem(DATA_KEY));
    return d && typeof d === "object" ? d : null;
  }

  function isLoggedIn() {
    const c = getCustomer();
    return !!(c && c.email);
  }

  function setCustomer(customer) {
    const c = {
      email: norm(customer?.email).toLowerCase(),
      name: norm(customer?.name),
      phone: norm(customer?.phone),
      city: norm(customer?.city),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(c));

    // ✅ write/update into shared DB so admin can count customers
    if (window.AppDB) window.AppDB.upsertCustomer(c);
    return c;
  }

  function logout(loginPath) {
    localStorage.removeItem(DATA_KEY);
    window.location.replace(loginPath || "login.html");
  }

  // ✅ no blink
  function requireAuthEarly(loginPath) {
    if (!isLoggedIn()) {
      window.location.replace(loginPath);
    } else {
      document.documentElement.style.visibility = "visible";
    }
  }

  function requireAuth(loginPath) {
    if (!isLoggedIn()) window.location.replace(loginPath);
  }

  window.CustomerAuth = { getCustomer, isLoggedIn, setCustomer, logout, requireAuthEarly, requireAuth };
})();
