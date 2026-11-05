import type { Metadata } from "next";
import { fontVariables, themeScript } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Resume admin", template: "%s — Resume admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
