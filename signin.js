import { barazaRecords } from "./baraza-data.js";

const signInForm = document.querySelector("#signin-form");

if (signInForm) {
  const nameInput = document.querySelector("#student-name");
  const grInput = document.querySelector("#gr-number");
  const grLabel = document.querySelector('label[for="gr-number"]');
  const grInputWrap = grInput.closest(".input-with-action");
  const grError = document.querySelector('[data-error-for="gr-number"]');
  const gradeModal = document.querySelector(".grade-modal");
  const gradeOptions = document.querySelectorAll("[data-grade-group]");
  const gradeContinueButton = document.querySelector(".grade-continue-button");
  const gradeStatus = document.querySelector(".grade-status");
  const status = document.querySelector(".form-status");
  const submitButton = signInForm.querySelector(".submit-button");
  const passwordToggle = document.querySelector(".password-toggle");
  let selectedGradeGroup = null;

  const updateBarazaSignInFields = () => {
    const isBarazaLeader = nameInput.value.trim().toLocaleLowerCase("en") === "rsbaraza";
    grLabel.firstChild.textContent = isBarazaLeader ? "BARAZA ACCESS CODE " : "GR NUMBER ";
    grInputWrap.hidden = false;
    grInput.setAttribute("aria-label", isBarazaLeader ? "Baraza access code" : "GR number");
    passwordToggle?.setAttribute("aria-label", `Show ${isBarazaLeader ? "Baraza access code" : "GR number"}`);
    signInForm.querySelector(".submit-button").innerHTML = isBarazaLeader
      ? 'Enter Baraza dashboard <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>'
      : 'Continue to event <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
  };

  updateBarazaSignInFields();

  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.replace(/[^\p{L}\p{M}' -]/gu, "").replace(/ {2,}/g, " ");
    updateBarazaSignInFields();
  });

  grInput.addEventListener("input", () => {
    grInput.value = grInput.value.replace(/\D/g, "").slice(0, 5);
  });

  passwordToggle?.addEventListener("click", () => {
    const showValue = grInput.type === "password";
    grInput.type = showValue ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(showValue));
    passwordToggle.setAttribute(
      "aria-label",
      `${showValue ? "Hide" : "Show"} ${grInput.getAttribute("aria-label") || "GR number"}`,
    );
    passwordToggle.innerHTML = `<i class="fa-regular fa-eye${showValue ? "-slash" : ""}" aria-hidden="true"></i>`;
  });

  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullName = nameInput.value.normalize("NFKC").trim().replace(/\s+/g, " ");
    const grNumber = grInput.value.trim();
    const isBarazaLeader = fullName.toLocaleLowerCase("en") === "rsbaraza";
    const nameError = document.querySelector('[data-error-for="student-name"]');
    const grError = document.querySelector('[data-error-for="gr-number"]');

    [nameInput, grInput].forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
    nameError.textContent = "";
    grError.textContent = "";
    status.textContent = "";

    if (isBarazaLeader) {
      const matchedRecord = barazaRecords.find(({ accessCode }) => accessCode === grNumber);
      if (!matchedRecord) {
        grError.textContent = "That access code is not recognized. Check it and try again.";
        grInput.setAttribute("aria-invalid", "true");
        status.textContent = "Enter the 5-digit access code assigned to your Baraza.";
        return;
      }

      try {
        window.sessionStorage.setItem("roundsquare-local-planner-baraza", String(matchedRecord.id));
      } catch (error) {
        console.error("Unable to store the selected Baraza for this session.", error);
        status.textContent = "This browser couldn't open the Baraza dashboard. Check its storage settings.";
        return;
      }
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      signInForm.dispatchEvent(new CustomEvent("barazaLocalPlannerOpening", {
        detail: { barazaId: matchedRecord.id, happiness: matchedRecord.happiness },
      }));
      signInForm.dispatchEvent(new CustomEvent("barazaLocalPlannerReady", {
        detail: { barazaId: matchedRecord.id },
      }));
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      return;
    }

    const nameIsValid = fullName.length <= 80
      && /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(fullName);
    const fields = [
      {
        input: nameInput,
        error: nameError,
        message: "Please enter your full name using letters, spaces, apostrophes or hyphens.",
        isValid: nameIsValid,
      },
      {
        input: grInput,
        error: grError,
        message: "Please enter a GR number with up to 5 digits.",
        isValid: /^[0-9]{1,5}$/.test(grNumber),
      },
    ];
    let hasError = false;

    fields.forEach(({ input, error, message, isValid }) => {
      if (!input.value.trim() || !isValid) {
        error.textContent = message;
        input.setAttribute("aria-invalid", "true");
        hasError = true;
      }
    });

    if (hasError) {
      status.textContent = "Complete the required fields to continue.";
      return;
    }

    if (fullName === "adminihs" && grNumber === "20260") {
      signInForm.dispatchEvent(new CustomEvent("signInDetailsReady"));
      return;
    }
    gradeModal?.classList.add("is-open");
    gradeModal?.setAttribute("aria-hidden", "false");
  });

  gradeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedGradeGroup = option.dataset.gradeGroup;
      gradeOptions.forEach((gradeOption) => {
        const isSelected = gradeOption === option;
        gradeOption.classList.toggle("is-selected", isSelected);
        gradeOption.setAttribute("aria-pressed", String(isSelected));
      });
      if (gradeContinueButton) gradeContinueButton.disabled = false;
      if (gradeStatus) gradeStatus.textContent = "";
    });
  });

  gradeContinueButton?.addEventListener("click", () => {
    if (!selectedGradeGroup) {
      if (gradeStatus) gradeStatus.textContent = "Choose your grade group to continue.";
      return;
    }
    window.localStorage.setItem("roundsquare-grade-group", selectedGradeGroup);
    gradeModal?.classList.remove("is-open");
    gradeModal?.setAttribute("aria-hidden", "true");
    signInForm.dispatchEvent(new CustomEvent("signInDetailsReady"));
  });
}
