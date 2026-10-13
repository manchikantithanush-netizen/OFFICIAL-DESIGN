import { supabase } from "./supabase-client.js";
import { barazaRecords } from "./baraza-data.js";

const dashboardLinks = document.querySelectorAll(".dashboard-nav a");
const sections = document.querySelectorAll("#home, #schedule, #speakers");
const agendaTabs = document.querySelectorAll(".agenda-tab");
const agendaPanels = document.querySelectorAll("[data-agenda-panel]");
const addCalendarButton = document.querySelector(".add-calendar-button");
const dashboardShell = document.querySelector(".dashboard-shell");
const settingsNavLink = document.querySelector(".settings-nav-link");
const barazaNavLink = document.querySelector(".baraza-nav-link");
const settingsView = document.querySelector(".settings-view");
const standardDashboardContent = document.querySelectorAll(".welcome-section, .baraza-banner, .event-strip, .resource-links, .event-countdown, .section-block, .quick-links, .dashboard-footer");
const reminderButton = document.querySelector(".reminder-button");
const reminderModal = document.querySelector(".reminder-modal");
const reminderClose = document.querySelector(".reminder-close");
const reminderStatus = document.querySelector(".reminder-status");
const confirmRemindersButton = document.querySelector(".confirm-reminders-button");
const reminderOptions = document.querySelectorAll("[data-reminder-schedule]");
const notificationCopy = document.querySelector(".notification-copy");
const noNotifications = document.querySelector(".no-notifications");
const notificationList = document.querySelector(".notification-list");
const notificationButton = document.querySelector(".notification-button");
const notificationBadge = document.querySelector(".notification-badge");
const notificationPanel = document.querySelector(".notification-panel");
const notificationClose = document.querySelector(".notification-close");
const notificationClearButton = document.querySelector(".notification-clear-button");
const notificationToast = document.querySelector(".notification-toast");
const notificationToastTitle = document.querySelector(".notification-toast-title");
const notificationToastMessage = document.querySelector(".notification-toast-message");
const campusButton = document.querySelector(".campus-button");
const comingSoonOverlay = document.querySelector(".coming-soon-overlay");
const signOutLink = document.querySelector(".sign-out-link");
const studentName = document.querySelector("#student-name");
const timeGreeting = document.querySelector("#time-greeting");
const currentStudentNameKey = "roundsquare-current-student-name";
const gradeGroupKey = "roundsquare-grade-group";
const registrationKey = "roundsquare-student-registered";
const reminderScheduleKey = "roundsquare-reminder-schedule";
const reminderHistoryKey = "roundsquare-reminder-history";
const unreadNotificationsKey = "roundsquare-unread-notifications";
const reminderTimers = [];
let unreadNotifications = Number(window.localStorage.getItem(unreadNotificationsKey) || 0);
let notificationToastTimer;
let notificationToastStartX = null;
let selectedReminderSchedule = window.localStorage.getItem(reminderScheduleKey);
const gradeGroup = window.localStorage.getItem(gradeGroupKey);
const gradeConfig = {
  "5-7": { baraza: "King Constantine", schedule: "junior", scheduleLabel: "Junior", label: "Grades 5–7 · Junior" },
  "8-9": { baraza: "Roy McComish", schedule: "intermediate", scheduleLabel: "Intermediate", label: "Grades 8–9 · Intermediate" },
  "10-12": { baraza: "Krut Han", schedule: "intermediate", scheduleLabel: "Senior", label: "Grades 10–12 · Senior" },
};
const studentConfig = gradeConfig[gradeGroup] || gradeConfig["5-7"];
const directoryView = document.querySelector(".baraza-directory-view");
const profileView = document.querySelector(".baraza-profile-view");
const directoryGrid = document.querySelector("[data-baraza-directory]");
const dashboardViews = document.querySelectorAll(".dashboard-shell > section, .dashboard-shell > .resource-links, .dashboard-shell > .quick-links, .dashboard-shell > .dashboard-footer");
const reminderSchedules = {
  intermediate: [
    ["09:00", "Registration"], ["09:30", "Opening Ceremony"], ["10:30", "Baraza Session 1"],
    ["12:40", "Lunch"], ["13:30", "Keynote Speaker"], ["14:00", "Creative Expression Session"],
    ["14:30", "Photo Session"], ["15:00", "Baraza Session 2"], ["16:30", "Team Dance & Closing Ceremony"],
    ["17:45", "Dispersal"],
  ],
  junior: [
    ["09:00", "Registration"], ["09:30", "Opening Ceremony"], ["10:30", "Scavenger Hunt"],
    ["11:40", "Baraza Session 1"], ["12:40", "Lunch"], ["13:30", "Keynote Speaker"],
    ["14:00", "Creative Expression Session"], ["14:30", "Photo Sessions"], ["15:00", "Baraza Session 2"],
    ["16:30", "Team Dance"], ["17:45", "Dispersal"],
  ],
};

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

