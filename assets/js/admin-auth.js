/* assets/js/admin-auth.js */
(function () {
  const ADMIN_EMAIL = "admin@showroom.com";
  const ADMIN_PASSWORD = "admin123";

  const FLAG_KEY = "adminLoggedIn";
  const DATA_KEY = "adminData";

  // session expiry (milliseconds) e.g. 12 hours
  const SESSION_TTL = 12 * 60 * 60 * 1000;

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function now() {
    return Date.now();
  }

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function setSession() {
    localStorage.setItem(FLAG_KEY, "true");
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        email: ADMIN_EMAIL,
        role: "admin",
        loggedInAt: now(),          // store as number for easy compare
        expiresAt: now() + SESSION_TTL
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(FLAG_KEY);
    localStorage.removeItem(DATA_KEY);
  }

  function getAdmin() {
    const data = safeParse(localStorage.getItem(DATA_KEY) || "null");
    return data && typeof data === "object" ? data : null;
  }

  function isLoggedIn() {
    if (localStorage.getItem(FLAG_KEY) !== "true") return false;

    const a = getAdmin();
    if (!a || a.email !== ADMIN_EMAIL || a.role !== "admin") {
      clearSession();
      return false;
    }

    // expiry check
    if (!a.expiresAt || now() > a.expiresAt) {
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

  // Fix for Live Server path confusion
  function resolvePath(preferAdminPath) {
    const p = window.location.pathname;
    const inAdminFolder = p.includes("/admin/") || p.includes("/admin/pages/");
    return inAdminFolder ? preferAdminPath : preferAdminPath.replace("./", "");
  }

  // Use on login page
  function redirectIfLoggedIn(dashboardRel) {
    // prevent redirect loop if already on dashboard
    const target = resolvePath(dashboardRel);
    const current = window.location.pathname.split("/").pop();
    const targetFile = target.split("/").pop();

    if (isLoggedIn() && current !== targetFile) {
      window.location.replace(target); // replace prevents back button loop
    }
  }

  // Use on every admin page
  function requireAuth(loginRel) {
    if (!isLoggedIn()) {
      window.location.replace(resolvePath(loginRel));
    }
  }

  function requireAdmin(loginRel) {
    const a = getAdmin();
    if (!isLoggedIn() || !a || a.role !== "admin") {
      window.location.replace(resolvePath(loginRel));
    }
  }

  window.AdminAuth = {
    login,
    logout,
    isLoggedIn,
    getAdmin,
    redirectIfLoggedIn,
    requireAuth,
    requireAdmin
  };
})();
