"use client";

import { useEffect, useState } from "react";
import { getViewStats, type ViewStats } from "@/app/[handle]/admin/actions";

const fmtDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-paper p-4 md:p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
        {value.toLocaleString("en-US")}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Daily views as thin bars, with a tooltip on hover or focus. */
function DailyBars({ daily }: { daily: ViewStats["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.views));
  const top = max <= 5 ? max : Math.ceil(max / 5) * 5;
  const H = 160;
  const active = hover !== null ? daily[hover] : null;

  return (
    <figure className="mt-8">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">Views per day, last 30 days</span>
        <span className="text-xs text-muted" aria-live="polite">
          {active ? `${fmtDay(active.day)}: ${active.views} ${active.views === 1 ? "view" : "views"}` : "Hover a bar for the day"}
        </span>
      </figcaption>
      <div className="relative mt-4 pl-8" onPointerLeave={() => setHover(null)}>
        {/* Recessive grid: baseline, midline and top value. */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute inset-x-0 left-8 border-t border-rule" style={{ bottom: f * H + 20 }}>
            {f !== 0.5 && <span className="absolute -left-8 -top-2 w-6 text-right text-[10px] tabular-nums text-muted">{top * f}</span>}
          </div>
        ))}
        <div className="flex items-end gap-[2px]" style={{ height: H }}>
          {daily.map((d, i) => (
            <button
              key={d.day}
              type="button"
              aria-label={`${fmtDay(d.day)}: ${d.views} views`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="group relative flex h-full flex-1 items-end outline-none"
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-ink" : d.views ? "bg-ink/70" : "bg-transparent"} group-focus-visible:ring-2 group-focus-visible:ring-ink`}
                style={{ height: d.views ? Math.max(3, (d.views / top) * H) : 0 }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted">
          <span>{daily[0] && fmtDay(daily[0].day)}</span>
          <span>{daily.at(-1) && "Today"}</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Views per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Views({ handle }: { handle: string }) {
  const [state, setState] = useState<{ stats?: ViewStats; error?: string }>({});

  useEffect(() => {
    let alive = true;
    getViewStats().then((r) => alive && setState(r.ok ? { stats: r.stats } : { error: r.error }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.error) return <p role="alert" className="text-sm">{state.error}</p>;
  if (!state.stats) return <p className="text-sm text-muted">Loading views…</p>;
  const s = state.stats;

  return (
    <div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule md:grid-cols-4">
        <Tile label="Today" value={s.today} />
        <Tile label="Last 7 days" value={s.last7} />
        <Tile label="Last 30 days" value={s.last30} />
        <Tile label="All time" value={s.total} hint={`${s.visitors.toLocaleString("en-US")} different visitors`} />
      </div>
      <DailyBars daily={s.daily} />
      <p className="mt-8 text-sm leading-relaxed text-muted">
        Counts visits to <span className="text-ink">/{handle}/profile</span>. Each visitor counts once per day, so refreshing doesn&apos;t add views. Your own visits while signed in,
        bots, and more than 3 visitors a day from one network aren&apos;t counted. Days follow Thailand time.
      </p>
    </div>
  );
}