document.querySelector("#baraza-title")?.replaceChildren(document.createTextNode(studentConfig.baraza));
document.querySelector("#baraza-subtitle")?.replaceChildren(document.createTextNode(studentConfig.label));
document.querySelector("#intermediate-tab")?.replaceChildren(document.createTextNode(studentConfig.scheduleLabel));
document.querySelector(`[data-reminder-schedule="${studentConfig.schedule}"] strong`)?.replaceChildren(document.createTextNode(studentConfig.scheduleLabel));

const setActiveLink = (id) => {
  dashboardLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
};

const showBarazaView = (view) => {
  dashboardViews.forEach((item) => {
    if (item === directoryView || item === profileView) return;
    item.hidden = view !== "dashboard" && item !== settingsView;
  });
  directoryView.hidden = view !== "directory";
  profileView.hidden = view !== "profile";
  if (view === "settings") {
    dashboardShell?.classList.add("is-settings");
    settingsView.hidden = false;
  } else {
    dashboardShell?.classList.remove("is-settings");
    settingsView.hidden = true;
  }
  dashboardShell?.classList.toggle("is-baraza-view", view === "directory" || view === "profile");
  barazaNavLink?.classList.toggle("is-active", view === "directory" || view === "profile");
  settingsNavLink?.classList.toggle("is-active", view === "settings");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const displayLeader = (name) => name || "To be confirmed";
const renderProfile = (record) => {
  document.querySelector("#profile-title").textContent = record.happiness;
  document.querySelector("#profile-language").textContent = record.language;
  document.querySelector("#profile-level").textContent = record.level;
  document.querySelector("#profile-ribbon-name").textContent = record.ribbon;
  document.querySelector("#profile-ribbon").dataset.ribbon = record.ribbon.toLowerCase().replaceAll(" ", "-");
  document.querySelector("#profile-head").textContent = displayLeader(record.head);
  document.querySelector("#profile-co-one").textContent = displayLeader(record.coLeaders[0]);
  document.querySelector("#profile-co-two").textContent = displayLeader(record.coLeaders[1]);
};

const openProfile = (record) => {
  renderProfile(record);
  showBarazaView("profile");
};

if (directoryGrid) {
  directoryGrid.replaceChildren(...barazaRecords.map((record) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "baraza-directory-card";
    card.innerHTML = `<span class="directory-number">0${record.id}</span><strong>${record.happiness}</strong><small>${record.language} · ${record.level}</small><em>${record.ribbon} ribbon</em>`;
    card.addEventListener("click", () => openProfile(record));
    return card;
  }));
}

document.querySelector("[data-open-your-baraza]")?.addEventListener("click", () => {
  showBarazaView("directory");
  setActiveLink("");
});
document.querySelectorAll("[data-open-baraza-directory]").forEach((button) => {
  button.addEventListener("click", () => {
    showBarazaView("directory");
    setActiveLink("");
  });
});
document.querySelector("[data-return-dashboard]")?.addEventListener("click", () => showBarazaView("dashboard"));
barazaNavLink?.addEventListener("click", () => {
  showBarazaView("directory");
  setActiveLink("");
});

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
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showBarazaView("dashboard");
    dashboardShell?.classList.remove("is-settings");
    if (settingsView) settingsView.hidden = true;
    standardDashboardContent.forEach((content) => {
      content.hidden = false;
    });
    settingsNavLink?.classList.remove("is-active");
    barazaNavLink?.classList.remove("is-active");
    setActiveLink(link.getAttribute("href").slice(1));
    const target = document.querySelector(link.getAttribute("href"));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

