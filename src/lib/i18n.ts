export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/** ?lang= wins; otherwise Thai when the browser prefers it, else English. */
export function pickLocale(param: string | undefined | null, acceptLanguage?: string | null): Locale {
  if (param && isLocale(param)) return param;
  return /^\s*th\b/i.test(acceptLanguage ?? "") ? "th" : defaultLocale;
}

export type Localized = { en: string; th: string };
export type LocalizedList = { en: string[]; th: string[] };

/** Text in the requested language, falling back to the other one when empty. */
export function tr(value: Localized | undefined, lang: Locale): string {
  if (!value) return "";
  return value[lang] || value[lang === "en" ? "th" : "en"] || "";
}

export function trList(value: LocalizedList | undefined, lang: Locale): string[] {
  if (!value) return [];
  const own = value[lang].filter(Boolean);
  return own.length ? own : value[lang === "en" ? "th" : "en"].filter(Boolean);
}

const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
};

export function formatPoint(value: string, lang: Locale) {
  if (!value) return "";
  const [y, m] = value.split("-");
  return m ? `${MONTHS[lang][Number(m) - 1] ?? m} ${y}` : y;
}

export function formatPeriod(start: string, end: string, lang: Locale) {
  const s = formatPoint(start, lang);
  const e = end ? formatPoint(end, lang) : dict[lang].present;
  if (!s) return end ? e : "";
  return `${s} – ${e}`;
}

export const dict = {
  en: {
    switchTo: "ภาษาไทย",
    madeWith: "Make a resume like this",
    switchToShort: "TH",
    nav: { about: "About", experience: "Experience", apps: "Apps", gallery: "Certificates", photos: "Gallery", skills: "Skills", contact: "Contact" },
    photos: "Gallery",
    seeAll: "See all",
    photosCount: "photos",
    backToGrid: "Back to all photos",
    photo: "Photo",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
    about: "About",
    experience: "Experience",
    apps: "Apps I've built",
    appsIntro: "Personal projects. Select one to see screens.",
    gallery: "Certificates & activities",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
    hobbies: "Outside work",
    contact: "Contact",
    contactIntro: "The fastest way to reach me is by email.",
    present: "Present",
    downloadResume: "Download resume (PDF)",
    updated: "Updated",
    visit: "Open app",
    source: "Source code",
    close: "Close",
    previous: "Previous screen",
    next: "Next screen",
    screen: "Screen",
    swipeHint: "Swipe or use the arrow keys",
    noScreens: "No screens yet.",
    viewFile: "Open certificate",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    openOriginal: "Open original",
    docFailed: "This file couldn't be shown here. Open it directly:",
    docPdf: "PDF",
    docImage: "Image",
    verify: "Verify",
    all: "All",
    kinds: { certificate: "Certificates", training: "Training", competition: "Competitions", activity: "Activities" },
    kind: { certificate: "Certificate", training: "Training", competition: "Competition", activity: "Activity" },
  },
  th: {
    switchTo: "English",
    madeWith: "สร้าง resume แบบนี้ของคุณเอง",
    switchToShort: "EN",
    nav: { about: "เกี่ยวกับ", experience: "ประสบการณ์", apps: "แอป", gallery: "ใบรับรอง", photos: "แกลเลอรี", skills: "ทักษะ", contact: "ติดต่อ" },
    photos: "แกลเลอรี",
    seeAll: "ดูทั้งหมด",
    photosCount: "รูป",
    backToGrid: "กลับไปหน้ารวมรูป",
    photo: "รูป",
    previousPhoto: "รูปก่อนหน้า",
    nextPhoto: "รูปถัดไป",
    about: "เกี่ยวกับผม",
    experience: "ประสบการณ์ทำงาน",
    apps: "แอปที่พัฒนา",
    appsIntro: "โปรเจกต์ส่วนตัว กดเพื่อดูหน้าจอ",
    gallery: "ใบรับรองและกิจกรรม",
    skills: "ทักษะ",
    education: "การศึกษา",
    languages: "ภาษา",
    hobbies: "งานอดิเรก",
    contact: "ติดต่อ",
    contactIntro: "ติดต่อทางอีเมลได้เร็วที่สุด",
    present: "ปัจจุบัน",
    downloadResume: "ดาวน์โหลด Resume (PDF)",
    updated: "อัปเดตล่าสุด",
    visit: "เปิดแอป",
    source: "ซอร์สโค้ด",
    close: "ปิด",
    previous: "หน้าจอก่อนหน้า",
    next: "หน้าจอถัดไป",
    screen: "หน้าจอ",
    swipeHint: "ปัดหรือใช้ปุ่มลูกศรเพื่อดูรูปถัดไป",
    noScreens: "ยังไม่มีรูปหน้าจอ",
    viewFile: "เปิดใบรับรอง",
    rotateLeft: "หมุนซ้าย",
    rotateRight: "หมุนขวา",
    openOriginal: "เปิดไฟล์ต้นฉบับ",
    docFailed: "แสดงไฟล์นี้ในหน้านี้ไม่ได้ เปิดไฟล์โดยตรง:",
    docPdf: "PDF",
    docImage: "รูปภาพ",
    verify: "ตรวจสอบ",
    all: "ทั้งหมด",
    kinds: { certificate: "ใบรับรอง", training: "การอบรม", competition: "การแข่งขัน", activity: "กิจกรรม" },
    kind: { certificate: "ใบรับรอง", training: "การอบรม", competition: "การแข่งขัน", activity: "กิจกรรม" },
  },
} as const;

export type Dict = (typeof dict)[Locale];
