const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");

if (currentYear) currentYear.textContent = new Date().getFullYear();

if (menuToggle && primaryNavigation) {
  const closeMenu = () => {
    primaryNavigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = primaryNavigation.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("click", (event) => {
    if (primaryNavigation.classList.contains("is-open") &&
        !primaryNavigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
}

document.querySelectorAll('a[href="signin.html"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const transition = document.createElement("div");
    transition.className = "page-transition";
    document.body.appendChild(transition);
    requestAnimationFrame(() => transition.classList.add("is-active"));

    window.setTimeout(() => {
      window.location.href = link.href;
    }, 320);
  });
});
