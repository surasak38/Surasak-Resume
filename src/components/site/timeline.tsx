"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";

export type TimelineItem = {
  id: string;
  period: string;
  location: string;
  role: string;
  company: string;
  description: string;
  highlights: string[];
};

/** Experience list whose spine fills in as you scroll through it. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <ol ref={ref} className="relative">
      <span aria-hidden className="absolute bottom-2 left-[3px] top-2 w-px bg-rule" />
      <motion.span aria-hidden className="absolute bottom-2 left-[3px] top-2 w-px origin-top bg-ink" style={reduce ? undefined : { scaleY }} />
      {items.map((item) => (
        <li key={item.id} className="relative pb-14 pl-8 last:pb-0">
          <span aria-hidden className="absolute left-0 top-[0.55rem] size-[7px] bg-ink" />
          <p className="tabular text-sm text-muted">
            {item.period}
            {item.location && <span>, {item.location}</span>}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl" style={{ fontVariationSettings: '"wdth" 85' }}>
            {item.role}
          </h3>
          <p className="text-lg">{item.company}</p>
          {item.description && <p className="mt-4 max-w-[62ch] leading-relaxed text-muted">{item.description}</p>}
          {item.highlights.length > 0 && (
            <ul className="mt-4 max-w-[66ch] space-y-2">
              {item.highlights.map((h, i) => (
                <li key={i} className="relative pl-5 leading-relaxed before:absolute before:left-0 before:top-[0.75em] before:h-px before:w-2.5 before:bg-ink">
                  {h}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
