"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Link, Profile } from "@/lib/schema";

const ease = [0.22, 1, 0.36, 1] as const;

function Line({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        className={`block ${className ?? ""}`}
        initial={reduce ? false : { y: "105%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.1, ease, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero({ profile, links }: { profile: Profile; links: Link[] }) {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.9, ease, delay } };

  return (
    <section className="flex min-h-[88svh] flex-col justify-end pb-10 pt-28 md:pb-14">
      <h1
        className="font-display font-bold leading-[0.84] tracking-[-0.02em]"
        style={{ fontSize: "clamp(4.25rem, 17.5vw, 16rem)", fontVariationSettings: '"wdth" 75, "opsz" 96' }}
      >
        <Line delay={0.15}>{profile.name}</Line>
        {profile.nameLocal && (
          <Line delay={0.3} className="pl-[0.08em] text-[0.32em] font-medium leading-tight tracking-normal text-muted">
            {profile.nameLocal}
          </Line>
        )}
      </h1>

      <motion.div
        className="mt-10 h-px origin-left bg-ink"
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease, delay: 0.55 }}
      />

      <motion.div {...fade(0.9)} className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <p className="max-w-[34ch] text-xl leading-snug md:text-2xl">{profile.headline}</p>

        <div className="flex flex-col gap-3 text-sm md:items-end md:text-right">
          {profile.location && <span className="text-muted">{profile.location}</span>}
          {profile.availabilityText && (
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex size-2">
                {profile.available && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-ink opacity-40 [animation-duration:2.4s]" />
                )}
                <span className={`relative size-2 rounded-full ${profile.available ? "bg-ink" : "border border-ink"}`} />
              </span>
              {profile.availabilityText}
            </span>
          )}
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {links.map((l) => (
                <li key={l.id}>
                  <a href={l.url} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </section>
  );
}
