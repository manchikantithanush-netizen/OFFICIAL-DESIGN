const adminSessionKey = "roundsquare-admin-authorized";
const adminMessagesKey = "roundsquare-admin-messages";

if (window.sessionStorage.getItem(adminSessionKey) !== "true") {
  window.location.replace("signin.html");
}

const messageForm = document.querySelector(".admin-message-form");
const formStatus = document.querySelector(".form-status");
const signOutButton = document.querySelector(".sign-out");
const messageList = document.querySelector(".admin-message-list");
const clearMessagesButton = document.querySelector(".clear-messages");

const getMessages = () => JSON.parse(window.localStorage.getItem(adminMessagesKey) || "[]");
const saveMessages = (messages) => window.localStorage.setItem(adminMessagesKey, JSON.stringify(messages));

const renderMessages = () => {
  const messages = getMessages();
  if (!messageList) return;
  if (!messages.length) {
    messageList.innerHTML = '<p class="admin-message-empty">No messages sent yet.</p>';
    return;
  }
  messageList.replaceChildren(...messages.slice().reverse().map((item) => {
    const card = document.createElement("article");
    card.className = "admin-message-item";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const message = document.createElement("p");
    message.textContent = item.message;
    const time = document.createElement("time");
    time.textContent = new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    content.append(title, message, time);
    const removeButton = document.createElement("button");
    removeButton.className = "remove-message";
    removeButton.type = "button";
    removeButton.textContent = "REMOVE";
    removeButton.addEventListener("click", () => {
      saveMessages(getMessages().filter((messageItem) => messageItem.id !== item.id));
      renderMessages();
    });
    card.append(content, removeButton);
    return card;
  }));
};

messageForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(messageForm);
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!title || !message) return;

  const messages = getMessages();
  messages.push({ id: crypto.randomUUID(), title, message, timestamp: Date.now() });
  saveMessages(messages.slice(-20));
  messageForm.reset();
  formStatus.textContent = "Message sent to student dashboards.";
  renderMessages();
});

clearMessagesButton?.addEventListener("click", () => {
  if (!getMessages().length) return;
  saveMessages([]);
  renderMessages();
  formStatus.textContent = "All messages were removed from student dashboards.";
});

renderMessages();

signOutButton?.addEventListener("click", () => {
  window.sessionStorage.removeItem(adminSessionKey);
  window.location.replace("index.html");
});
