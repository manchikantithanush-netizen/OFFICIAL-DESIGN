import { supabase } from "./supabase-client.js";
import { barazaRecords } from "./baraza-data.js";

const adminSessionKey = "roundsquare-admin-authorized";

if (window.sessionStorage.getItem(adminSessionKey) !== "true") {
  window.location.replace("signin.html");
}

const messageForm = document.querySelector(".admin-message-form");
const formStatus = document.querySelector(".form-status");
const signOutButton = document.querySelector(".sign-out");
const messageList = document.querySelector(".admin-message-list");
const clearMessagesButton = document.querySelector(".clear-messages");
const adminBarazaList = document.querySelector(".admin-baraza-list");
const scheduleProgressList = document.querySelector(".schedule-progress-list");
const scheduleProgressStatus = document.querySelector(".schedule-progress-status");
const scheduleItems = {
  junior: ["Registration", "Opening Ceremony", "Scavenger Hunt", "Baraza Session 1", "Lunch", "Keynote Speaker", "Creative Expression Session", "Photo Sessions", "Baraza Session 2", "Team Dance", "Dispersal"],
  intermediate: ["Registration", "Opening Ceremony", "Baraza Session 1", "Lunch", "Keynote Speaker", "Creative Expression Session", "Photo Session", "Baraza Session 2", "Team Dance & Closing Ceremony", "Dispersal"],
};

const getMessages = async () => {
  const { data, error } = await supabase
    .from("admin_messages")
    .select("id, title, message, content, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

if (adminBarazaList) {
  adminBarazaList.replaceChildren(...barazaRecords.map((record) => {
    const item = document.createElement("article");
    item.className = "admin-baraza-item";
    item.innerHTML = `<strong>${record.happiness}</strong><span>${record.language} · ${record.level}</span><small>${record.ribbon} ribbon</small>`;
    return item;
  }));
}

const getScheduleProgress = async () => {
  const { data, error } = await supabase.from("schedule_progress").select("schedule_name, item_key, completed");
  if (error) throw error;
  return data || [];
};

const renderScheduleProgress = async () => {
  if (!scheduleProgressList) return;
  try {
    const progress = await getScheduleProgress();
    const completed = new Set(progress.filter((item) => item.completed).map((item) => `${item.schedule_name}:${item.item_key}`));
    scheduleProgressList.replaceChildren(...Object.entries(scheduleItems).flatMap(([schedule, items]) => {
      const heading = document.createElement("h4");
      heading.textContent = schedule === "junior" ? "Junior" : "Intermediate & Senior";
      return [heading, ...items.map((title) => {
        const itemKey = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const label = document.createElement("label");
        label.className = "schedule-progress-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed.has(`${schedule}:${itemKey}`);
        checkbox.addEventListener("change", async () => {
          checkbox.disabled = true;
          const { error } = await supabase.from("schedule_progress").upsert({
            schedule_name: schedule,
            item_key: itemKey,
            completed: checkbox.checked,
            updated_at: new Date().toISOString(),
          });
          checkbox.disabled = false;
          if (error) {
            checkbox.checked = !checkbox.checked;
            scheduleProgressStatus.textContent = "Schedule progress could not be saved. Run the Supabase setup SQL first.";
            console.error("Unable to update schedule progress.", error);
            return;
          }
          scheduleProgressStatus.textContent = `${title} marked ${checkbox.checked ? "finished" : "unfinished"}.`;
        });
        const text = document.createElement("span");
        text.textContent = title;
        label.append(checkbox, text);
        return label;
      })];
    }));
  } catch (error) {
    scheduleProgressList.innerHTML = '<p class="admin-message-empty">Schedule progress could not be loaded. Run the Supabase setup SQL first.</p>';
    console.error("Unable to load schedule progress.", error);
  }
};

const renderMessages = async () => {
  if (!messageList) return;
  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    messageList.innerHTML = '<p class="admin-message-empty">Messages could not be loaded. Run the Supabase setup SQL first.</p>';
    console.error("Unable to load admin messages.", error);
    return;
  }
  if (!messages.length) {
    messageList.innerHTML = '<p class="admin-message-empty">No messages sent yet.</p>';
    return;
  }
  messageList.replaceChildren(...messages.map((item) => {
    const card = document.createElement("article");
    card.className = "admin-message-item";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const message = document.createElement("p");
    message.textContent = item.message || item.content;
    const time = document.createElement("time");
    time.textContent = new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    content.append(title, message, time);
    const removeButton = document.createElement("button");
    removeButton.className = "remove-message";
    removeButton.type = "button";
    removeButton.textContent = "REMOVE";
    removeButton.addEventListener("click", async () => {
      const { error } = await supabase.from("admin_messages").delete().eq("id", item.id);
      if (error) {
        formStatus.textContent = "The message could not be removed.";
        console.error("Unable to remove admin message.", error);
        return;
      }
      renderMessages();
    });
    card.append(content, removeButton);
    return card;
  }));
};

messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(messageForm);
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!title || !message) return;

  const { error } = await supabase.from("admin_messages").insert({ title, message, content: message });
  if (error) {
    formStatus.textContent = "The message could not be sent. Run the Supabase setup SQL first.";
    console.error("Unable to send admin message.", error);
    return;
  }
  messageForm.reset();
  formStatus.textContent = "Message sent to student dashboards.";
  renderMessages();
  renderScheduleProgress();
});

clearMessagesButton?.addEventListener("click", async () => {
  const { error } = await supabase.from("admin_messages").delete().not("id", "is", null);
  if (error) {
    formStatus.textContent = "Messages could not be removed.";
    console.error("Unable to remove admin messages.", error);
    return;
  }
  renderMessages();
  formStatus.textContent = "All messages were removed from student dashboards.";
});

renderMessages();

supabase
  .channel("admin-message-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages" }, () => renderMessages())
  .on("postgres_changes", { event: "*", schema: "public", table: "schedule_progress" }, () => renderScheduleProgress())
  .subscribe();

signOutButton?.addEventListener("click", () => {
  window.sessionStorage.removeItem(adminSessionKey);
  window.location.replace("index.html");
});
