export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-rule py-16 md:py-24">
      <div className="grid gap-8 md:grid-cols-[13rem_1fr] md:gap-12 lg:grid-cols-[16rem_1fr]">
        <h2
          id={`${id}-title`}
          className="font-display text-3xl font-semibold tracking-tight md:sticky md:top-24 md:self-start"
          style={{ fontVariationSettings: '"wdth" 80' }}
        >
          {title}
        </h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
