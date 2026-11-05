import type { Metadata } from "next";
import { Anuphan, Bricolage_Grotesque, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-latin",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Thai glyphs for display type (Bricolage has no Thai).
const thai = Anuphan({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Surasak — Resume", template: "%s — Surasak" },
  description: "Profile and resume of Surasak.",
};

// Runs before paint so the saved theme never flashes.
const themeScript = `(()=>{try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${thai.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
