const signInForm = document.querySelector("#signin-form");

if (signInForm) {
  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = document.querySelector("#student-name");
    const grInput = document.querySelector("#gr-number");
    const status = document.querySelector(".form-status");
    const fields = [
      { input: nameInput, message: "Please enter your full name." },
      { input: grInput, message: "Please enter your GR number." },
    ];
    let hasError = false;

    fields.forEach(({ input, message }) => {
      const error = document.querySelector(`[data-error-for="${input.id}"]`);
      error.textContent = "";
      input.removeAttribute("aria-invalid");

      if (!input.value.trim()) {
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
