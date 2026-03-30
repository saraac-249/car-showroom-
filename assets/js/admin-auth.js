// assets/js/admin-auth.js
(function () {
  const ADMIN_EMAIL = "admin@showroom.com";
  const ADMIN_PASSWORD = "admin123";

  const store = sessionStorage; // tab close => logout

  const FLAG_KEY = "adminLoggedIn";
  const DATA_KEY = "adminData";

  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function setSession() {
    store.setItem(FLAG_KEY, "true");
    store.setItem(DATA_KEY, JSON.stringify({
      email: ADMIN_EMAIL,
      role: "admin",
      name: "Admin",
      loggedInAt: new Date().toISOString()
    }));
  }

  function clearSession() {
    store.removeItem(FLAG_KEY);
    store.removeItem(DATA_KEY);
  }

  function getAdmin() {
    const data = safeParse(store.getItem(DATA_KEY) || "null");
    return data && typeof data === "object" ? data : null;
  }

  function isLoggedIn() {
    if (store.getItem(FLAG_KEY) !== "true") return false;
    const a = getAdmin();
    if (!a || a.email !== ADMIN_EMAIL || a.role !== "admin") {
      clearSession();
      return false;
    }
    return true;
  }

  function login(email, password) {
    const e = normalizeEmail(email);
    const p = String(password || "");
    if (e === ADMIN_EMAIL && p === ADMIN_PASSWORD) {
      setSession();
      return true;
    }
    return false;
  }

  function logout() {
    clearSession();
  }

  function requireAuth(loginRel) {
    if (!isLoggedIn()) {
      location.replace(loginRel || "./login.html");
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn(dashboardRel) {
    if (isLoggedIn()) location.replace(dashboardRel || "./dashboard.html");
  }

  window.AdminAuth = { login, logout, isLoggedIn, getAdmin, requireAuth, redirectIfLoggedIn };
})();