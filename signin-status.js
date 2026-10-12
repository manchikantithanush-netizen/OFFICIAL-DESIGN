const verificationStatus = document.querySelector(".verification-status");
const statusCard = document.querySelector(".status-card");
const statusTitle = document.querySelector(".status-title");
const statusCopy = document.querySelector(".status-copy");
const currentStudentNameKey = "roundsquare-current-student-name";
const registrationKey = "roundsquare-student-registered";

if (verificationStatus && statusCard) {
  document.querySelector("#signin-form")?.addEventListener("signInDetailsReady", () => {
    const nameInput = document.querySelector("#student-name");
    const grInput = document.querySelector("#gr-number");
    const name = nameInput?.value.trim() || "";
    const grNumber = grInput?.value.trim() || "";

    if (name === "adminihs" && grNumber === "20260") {
      window.sessionStorage.setItem("roundsquare-admin-authorized", "true");
      window.location.href = "admin.html";
      return;
    }

    window.localStorage.setItem(currentStudentNameKey, name);
    window.localStorage.setItem(registrationKey, "true");

    verificationStatus.classList.add("is-visible");
    verificationStatus.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-verifying");

    window.setTimeout(() => {
      statusCard.classList.add("is-verified");
      statusTitle.textContent = "Details verified";
      statusCopy.textContent = "Your event access is ready.";

      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    }, 1000);
  });
}
