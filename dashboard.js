const dashboardLinks = document.querySelectorAll(".dashboard-nav a");
const sections = document.querySelectorAll("#home, #schedule, #speakers");
const agendaTabs = document.querySelectorAll(".agenda-tab");
const agendaPanels = document.querySelectorAll("[data-agenda-panel]");
const addCalendarButton = document.querySelector(".add-calendar-button");
const notificationButton = document.querySelector(".notification-button");
const notificationPanel = document.querySelector(".notification-panel");
const notificationClose = document.querySelector(".notification-close");
const campusButton = document.querySelector(".campus-button");
const comingSoonOverlay = document.querySelector(".coming-soon-overlay");
const signOutLink = document.querySelector(".sign-out-link");
const studentName = document.querySelector("#student-name");
const timeGreeting = document.querySelector("#time-greeting");
const currentStudentNameKey = "roundsquare-current-student-name";
const registrationKey = "roundsquare-student-registered";

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
  const name = window.localStorage.getItem(currentStudentNameKey);
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

const pad = (value) => String(value).padStart(2, "0");
const escapeCalendarText = (value) => String(value)
  .replace(/\\/g, "\\\\")
  .replace(/;/g, "\\;")
  .replace(/,/g, "\\,")
  .replace(/\r?\n/g, "\\n");

const calendarMinutes = (time, minimumMinutes = 0) => {
  const match = time.trim().match(/^(\d+):(\d+)(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (!meridiem && hour < 12 && hour * 60 + minute < minimumMinutes) hour += 12;
  return hour * 60 + minute;
};

const calendarTime = (minutes) => {
  const hour = Math.floor(minutes / 60) % 24;
  return `${pad(hour)}${pad(minutes % 60)}00`;
};

const createCalendarFile = () => {
  const selectedPanel = document.querySelector("[data-agenda-panel].is-visible") ||
    document.querySelector("[data-agenda-panel]:not([hidden])");
  if (!selectedPanel) return;

  const selectedTab = document.querySelector(".agenda-tab.is-active");
  const agendaName = selectedTab?.textContent.trim() || "Event";
  let previousStart = 0;
  const events = [...selectedPanel.querySelectorAll(".agenda-row")].map((row) => {
    const timeParts = row.querySelector("time")?.textContent.trim().split("–").map((part) => part.trim()) || [];
    const startMinutes = calendarMinutes(timeParts[0], previousStart);
    const endMinutes = timeParts[1] ? calendarMinutes(timeParts[1], startMinutes) : startMinutes + 15;
    const title = row.querySelector(":scope > span")?.textContent.trim() || "Event activity";
    if (startMinutes === null || endMinutes === null) return null;

    previousStart = startMinutes;
    return [
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}@roundsquare`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART:20261017T${calendarTime(startMinutes)}`,
      `DTEND:20261017T${calendarTime(endMinutes)}`,
      `SUMMARY:${escapeCalendarText(`${agendaName}: ${title}`)}`,
      "LOCATION:The Indian High School, Dubai",
      "END:VEVENT",
    ].join("\r\n");
  }).filter(Boolean);

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Roundsquare//Pursuit of Happiness 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
  const blobUrl = URL.createObjectURL(new Blob([`${calendar}\r\n`], { type: "text/calendar;charset=utf-8" }));
  const downloadLink = document.createElement("a");
  downloadLink.href = blobUrl;
  downloadLink.download = `${agendaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-schedule.ics`;
  downloadLink.click();
  URL.revokeObjectURL(blobUrl);
};

addCalendarButton?.addEventListener("click", createCalendarFile);

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

signOutLink?.addEventListener("click", () => {
  window.localStorage.removeItem(currentStudentNameKey);
  window.localStorage.removeItem(registrationKey);
  window.sessionStorage.removeItem("roundsquare-admin-authorized");
});
