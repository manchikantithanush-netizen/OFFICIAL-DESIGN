const countdownUnits = document.querySelectorAll("[data-countdown-unit]");
const eventStart = new Date(2026, 9, 17, 9, 0, 0);
const eventEnd = new Date(2026, 9, 17, 17, 30, 0);

const updateCountdown = () => {
  const now = Date.now();
  const remaining = eventStart.getTime() - now;
  const countdownTitle = document.querySelector("#countdown-title");
  const countdownNote = document.querySelector(".countdown-note");

  if (remaining <= 0) {
    countdownUnits.forEach((unit) => {
      unit.textContent = "00";
    });
    if (countdownTitle) countdownTitle.textContent = now < eventEnd.getTime() ? "We are live." : "What a day.";
    if (countdownNote) countdownNote.textContent = now < eventEnd.getTime()
      ? "The event is happening now at The Indian High School."
      : "Thank you for being part of Round Square IHS.";
    return false;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
  countdownUnits.forEach((unit) => {
    unit.textContent = String(values[unit.dataset.countdownUnit]).padStart(2, "0");
  });
  return true;
};

if (countdownUnits.length) {
  updateCountdown();
  const countdownTimer = window.setInterval(() => {
    if (!updateCountdown()) window.clearInterval(countdownTimer);
  }, 1000);
}
