export function makeId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const rand = Math.random().toString(36).slice(2);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function parseDateLoose(input: string): string | null {
  const trimmed = input.trim();
  const exact = Date.parse(trimmed);
  if (!Number.isNaN(exact)) {
    return new Date(exact).toISOString();
  }

  const byPattern = trimmed.match(/\b(today|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i);
  if (!byPattern) {
    return null;
  }

  const now = new Date();
  const day = byPattern[1].toLowerCase();
  if (day === "today") {
    return now.toISOString();
  }

  if (day === "tomorrow") {
    now.setDate(now.getDate() + 1);
    return now.toISOString();
  }

  const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = weekDays.indexOf(day);
  if (target < 0) {
    return null;
  }

  const delta = (target - now.getDay() + 7) % 7 || 7;
  now.setDate(now.getDate() + delta);
  return now.toISOString();
}

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
