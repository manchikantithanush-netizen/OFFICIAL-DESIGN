import { supabase } from "./supabase-client.js";

const eventKey = "roundsquare-over";
const farewell = document.querySelector("[data-global-farewell]");
const fireworksCanvas = document.querySelector("[data-farewell-fireworks]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let celebrationStarted = false;
let animationFrame;
let resizeListener;
let dismissTimeout;

const drawFireworks = () => {
  if (!fireworksCanvas || reducedMotion) return;

  const context = fireworksCanvas.getContext("2d");
  if (!context) {
    console.error("Unable to initialize global farewell fireworks.");
    return;
  }

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    fireworksCanvas.width = Math.round(window.innerWidth * pixelRatio);
    fireworksCanvas.height = Math.round(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };
  const colors = ["#eaf6ff", "#8bcaff", "#65a9ff", "#d0aaff", "#ffd98a"];
  const particles = [];
  const startedAt = performance.now();
  let lastBurst = -Infinity;

  const burst = () => {
    const originX = window.innerWidth * (0.15 + Math.random() * 0.7);
    const originY = window.innerHeight * (0.12 + Math.random() * 0.4);
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let index = 0; index < 44; index += 1) {
      const angle = (Math.PI * 2 * index) / 44;
      const speed = 1.2 + Math.random() * 3.2;
      particles.push({
        x: originX,
        y: originY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 1.2 + Math.random() * 1.8,
      });
    }
  };

  const animate = (now) => {
    const elapsed = now - startedAt;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (elapsed < 7800 && now - lastBurst > 620) {
      burst();
      lastBurst = now;
    }
    particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.018;
      particle.alpha -= 0.009;
      context.globalAlpha = Math.max(0, particle.alpha);
      context.fillStyle = particle.color;
      context.shadowBlur = 12;
      context.shadowColor = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
    context.shadowBlur = 0;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      if (particles[index].alpha <= 0) particles.splice(index, 1);
    }
    if (elapsed < 7800 || particles.length) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      animationFrame = undefined;
    }
  };

  resizeCanvas();
  resizeListener = resizeCanvas;
  window.addEventListener("resize", resizeListener);
  animationFrame = window.requestAnimationFrame(animate);
};

const stopFarewell = () => {
  celebrationStarted = false;
  if (!farewell || farewell.hidden) return;
  document.body.classList.remove("is-global-farewell");
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
  }
  if (resizeListener) {
    window.removeEventListener("resize", resizeListener);
    resizeListener = undefined;
  }
  farewell.classList.remove("is-visible");
  farewell.classList.add("is-dismissing");
  farewell.setAttribute("aria-hidden", "true");
  window.clearTimeout(dismissTimeout);
  dismissTimeout = window.setTimeout(() => {
    farewell.hidden = true;
    farewell.classList.remove("is-dismissing");
    dismissTimeout = undefined;
  }, 500);
};

const showFarewell = () => {
  if (celebrationStarted || !farewell) return;
  celebrationStarted = true;
  window.clearTimeout(dismissTimeout);
  dismissTimeout = undefined;
  document.body.classList.add("is-global-farewell");
  farewell.hidden = false;
  farewell.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    farewell.classList.add("is-visible");
    drawFireworks();
  });
};

const loadCelebrationState = async () => {
  const { data, error } = await supabase
    .from("global_celebration")
    .select("activated_at, stopped_at")
    .eq("event_key", eventKey)
    .maybeSingle();
  if (error) {
    console.error("Unable to load the global farewell status.", error);
    return;
  }
  if (data?.stopped_at) {
    stopFarewell();
  } else if (data?.activated_at) {
    showFarewell();
  }
};

supabase
  .channel("dashboard-global-celebration")
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "global_celebration" }, (payload) => {
    if (payload.new.event_key !== eventKey) return;
    if (payload.new.stopped_at) {
      stopFarewell();
    } else if (payload.new.activated_at) {
      showFarewell();
    }
  })
  .subscribe((status, error) => {
    if (status === "SUBSCRIBED") void loadCelebrationState();
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error("Global farewell updates are unavailable.", error);
    }
  });

window.addEventListener("pagehide", () => {
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  if (resizeListener) window.removeEventListener("resize", resizeListener);
  window.clearTimeout(dismissTimeout);
});
