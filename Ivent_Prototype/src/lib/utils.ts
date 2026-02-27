export function formatDateTime(d: Date) {
  return d.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("uk-UA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
