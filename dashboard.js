const dashboardLinks = document.querySelectorAll(".dashboard-nav a");
const sections = document.querySelectorAll("#home, #schedule, #speakers");
const agendaTabs = document.querySelectorAll(".agenda-tab");
const agendaPanels = document.querySelectorAll("[data-agenda-panel]");
const notificationButton = document.querySelector(".notification-button");
const notificationPanel = document.querySelector(".notification-panel");
const notificationClose = document.querySelector(".notification-close");
const campusButton = document.querySelector(".campus-button");
const comingSoonOverlay = document.querySelector(".coming-soon-overlay");
const studentName = document.querySelector("#student-name");
const timeGreeting = document.querySelector("#time-greeting");
const currentStudentNameKey = "roundsquare-current-student-name";

if (timeGreeting) {
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12
    ? "morning"
    : hour >= 12 && hour < 17
      ? "afternoon"
      : hour >= 17 && hour < 21
        ? "evening"
        : "night";
  timeGreeting.textContent = greeting;
}

if (studentName) {
  const name = window.sessionStorage.getItem(currentStudentNameKey);
  if (name) studentName.textContent = `${name}.`;
}

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

agendaTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selectedAgenda = tab.dataset.agenda;

    agendaTabs.forEach((agendaTab) => {
      const isSelected = agendaTab === tab;
      agendaTab.classList.toggle("is-active", isSelected);
      agendaTab.setAttribute("aria-selected", String(isSelected));
    });

    agendaPanels.forEach((panel) => {
      const isSelected = panel.dataset.agendaPanel === selectedAgenda;
      panel.hidden = !isSelected;
      panel.classList.toggle("is-visible", isSelected);
    });
  });

});

const toggleNotifications = (isOpen) => {
  notificationPanel.classList.toggle("is-open", isOpen);
  notificationPanel.setAttribute("aria-hidden", String(!isOpen));
  notificationButton.setAttribute("aria-expanded", String(isOpen));
};

notificationButton?.addEventListener("click", () => {
  toggleNotifications(!notificationPanel.classList.contains("is-open"));
});
notificationClose?.addEventListener("click", () => toggleNotifications(false));
campusButton?.addEventListener("click", () => {
  comingSoonOverlay.classList.remove("is-visible");
  void comingSoonOverlay.offsetWidth;
  comingSoonOverlay.classList.add("is-visible");
  comingSoonOverlay.setAttribute("aria-hidden", "false");
  window.setTimeout(() => comingSoonOverlay.setAttribute("aria-hidden", "true"), 1000);
});
