const loadingScreen = document.querySelector(".loading-screen");

if (loadingScreen) {
  window.setTimeout(() => {
    loadingScreen.remove();
  }, 2800);
}
