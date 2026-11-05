const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatPoint(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-");
  return m ? `${MONTHS[Number(m) - 1] ?? m} ${y}` : y;
}

export function formatPeriod(start: string, end: string, ongoingLabel = "Present") {
  const s = formatPoint(start);
  const e = end ? formatPoint(end) : ongoingLabel;
  if (!s) return end ? e : "";
  return `${s} – ${e}`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
