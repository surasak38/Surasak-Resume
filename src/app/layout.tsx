import type { Metadata } from "next";
import { fontVariables, themeScript } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Folio — bilingual resumes", template: "%s" },
  description: "Build a bilingual (English/Thai) resume page with a one-page PDF, apps, certificates and a photo gallery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://eresume-lab.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