settingsNavLink?.addEventListener("click", () => {
  showBarazaView("settings");
  dashboardShell?.classList.add("is-settings");
  standardDashboardContent.forEach((content) => {
    content.hidden = true;
  });
  if (settingsView) settingsView.hidden = false;
  dashboardLinks.forEach((link) => link.classList.remove("is-active"));
  barazaNavLink?.classList.remove("is-active");
  settingsNavLink.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
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

const setStudentAgenda = (scheduleName) => {
  agendaTabs.forEach((tab) => {
    tab.hidden = tab.dataset.agenda !== scheduleName;
  });
  const selectedTab = document.querySelector(`.agenda-tab[data-agenda="${scheduleName}"]`);
  selectedTab?.click();
};
setStudentAgenda(studentConfig.schedule);

const getReminderHistory = () => JSON.parse(window.localStorage.getItem(reminderHistoryKey) || "[]");
const saveReminderHistory = (history) => window.localStorage.setItem(reminderHistoryKey, JSON.stringify(history.slice(-8)));

const updateNotificationBadge = () => {
  if (!notificationBadge) return;
  notificationBadge.textContent = unreadNotifications > 99 ? "99+" : String(unreadNotifications);
  notificationBadge.hidden = unreadNotifications === 0;
  notificationBadge.setAttribute("aria-label", `${unreadNotifications} unread notification${unreadNotifications === 1 ? "" : "s"}`);
};

const showNotificationToast = (title, message) => {
  if (!notificationToast || notificationPanel?.classList.contains("is-open")) return;
  notificationToastTitle.textContent = title;
  notificationToastMessage.textContent = message;
  notificationToast.classList.remove("is-dismissing");
  notificationToast.classList.add("is-visible");
  notificationToast.setAttribute("aria-hidden", "false");
  window.clearTimeout(notificationToastTimer);
  notificationToastTimer = window.setTimeout(() => {
    notificationToast.classList.remove("is-visible");
    notificationToast.setAttribute("aria-hidden", "true");
  }, 5000);
};

notificationToast?.addEventListener("touchstart", (event) => {
  notificationToastStartX = event.touches[0].clientX;
}, { passive: true });

notificationToast?.addEventListener("touchend", (event) => {
  if (notificationToastStartX === null) return;
  const distance = event.changedTouches[0].clientX - notificationToastStartX;
  notificationToastStartX = null;
  if (Math.abs(distance) < 60) return;
  window.clearTimeout(notificationToastTimer);
  notificationToast.classList.add("is-dismissing");
  window.setTimeout(() => {
    notificationToast.classList.remove("is-visible", "is-dismissing");
    notificationToast.setAttribute("aria-hidden", "true");
  }, 220);
});

const addUnreadNotification = (title, message) => {
  unreadNotifications += 1;
  window.localStorage.setItem(unreadNotificationsKey, String(unreadNotifications));
  updateNotificationBadge();
  showNotificationToast(title, message);
};

updateNotificationBadge();

const renderReminderNotifications = async () => {
  const history = getReminderHistory();
  let adminMessages = [];
  try {
    const { data, error } = await supabase
      .from("admin_messages")
    .select("id, title, message, content, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    adminMessages = data || [];
  } catch (error) {
    console.error("Unable to load admin messages.", error);
  }
  if (!history.length && !adminMessages.length) {
    if (noNotifications) noNotifications.textContent = "NO NOTIFICATIONS";
    if (notificationList) notificationList.innerHTML = '<p class="notification-empty">You are all caught up for now.</p>';
    return;
  }

  if (noNotifications) noNotifications.textContent = adminMessages.length ? "UPDATES & REMINDERS" : "SCHEDULE REMINDERS";
  if (notificationList) {
    const reminderItems = history.slice(-6).reverse().map((entry) => {
      const item = typeof entry === "string" ? { message: entry, timestamp: Date.now() } : entry;
      return { title: "Roundsquare reminder", message: item.message, timestamp: item.timestamp };
    });
    const messageItems = adminMessages.slice(0, 6).map((item) => ({
      title: item.title,
      message: item.message || item.content,
      timestamp: item.created_at,
    }));
    notificationList.replaceChildren(...[...messageItems, ...reminderItems].map((item) => {
      const card = document.createElement("article");
      card.className = "notification-item";
      const title = document.createElement("strong");
      title.textContent = item.title;
      const message = document.createElement("span");
      message.textContent = item.message;
      const time = document.createElement("time");
      time.dateTime = new Date(item.timestamp).toISOString();
      time.textContent = new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      card.append(title, message, time);
      return card;
    }));
  }
};

const addReminderNotification = (message) => {
  const history = getReminderHistory();
  history.push({ message, timestamp: Date.now() });
  saveReminderHistory(history);
  addUnreadNotification("Roundsquare reminder", message);
  renderReminderNotifications();
};

renderReminderNotifications();
supabase
  .channel("student-admin-messages")
  .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages" }, (payload) => {
    renderReminderNotifications();
    if (payload.eventType === "INSERT" && payload.new) {
      addUnreadNotification(payload.new.title || "New update", payload.new.message || payload.new.content || "");
    }
  })
  .subscribe();

const showBrowserNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "Images/ihslogo.png" });
  }
};

