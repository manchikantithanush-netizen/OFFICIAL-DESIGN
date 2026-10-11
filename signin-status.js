const verificationStatus = document.querySelector(".verification-status");
const statusCard = document.querySelector(".status-card");
const statusTitle = document.querySelector(".status-title");
const statusCopy = document.querySelector(".status-copy");

if (verificationStatus && statusCard) {
  document.querySelector("#signin-form")?.addEventListener("signInDetailsReady", () => {
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
    }, 3000);
  });
}
