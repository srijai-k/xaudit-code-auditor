const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((el) => {
  if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
  revealObserver.observe(el);
});

document.querySelectorAll(".cta, .service-grid a").forEach((el) => {
  el.addEventListener("pointermove", (event) => {
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.14;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener("pointerleave", () => {
    el.style.transform = "";
  });
});

const ticker = document.querySelector(".ticker-track");
const tickerInner = document.querySelector(".ticker-inner");
if (tickerInner) tickerInner.innerHTML += tickerInner.innerHTML;

const awards = document.querySelector(".award-track");
if (awards) awards.innerHTML += awards.innerHTML;

let lastScroll = window.scrollY;
const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  header.style.transform = y > lastScroll && y > 180 ? "translateY(-86px)" : "translateY(0)";
  lastScroll = y;
}, { passive: true });

const menuButton = document.querySelector(".menu-pill");
const menuPanel = document.querySelector(".menu-panel");
if (menuButton && menuPanel) {
  const label = menuButton.querySelector("em");
  const setMenu = (open) => {
    menuButton.classList.toggle("is-open", open);
    menuPanel.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuPanel.setAttribute("aria-hidden", String(!open));
    if (label) label.textContent = open ? "Close" : "Menu";
  };

  menuButton.addEventListener("click", () => setMenu(!menuButton.classList.contains("is-open")));
  menuPanel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
}
