"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Native <dialog> (focus trap, Esc, inert background) with a motion entrance.
 * Children are rendered only while open.
 */
export function Modal({
  open,
  onClose,
  label,
  closeLabel,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  children: React.ReactNode;
  /** md: text, lg: a single large image, xl: a near full-screen viewer with a fixed height. */
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence>
        {open && (
          <div className="pointer-events-none grid min-h-full place-items-center p-3 sm:p-6">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-rule bg-paper shadow-2xl ${
                size === "xl"
                  ? "h-[calc(100dvh-1.5rem)] max-w-[1440px] sm:h-[min(calc(100dvh-3rem),980px)]"
                  : `${size === "lg" ? "max-w-5xl" : "max-w-3xl"} max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:max-h-[calc(100dvh-3rem)]`
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-rule bg-paper/80 backdrop-blur transition-colors hover:border-ink"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
