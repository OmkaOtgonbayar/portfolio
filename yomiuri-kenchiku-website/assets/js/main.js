// ===== main.js =====
document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // Reveal animation
  // =========================
  const reveals = document.querySelectorAll(".reveal");

  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("on");
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => io.observe(el));
  }

  // =========================
  // Burger menu (SAFE)
  // =========================
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (!toggle || !nav) return; // байхгүй page дээр crash хийхгүй

  function openMenu() {
    toggle.classList.add("active");
    nav.classList.add("open");
  }

  function closeMenu() {
    toggle.classList.remove("active");
    nav.classList.remove("open");
  }

  function isOpen() {
    return nav.classList.contains("open");
  }

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    isOpen() ? closeMenu() : openMenu();
  });

  // link дархад хаах
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", closeMenu);
  });

  // гадна дархад хаах
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // ESC дархад хаах
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // resize үед desktop бол хаах
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

});
