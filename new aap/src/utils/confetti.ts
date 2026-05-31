"use client";

import confetti from "canvas-confetti";

export function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981"],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#a855f7", "#ec4899", "#fbbf24"],
  });

  frame();
}
