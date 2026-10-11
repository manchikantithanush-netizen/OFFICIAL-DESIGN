const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const numberValues = document.querySelectorAll("[data-count]");
const animateNumbers = (element) => {
  const target = Number(element.dataset.count);
  const duration = 1400;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
};

if (numberValues.length) {
  const numbersSection = document.querySelector(".numbers-section");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    numberValues.forEach((element) => { element.textContent = element.dataset.count; });
  } else if (numbersSection && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      numberValues.forEach(animateNumbers);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(numbersSection);
  } else {
    numberValues.forEach(animateNumbers);
  }
}
