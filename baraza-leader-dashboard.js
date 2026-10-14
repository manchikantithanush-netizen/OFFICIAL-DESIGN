import { barazaRecords } from "./baraza-data.js";
import { initializeDiscussionPlanner } from "./discussion-planner.js";

const selectedBarazaKey = "roundsquare-local-planner-baraza";

const getSelectedRecord = () => {
  let selectedId;
  try {
    selectedId = Number(window.localStorage.getItem(selectedBarazaKey));
  } catch (error) {
    console.error("Unable to read the selected local Baraza.", error);
  }
  return barazaRecords.find(({ id }) => id === selectedId) || barazaRecords[0];
};

const renderLeaderDashboard = (record) => {
  const profileView = document.querySelector(".baraza-profile-view");
  const selector = document.querySelector("[data-local-baraza]");
  if (!profileView || !selector) {
    console.error("The local Baraza planner profile controls are missing.");
    return false;
  }

  document.body.classList.add("is-baraza-leader");
  profileView.hidden = false;
  profileView.dataset.theme = record.ribbon?.toLowerCase().replaceAll(" ", "-") || "default";
  profileView.querySelector(".view-back-button").hidden = true;
  profileView.querySelector(".view-heading .eyebrow").textContent = "Local Baraza planner";
  const welcome = profileView.querySelector("[data-leader-welcome]");
  welcome.textContent = "This planner is not protected by sign-in.";
  welcome.hidden = false;

  const options = barazaRecords.map(({ id, happiness }) => {
    const option = document.createElement("option");
    option.value = String(id);
    option.textContent = happiness;
    option.selected = id === record.id;
    return option;
  });
  selector.replaceChildren(...options);

  const updateProfile = (selectedRecord) => {
    profileView.dataset.theme = selectedRecord.ribbon?.toLowerCase().replaceAll(" ", "-") || "default";
    profileView.querySelector("#profile-title").textContent = selectedRecord.happiness;
    profileView.querySelector("#profile-language").textContent = selectedRecord.language;
    profileView.querySelector("#profile-level").textContent = selectedRecord.level;
    profileView.querySelector("#profile-head").textContent = selectedRecord.head;
    [selectedRecord.coLeaders[0], selectedRecord.coLeaders[1]].forEach((name, index) => {
      const leader = profileView.querySelector(`#profile-co-${index === 0 ? "one" : "two"}`);
      leader.textContent = name || "";
      leader.parentElement.hidden = !name;
    });
  };

  updateProfile(record);
  selector.addEventListener("change", () => {
    const selectedRecord = barazaRecords.find(({ id }) => id === Number(selector.value));
    if (!selectedRecord) {
      console.error("The selected local Baraza profile does not exist.");
      return;
    }
    updateProfile(selectedRecord);
    try {
      window.localStorage.setItem(selectedBarazaKey, String(selectedRecord.id));
    } catch (error) {
      console.error("Unable to remember the selected local Baraza.", error);
    }
    document.dispatchEvent(new CustomEvent("localBarazaChanged", { detail: { record: selectedRecord } }));
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
  if (!renderLeaderDashboard(record)) return;
  initializeDiscussionPlanner(record);

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
