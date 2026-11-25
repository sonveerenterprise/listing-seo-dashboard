// Display helpers. Dates are always shown in Indian time, wherever the server runs.
const TZ = { timeZone: "Asia/Kolkata" } as const;
export const dateIST = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { ...TZ, day: "numeric", month: "short", year: "numeric" });
export const dateTimeIST = (iso: string) => new Date(iso).toLocaleString("en-IN", { ...TZ, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
export const dayIST = (t: number) => new Date(t).toLocaleDateString("en-IN", { ...TZ, day: "numeric", month: "short" });
/** Colour band of a 0-100 score. */
export const band = (n: number): "ok" | "warn" | "bad" => (n >= 80 ? "ok" : n >= 60 ? "warn" : "bad");
export const bandLabel = (n: number) => ({ ok: "Good", warn: "Needs work", bad: "Poor" })[band(n)];
export const inr = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
