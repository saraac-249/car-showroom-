/* assets/js/admin-auth.js */
(function () {
  const ADMIN_EMAIL = "admin@showroom.com";
  const ADMIN_PASSWORD = "admin123";

  const FLAG_KEY = "adminLoggedIn";
  const DATA_KEY = "adminData";

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function login(email, password) {
    const e = normalizeEmail(email);
    const p = String(password || "");
    if (e === ADMIN_EMAIL && p === ADMIN_PASSWORD) {
      localStorage.setItem(FLAG_KEY, "true");
      localStorage.setItem(
        DATA_KEY,
        JSON.stringify({
          email: ADMIN_EMAIL,
          role: "admin",
          loggedInAt: new Date().toISOString()
        })
      );
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(FLAG_KEY);
    localStorage.removeItem(DATA_KEY);
  }

  function isLoggedIn() {
    return localStorage.getItem(FLAG_KEY) === "true";
  }

  function getAdmin() {
    try { return JSON.parse(localStorage.getItem(DATA_KEY) || "null"); }
    catch { return null; }
  }

  // Fix for Live Server path confusion
  function resolvePath(preferAdminPath) {
    const p = window.location.pathname;
    const inAdminFolder = p.includes("/admin/") || p.includes("/admin/pages/");
    if (inAdminFolder) return preferAdminPath;        // "./dashboard.html" etc
    return preferAdminPath.replace("./", "");         // "dashboard.html"
  }

  // Use on login page
  function redirectIfLoggedIn(dashboardRel) {
    if (isLoggedIn()) window.location.href = resolvePath(dashboardRel);
  }

  // Use on every admin page
  function requireAuth(loginRel) {
    if (!isLoggedIn()) window.location.href = resolvePath(loginRel);
  }

  // Extra: admin-only (future roles)
  function requireAdmin(loginRel) {
    const a = getAdmin();
    if (!isLoggedIn() || !a || a.role !== "admin") {
      window.location.href = resolvePath(loginRel);
    }
  }

  window.AdminAuth = {
    login, logout, isLoggedIn, getAdmin,
    redirectIfLoggedIn, requireAuth, requireAdmin
  };
})();
