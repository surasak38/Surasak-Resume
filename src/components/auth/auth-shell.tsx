import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>
        <h1 className="mt-10 font-display text-4xl font-bold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
          {title}
        </h1>
        <p className="mt-2 text-muted">{intro}</p>
        {children}
      </div>
    </main>
  );
}

export const inputCls =
  "mt-1.5 block w-full rounded-md border border-rule bg-paper px-3 py-2.5 outline-none transition-colors focus:border-ink";
