const verificationStatus = document.querySelector(".verification-status");
const statusCard = document.querySelector(".status-card");
const statusTitle = document.querySelector(".status-title");
const statusCopy = document.querySelector(".status-copy");
const currentStudentNameKey = "roundsquare-current-student-name";
const registrationKey = "roundsquare-student-registered";

if (verificationStatus && statusCard) {
  const resetVerification = () => {
    verificationStatus.classList.remove("is-visible");
    verificationStatus.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-verifying");
    statusCard.classList.remove("is-verified");
    statusTitle.textContent = "Verifying your details";
  };

  document.querySelector("#signin-form")?.addEventListener("barazaLocalPlannerOpening", () => {
    statusCard.classList.remove("is-verified");
    statusTitle.textContent = "Opening local planner";
    statusCopy.textContent = "This planner has no secure sign-in and saves only in this browser.";
    verificationStatus.classList.add("is-visible");
    verificationStatus.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-verifying");
  });

  const showVerification = (
    destination,
    copy,
    completedTitle = "Details verified",
    completedCopy = "Your event access is ready.",
    openingTitle = "Verifying your details",
  ) => {
    statusCard.classList.remove("is-verified");
    statusTitle.textContent = openingTitle;
    statusCopy.textContent = copy;
    verificationStatus.classList.add("is-visible");
    verificationStatus.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-verifying");

    window.setTimeout(() => {
      statusCard.classList.add("is-verified");
      statusTitle.textContent = completedTitle;
      statusCopy.textContent = completedCopy;

      window.setTimeout(() => {
        window.location.href = destination;
      }, 900);
    }, 1000);
  };

  document.querySelector("#signin-form")?.addEventListener("barazaLocalPlannerReady", () => {
    showVerification(
      "dashboard.html?view=baraza-leader",
      "Opening the local-only Baraza planner.",
      "Local planner ready",
      "Anyone can access this planner on this device. Plans are not synced.",
      "Opening local planner",
    );
  });

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

    const gradeGroup = window.localStorage.getItem("roundsquare-grade-group");
    if (!gradeGroup) return;
    window.localStorage.setItem(currentStudentNameKey, name);
    window.localStorage.setItem(registrationKey, "true");

    showVerification("dashboard.html", "Please wait while we prepare your event access.");
  });
}
