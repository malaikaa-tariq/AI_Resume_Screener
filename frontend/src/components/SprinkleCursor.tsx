"use client";
import { useEffect } from "react";
const symbols = ["✎", "▤", "✦", "⌁", "📎", "✏", "📄"];

export default function SprinkleCursor() {
  useEffect(() => {
    if (
      !window.matchMedia("(pointer: fine) and (hover: hover)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    let lastCreated = 0;
    function createSprinkle(x: number, y: number, burst = false) {
      const sprinkle = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = burst ? 20 + Math.random() * 38 : 8 + Math.random() * 14;
      sprinkle.className = "cursor-sprinkle";
      sprinkle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      sprinkle.style.left = `${x}px`;
      sprinkle.style.top = `${y}px`;
      sprinkle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      sprinkle.style.setProperty("--dy", `${Math.sin(angle) * distance - 9}px`);
      sprinkle.style.setProperty("--rotation", `${Math.random() * 160 - 80}deg`);
      document.body.appendChild(sprinkle);
      window.setTimeout(() => sprinkle.remove(), 720);
    }
    function move(event: PointerEvent) {
      const now = performance.now();
      if (now - lastCreated < 85) return;
      lastCreated = now;
      createSprinkle(event.clientX, event.clientY);
    }
    function click(event: PointerEvent) {
      for (let i = 0; i < 7; i += 1) createSprinkle(event.clientX, event.clientY, true);
    }
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
    };
  }, []);
  return null;
}
