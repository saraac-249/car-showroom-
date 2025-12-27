/* assets/js/pages/customer/inquiries.js */
(() => {
  CustomerAuth?.requireAuth?.("../login.html");
  const $ = (s) => document.querySelector(s);

  function me() {
    return CustomerAuth?.getCustomer?.() || { id: "cust_demo_1", name: "Demo Customer", email: "demo@customer.com" };
  }

  function renderMine() {
    const tbody = $("#myInquiriesBody");
    if (!tbody) return;

    const m = me();
    const list = CSDB.listInquiries().filter((i) => i.customerId === m.id);

    tbody.innerHTML = list
      .map(
        (i) => `
      <tr>
        <td class="fw-semibold">${i.subject}</td>
        <td>${(i.message||"").slice(0,80)}${(i.message||"").length>80?"...":""}</td>
        <td><span class="badge ${i.status==="unread"?"text-bg-warning":"text-bg-success"}">${i.status}</span></td>
        <td>${new Date(i.createdAt).toLocaleString()}</td>
      </tr>`
      )
      .join("");
  }

  function bindForm() {
    const form = $("#inquiryForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const m = me();

      CSDB.createInquiry({
        customerId: m.id,
        customerName: m.name,
        email: m.email,
        subject: fd.get("subject"),
        message: fd.get("message"),
      });

      form.reset();
      alert("Inquiry sent ✅ (Admin panel me show hogi)");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    CSDB.ensureInit();
    bindForm();
    renderMine();
    CSDB.onChange(() => renderMine());
  });
})();
