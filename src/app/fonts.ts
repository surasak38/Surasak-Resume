import { Anuphan, Bricolage_Grotesque, IBM_Plex_Sans_Thai } from "next/font/google";

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

export const fontVariables = `${display.variable} ${body.variable} ${thai.variable}`;

// Runs before paint so the saved theme never flashes.
export const themeScript = `(()=>{try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;
