"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export type HeroProps = {
  nameLines: string[];
  altName: string;
  headline: string;
  location: string;
  available: boolean;
  availabilityText: string;
  links: { id: string; label: string; url: string }[];
};

function Line({
  children,
  delay,
  className,
  roomy,
  size = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
  roomy?: boolean;
  size?: string;
}) {
  const reduce = useReducedMotion();
  return (
    // Thai stacks vowels and tone marks above and below the line, so it needs more room inside the mask.
    <span className={`block overflow-hidden ${size} ${roomy ? "-mt-[0.12em] pb-[0.16em] pt-[0.22em]" : "pb-[0.08em]"}`}>
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

export function Hero({ nameLines, altName, headline, location, available, availabilityText, links }: HeroProps) {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.9, ease, delay } };
  const longest = Math.max(...nameLines.map((l) => l.length), 6);
  const thai = /[\u0E00-\u0E7F]/.test(nameLines.join(""));
  const altThai = /[\u0E00-\u0E7F]/.test(altName);
  // Thai combining marks inflate the character count without adding width.
  const visualLength = thai ? longest * 0.72 : longest;

  return (
    <section className="flex min-h-[88svh] flex-col justify-end pb-10 pt-28 md:pb-14">
      <h1
        className={`font-display font-bold tracking-[-0.02em] ${thai ? "leading-[1.02]" : "leading-[0.86]"}`}
        // Scale so the longest line of the name roughly fills the column.
        style={{ fontSize: `clamp(3.5rem, ${Math.min(17.5, (thai ? 100 : 118) / visualLength)}vw, 15rem)`, fontVariationSettings: '"wdth" 75, "opsz" 96' }}
      >
        {nameLines.map((line, i) => (
          <Line key={i} delay={0.15 + i * 0.12} roomy={thai}>
            {line}
          </Line>
        ))}
        {altName && (
          <Line delay={0.15 + nameLines.length * 0.12} roomy={altThai} size="text-[0.3em]" className="pl-[0.06em] font-medium leading-tight tracking-normal text-muted">
            {altName}
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
        <p className="max-w-[34ch] text-xl leading-snug md:text-2xl">{headline}</p>

        <div className="flex flex-col gap-3 text-sm md:items-end md:text-right">
          {location && <span className="text-muted">{location}</span>}
          {availabilityText && (
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex size-2">
                {available && <span className="absolute inset-0 animate-ping rounded-full bg-ink opacity-40 [animation-duration:2.4s]" />}
                <span className={`relative size-2 rounded-full ${available ? "bg-ink" : "border border-ink"}`} />
              </span>
              {availabilityText}
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
