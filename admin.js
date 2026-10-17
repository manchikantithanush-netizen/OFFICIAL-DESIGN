import { supabase } from "./supabase-client.js";

const adminSessionKey = "roundsquare-admin-authorized";

if (window.sessionStorage.getItem(adminSessionKey) !== "true") {
  window.location.replace("signin.html");
}

const messageForm = document.querySelector(".admin-message-form");
const formStatus = document.querySelector(".form-status");
const signOutButton = document.querySelector(".sign-out");
const messageList = document.querySelector(".admin-message-list");
const clearMessagesButton = document.querySelector(".clear-messages");
const farewellLaunchButton = document.querySelector(".farewell-launch");
const farewellStopButton = document.querySelector(".farewell-stop");
const farewellRestartButton = document.querySelector(".farewell-restart");
const farewellStatus = document.querySelector(".farewell-status");
const farewellEventKey = "roundsquare-over";

const getFarewellState = async () => {
  const { data, error } = await supabase
    .from("global_celebration")
    .select("activated_at, stopped_at")
    .eq("event_key", farewellEventKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The global celebration row is missing. Run the Supabase setup SQL.");
  return data;
};

const renderFarewellStatus = async () => {
  if (!farewellLaunchButton || !farewellStatus) return;
  farewellLaunchButton.disabled = true;
  farewellStopButton.disabled = true;
  farewellRestartButton.disabled = true;
  try {
    const { activated_at: activatedAt, stopped_at: stoppedAt } = await getFarewellState();
    if (stoppedAt) {
      farewellLaunchButton.textContent = "CELEBRATION PAUSED";
      farewellStopButton.hidden = true;
      farewellRestartButton.hidden = false;
      farewellRestartButton.disabled = false;
      farewellStatus.textContent = "The celebration is paused on every dashboard. Start it again whenever you are ready.";
      return;
    }
    if (activatedAt) {
      farewellLaunchButton.textContent = "ALREADY LAUNCHED";
      farewellStatus.textContent = `The global farewell was launched ${new Date(activatedAt).toLocaleString()}.`;
      farewellStopButton.textContent = "STOP CELEBRATION EVERYWHERE";
      farewellStopButton.hidden = false;
      farewellStopButton.disabled = false;
      farewellRestartButton.hidden = true;
      return;
    }
    farewellLaunchButton.textContent = "LAUNCH THE FAREWELL";
    farewellStatus.textContent = "Not launched. Dashboards will remain unchanged until you confirm.";
    farewellLaunchButton.disabled = false;
    farewellStopButton.hidden = true;
    farewellRestartButton.hidden = true;
  } catch (error) {
    farewellLaunchButton.textContent = "ANNOUNCEMENT UNAVAILABLE";
    farewellStopButton.hidden = true;
    farewellRestartButton.hidden = true;
    farewellStatus.textContent = "Run the Supabase setup SQL before this announcement can be launched.";
    console.error("Unable to load the global celebration status.", error);
  }
};

const getMessages = async () => {
  const { data, error } = await supabase
    .from("admin_messages")
    .select("id, title, message, content, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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

farewellLaunchButton?.addEventListener("click", async () => {
  if (!window.confirm("Launch the Roundsquare farewell on every dashboard?")) return;

  farewellLaunchButton.disabled = true;
  farewellStatus.textContent = "Launching the global farewell…";
  const { data, error } = await supabase
    .from("global_celebration")
    .update({ activated_at: new Date().toISOString() })
    .eq("event_key", farewellEventKey)
    .is("activated_at", null)
    .is("stopped_at", null)
    .select("activated_at")
    .maybeSingle();

  if (error) {
    farewellStatus.textContent = "The farewell could not be launched. Check the Supabase setup and try again.";
    console.error("Unable to launch the global celebration.", error);
    await renderFarewellStatus();
    return;
  }
  if (!data) {
    await renderFarewellStatus();
    return;
  }

  farewellLaunchButton.textContent = "ALREADY LAUNCHED";
  farewellStatus.textContent = "The farewell is now live on dashboards and will appear for students who sign in later.";
});

farewellStopButton?.addEventListener("click", async () => {
  if (!window.confirm("Pause the celebration on every dashboard? You can start it again later.")) return;

  farewellStopButton.disabled = true;
  farewellLaunchButton.disabled = true;
  farewellStatus.textContent = "Pausing the celebration everywhere…";
  const { data, error } = await supabase
    .from("global_celebration")
    .update({ stopped_at: new Date().toISOString() })
    .eq("event_key", farewellEventKey)
    .not("activated_at", "is", null)
    .is("stopped_at", null)
    .select("stopped_at")
    .maybeSingle();

  if (error) {
    farewellStatus.textContent = "The celebration could not be paused. Check the Supabase setup and try again.";
    console.error("Unable to pause the global celebration.", error);
    await renderFarewellStatus();
    return;
  }
  if (!data) {
    await renderFarewellStatus();
    return;
  }

  await renderFarewellStatus();
});

farewellRestartButton?.addEventListener("click", async () => {
  if (!window.confirm("Start the Roundsquare celebration again on every dashboard?")) return;

  farewellRestartButton.disabled = true;
  farewellStatus.textContent = "Starting the celebration everywhere…";
  const { data, error } = await supabase
    .from("global_celebration")
    .update({ activated_at: new Date().toISOString(), stopped_at: null })
    .eq("event_key", farewellEventKey)
    .not("activated_at", "is", null)
    .not("stopped_at", "is", null)
    .select("activated_at, stopped_at")
    .maybeSingle();

  if (error) {
    farewellStatus.textContent = "The celebration could not be restarted. Check the Supabase update policy and try again.";
    console.error("Unable to restart the global celebration.", error);
    await renderFarewellStatus();
    return;
  }
  if (!data) {
    await renderFarewellStatus();
    return;
  }

  farewellLaunchButton.textContent = "ALREADY LAUNCHED";
  farewellRestartButton.hidden = true;
  farewellStopButton.textContent = "STOP CELEBRATION EVERYWHERE";
  farewellStopButton.hidden = false;
  farewellStopButton.disabled = false;
  farewellStatus.textContent = "The celebration has started again on dashboards.";
});

renderMessages();
renderFarewellStatus();

supabase
  .channel("admin-message-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages" }, () => renderMessages())
  .subscribe();

supabase
  .channel("admin-global-celebration-changes")
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "global_celebration" }, () => renderFarewellStatus())
  .subscribe();

signOutButton?.addEventListener("click", () => {
  window.sessionStorage.removeItem(adminSessionKey);
  window.location.replace("index.html");
});
