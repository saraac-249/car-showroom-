// assets/js/pages/dashboard.js

const customer = JSON.parse(localStorage.getItem("customerData") || "{}");
const bookings = Store.get("cs_bookings", []);
const wishlist = Store.get("cs_cars", []);
const payments = Store.get("cs_payments", []);
const inquiries = Store.get("cs_inquiries", []);
const messages = Store.get("contactMessages", []);

document.getElementById("welcomeLine").innerText =
  customer.name ? `Welcome, ${customer.name}` : "Welcome!";

document.getElementById("statBookings").innerText = bookings.length;
document.getElementById("statSaved").innerText = wishlist.length;

const pending = payments.filter(p => p.status !== "paid").length;
document.getElementById("statPayments").innerText = pending;

document.getElementById("statInquiriesInline").innerText = inquiries.length;
document.getElementById("statMessagesInline").innerText = messages.length;

document.getElementById("year").innerText = new Date().getFullYear();
