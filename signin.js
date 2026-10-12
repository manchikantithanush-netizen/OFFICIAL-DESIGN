const signInForm = document.querySelector("#signin-form");

if (signInForm) {
  const nameInput = document.querySelector("#student-name");
  const grInput = document.querySelector("#gr-number");

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
    signInForm.dispatchEvent(new CustomEvent("signInDetailsReady"));
  });
}
