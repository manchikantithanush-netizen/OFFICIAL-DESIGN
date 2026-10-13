const signInForm = document.querySelector("#signin-form");

if (signInForm) {
  const nameInput = document.querySelector("#student-name");
  const grInput = document.querySelector("#gr-number");
  const gradeModal = document.querySelector(".grade-modal");
  const gradeOptions = document.querySelectorAll("[data-grade-group]");
  const gradeContinueButton = document.querySelector(".grade-continue-button");
  const gradeStatus = document.querySelector(".grade-status");
  let selectedGradeGroup = null;

  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, "");
  });

  grInput.addEventListener("input", () => {
    grInput.value = grInput.value.replace(/\D/g, "").slice(0, 5);
  });

  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const status = document.querySelector(".form-status");
    const fields = [
      {
        input: nameInput,
        message: "Please enter your full name using letters only.",
        isValid: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(nameInput.value.trim()),
      },
      {
        input: grInput,
        message: "Please enter a GR number with up to 5 digits.",
        isValid: /^[0-9]{1,5}$/.test(grInput.value.trim()),
      },
    ];
    let hasError = false;

    fields.forEach(({ input, message, isValid }) => {
      const error = document.querySelector(`[data-error-for="${input.id}"]`);
      error.textContent = "";
      input.removeAttribute("aria-invalid");

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

    status.textContent = "";
    if (nameInput.value.trim() === "adminihs" && grInput.value.trim() === "20260") {
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
