const backgroundVideo = document.querySelector(".background-video");

const backgroundVideos = [
  "Videos/C6164.MP4",
  "Videos/C6159.MP4",
  "Videos/C6161.MP4",
];

const visibleDuration = 7000;
const pauseDuration = 3000;
let currentVideoIndex = 0;
let visibleTimer;
let pauseTimer;

const shouldDisableVideo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clearVideoTimers = () => {
  window.clearTimeout(visibleTimer);
  window.clearTimeout(pauseTimer);
};

const playNextVideo = () => {
  if (!backgroundVideo || shouldDisableVideo) return;

  clearVideoTimers();
  backgroundVideo.classList.remove("is-visible");
  backgroundVideo.pause();
  backgroundVideo.src = backgroundVideos[currentVideoIndex];
  backgroundVideo.load();

  const playVideo = () => {
    backgroundVideo.currentTime = 0;
    backgroundVideo.play().catch(() => {});
    requestAnimationFrame(() => backgroundVideo.classList.add("is-visible"));

    visibleTimer = window.setTimeout(() => {
      backgroundVideo.classList.remove("is-visible");
      backgroundVideo.pause();
      pauseTimer = window.setTimeout(() => {
        currentVideoIndex = (currentVideoIndex + 1) % backgroundVideos.length;
        playNextVideo();
      }, pauseDuration);
    }, visibleDuration);
  };

  backgroundVideo.addEventListener("canplay", playVideo, { once: true });
};

if (backgroundVideo && !shouldDisableVideo) {
  playNextVideo();
}
