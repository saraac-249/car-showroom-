// assets/js/customer-auth.js

(function () {
  const customer = localStorage.getItem("customerData");

  // protect pages (except login/signup)
  const page = location.pathname.split("/").pop();
  if (!customer && !["login.html", "signup.html"].includes(page)) {
    location.href = "login.html";
  }

  // logout
  const btn = document.getElementById("btnLogout");
  if (btn) {
    btn.onclick = () => {
      localStorage.removeItem("customerData");
      location.href = "login.html";
    };
  }

  // navbar active
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === page) {
      link.classList.add("active");
    }
  });
})();
