import { barazaRecords } from "./baraza-data.js";
import { initializeDiscussionPlanner } from "./discussion-planner.js";

const getSelectedRecord = () => {
  let selectedId;
  try {
    selectedId = Number(window.sessionStorage.getItem("roundsquare-local-planner-baraza"));
  } catch (error) {
    console.error("Unable to read the selected Baraza for this session.", error);
  }
  return barazaRecords.find(({ id }) => id === selectedId) || null;
};

const renderLeaderDashboard = (record) => {
  const profileView = document.querySelector(".baraza-profile-view");
  if (!profileView) {
    console.error("The Baraza profile view is missing.");
    return false;
  }

  document.body.classList.add("is-baraza-leader");
  profileView.hidden = false;
  profileView.dataset.theme = record.ribbon?.toLowerCase().replaceAll(" ", "-") || "default";
  profileView.querySelector(".view-back-button").hidden = true;
  profileView.querySelector(".view-heading .eyebrow").textContent = "Baraza dashboard";
  const welcome = profileView.querySelector("[data-leader-welcome]");
  welcome.textContent = "Welcome, Baraza leaders.";
  welcome.hidden = false;

  profileView.querySelector("#profile-title").textContent = record.happiness;
  profileView.querySelector("#profile-language").textContent = record.language;
  profileView.querySelector("#profile-level").textContent = record.level;
  profileView.querySelector("#profile-room").textContent = record.room;
  profileView.querySelector("#profile-head").textContent = record.head;
  record.admins.forEach((name, index) => {
    profileView.querySelector(`#profile-admin-${index === 0 ? "one" : "two"}`).textContent = name;
  });
  [record.coLeaders[0], record.coLeaders[1]].forEach((name, index) => {
    const leader = profileView.querySelector(`#profile-co-${index === 0 ? "one" : "two"}`);
    leader.textContent = name || "";
    leader.parentElement.hidden = !name;
  });
  return true;
};

export const initializeBarazaLeaderDashboard = () => {
  const shell = document.querySelector(".dashboard-shell");
  if (!shell) {
    console.error("The Baraza dashboard shell is missing.");
    return;
  }

  const record = getSelectedRecord();
  if (!record) {
    window.location.replace("signin.html");
    return;
  }
  if (!renderLeaderDashboard(record)) return;
  initializeDiscussionPlanner(record);
  document.querySelector(".leader-signout-link")?.addEventListener("click", () => {
    window.sessionStorage.removeItem("roundsquare-local-planner-baraza");
  });

  const profileView = document.querySelector(".baraza-profile-view");
  const plannerView = document.querySelector(".discussion-planner-view");
  const showView = () => {
    const isPlanner = window.location.hash === "#discussion-planner";
    profileView.hidden = isPlanner;
    plannerView.hidden = !isPlanner;
    document.querySelector(".leader-profile-link")?.classList.toggle("is-active", !isPlanner);
    document.querySelector(".leader-planner-link")?.classList.toggle("is-active", isPlanner);
  };
  window.addEventListener("hashchange", showView);
  showView();
};
