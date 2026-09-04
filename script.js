const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((el) => {
  if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
  revealObserver.observe(el);
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canSmoothScroll = !prefersReducedMotion && window.innerWidth > 760;
if (canSmoothScroll) {
  let targetScroll = window.scrollY;
  let currentScroll = window.scrollY;
  let smoothFrame = null;

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  const clampScroll = (value) => Math.max(0, Math.min(value, maxScroll()));
  const smoothStep = () => {
    currentScroll += (targetScroll - currentScroll) * 0.12;
    if (Math.abs(targetScroll - currentScroll) < 0.5) {
      currentScroll = targetScroll;
      smoothFrame = null;
      window.scrollTo(0, currentScroll);
      return;
    }
    window.scrollTo(0, currentScroll);
    smoothFrame = requestAnimationFrame(smoothStep);
  };
  const startSmoothScroll = () => {
    if (!smoothFrame) smoothFrame = requestAnimationFrame(smoothStep);
  };

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey) return;
    event.preventDefault();
    targetScroll = clampScroll(targetScroll + event.deltaY);
    startSmoothScroll();
  }, { passive: false });

  window.addEventListener("resize", () => {
    targetScroll = window.scrollY;
    currentScroll = window.scrollY;
  });
}

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