const clearScheduledReminders = () => {
  reminderTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
};

const scheduleReminders = (scheduleName) => {
  clearScheduledReminders();
  reminderSchedules[scheduleName].forEach(([time, title]) => {
    const [hour, minute] = time.split(":").map(Number);
    const eventDate = new Date(2026, 9, 17, hour, minute);
    const delay = eventDate.getTime() - Date.now();
    if (delay <= 0) return;
    const timer = window.setTimeout(() => {
      const message = `${studentConfig.scheduleLabel}: ${title}`;
      addReminderNotification(message);
      showBrowserNotification("Roundsquare reminder", message);
    }, delay);
    reminderTimers.push(timer);
  });
};

const requestReminders = async (scheduleName) => {
  let browserNotificationsEnabled = !("Notification" in window);
  if ("Notification" in window && Notification.permission !== "granted") {
    try {
      const permission = await Notification.requestPermission();
      browserNotificationsEnabled = permission === "granted";
    } catch (error) {
      browserNotificationsEnabled = false;
      reminderStatus.textContent = "Browser notifications are unavailable. In-dashboard reminders are still enabled.";
    }
  } else if ("Notification" in window) {
    browserNotificationsEnabled = Notification.permission === "granted";
  }
  window.localStorage.setItem(reminderScheduleKey, scheduleName);
  scheduleReminders(scheduleName);
  reminderStatus.textContent = browserNotificationsEnabled
    ? `${studentConfig.scheduleLabel} reminders are ready.`
    : "Reminders saved. In-dashboard alerts are enabled; browser notifications are not allowed.";
  window.setTimeout(() => reminderModal.classList.remove("is-open"), 700);
};

const clearReminders = () => {
  clearScheduledReminders();
  window.localStorage.removeItem(reminderScheduleKey);
  window.localStorage.removeItem(reminderHistoryKey);
  selectedReminderSchedule = null;
  reminderOptions.forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderReminderNotifications();
  reminderStatus.textContent = "All reminders have been cleared.";
};

const selectReminderSchedule = (scheduleName) => {
  if (!reminderSchedules[scheduleName]) return;
  selectedReminderSchedule = scheduleName;
  reminderOptions.forEach((button) => {
    const isSelected = button.dataset.reminderSchedule === scheduleName;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
};

reminderButton?.addEventListener("click", () => {
  selectReminderSchedule(selectedReminderSchedule);
  reminderModal.classList.add("is-open");
});
reminderClose?.addEventListener("click", () => reminderModal.classList.remove("is-open"));
reminderOptions.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectReminderSchedule(button.dataset.reminderSchedule));
});
confirmRemindersButton?.addEventListener("click", () => {
  if (!selectedReminderSchedule) {
    reminderStatus.textContent = "Choose one schedule before confirming.";
    return;
  }
  requestReminders(selectedReminderSchedule);
});
notificationClearButton?.addEventListener("click", clearReminders);

const savedReminderSchedule = window.localStorage.getItem(reminderScheduleKey);
const studentSchedule = studentConfig.schedule;
reminderOptions.forEach((button) => {
  button.hidden = button.dataset.reminderSchedule !== studentSchedule;
});
if (savedReminderSchedule && savedReminderSchedule === studentSchedule && reminderSchedules[savedReminderSchedule]) {
  selectReminderSchedule(savedReminderSchedule);
  scheduleReminders(savedReminderSchedule);
}

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
  renderReminderNotifications();
  notificationPanel.classList.toggle("is-open", isOpen);
  notificationPanel.setAttribute("aria-hidden", String(!isOpen));
  notificationButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen && notificationToast) {
    window.clearTimeout(notificationToastTimer);
    notificationToast.classList.remove("is-visible", "is-dismissing");
    notificationToast.setAttribute("aria-hidden", "true");
  }
  if (isOpen) {
    unreadNotifications = 0;
    window.localStorage.removeItem(unreadNotificationsKey);
    updateNotificationBadge();
  }
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
  window.localStorage.removeItem(gradeGroupKey);
  window.localStorage.removeItem(registrationKey);
  window.sessionStorage.removeItem("roundsquare-admin-authorized");
  window.location.href = "signin.html";
});
