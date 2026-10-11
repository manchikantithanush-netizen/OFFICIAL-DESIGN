const dashboardLinks = document.querySelectorAll(".dashboard-nav a");
const sections = document.querySelectorAll("#home, #schedule, #speakers, #profile");

const setActiveLink = (id) => {
  dashboardLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
};

if (sections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleSection = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (visibleSection) setActiveLink(visibleSection.target.id);
  }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, .25, .6] });

  sections.forEach((section) => sectionObserver.observe(section));
}

dashboardLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveLink(link.getAttribute("href").slice(1)));
});
