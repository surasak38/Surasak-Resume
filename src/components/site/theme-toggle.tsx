"use client";

import { useRef } from "react";

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

export function ThemeToggle({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
    };

    const doc = document as DocWithVT;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce || !ref.current) return apply();

    const r = ref.current.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    doc.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark"
      className={`group grid size-9 place-items-center rounded-full border border-rule transition-colors hover:border-ink ${className}`}
    >
      <svg viewBox="0 0 20 20" className="size-4 transition-transform duration-500 ease-out-quint group-hover:rotate-180" aria-hidden>
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2a8 8 0 0 1 0 16Z" fill="currentColor" />
      </svg>
    </button>
  );
}
