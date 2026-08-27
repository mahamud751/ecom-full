/** Scheduling helpers for doctor availability slots */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ScheduleRow = {
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;
  slotMins: number;
  isActive: boolean;
};

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? String(dayOfWeek);
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplay(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export type SlotOption = {
  iso: string;
  label: string;
  dateLabel: string;
  timeLabel: string;
};

/** Build bookable slots for the next `daysAhead` days from a doctor's weekly schedule. */
export function buildUpcomingSlots(
  schedules: ScheduleRow[],
  options?: {
    daysAhead?: number;
    now?: Date;
    maxSlots?: number;
    occupiedIsos?: string[];
  }
): SlotOption[] {
  const daysAhead = options?.daysAhead ?? 7;
  const now = options?.now ?? new Date();
  const maxSlots = options?.maxSlots ?? 40;
  const occupied = new Set(options?.occupiedIsos ?? []);
  const active = schedules.filter((s) => s.isActive);
  if (!active.length) return [];

  const byDay = new Map<number, ScheduleRow[]>();
  for (const s of active) {
    const list = byDay.get(s.dayOfWeek) ?? [];
    list.push(s);
    byDay.set(s.dayOfWeek, list);
  }

  const slots: SlotOption[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");

  for (let d = 0; d < daysAhead && slots.length < maxSlots; d++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    const rows = byDay.get(dow);
    if (!rows?.length) continue;

    const dateLabel =
      d === 0
        ? "Today"
        : d === 1
          ? "Tomorrow"
          : `${dayName(dow)} ${pad(day.getDate())}/${pad(day.getMonth() + 1)}`;

    for (const row of rows) {
      const start = parseHm(row.startTime);
      const end = parseHm(row.endTime);
      const step = Math.max(15, row.slotMins || 30);

      for (let t = start; t + step <= end && slots.length < maxSlots; t += step) {
        const slotDate = new Date(day);
        slotDate.setHours(Math.floor(t / 60), t % 60, 0, 0);
        // skip past slots (+5 min buffer)
        if (slotDate.getTime() < now.getTime() + 5 * 60 * 1000) continue;

        const iso = slotDate.toISOString();
        if (occupied.has(iso)) continue;

        const timeLabel = formatDisplay(t);
        slots.push({
          iso,
          label: `${dateLabel} · ${timeLabel}`,
          dateLabel,
          timeLabel,
        });
      }
    }
  }

  return slots;
}

export function isWithinScheduleNow(
  schedules: ScheduleRow[],
  now = new Date()
): boolean {
  const dow = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  return schedules.some((s) => {
    if (!s.isActive || s.dayOfWeek !== dow) return false;
    return mins >= parseHm(s.startTime) && mins < parseHm(s.endTime);
  });
}

export function formatScheduleSummary(schedules: ScheduleRow[]): string {
  const active = schedules.filter((s) => s.isActive);
  if (!active.length) return "No fixed hours";
  const groups = new Map<string, number[]>();
  for (const s of active) {
    const key = `${s.startTime}–${s.endTime}`;
    const days = groups.get(key) ?? [];
    days.push(s.dayOfWeek);
    groups.set(key, days);
  }
  return Array.from(groups.entries())
    .map(([hours, days]) => {
      days.sort((a, b) => a - b);
      const names = days.map(dayName).join(", ");
      return `${names} ${hours}`;
    })
    .join(" · ");
}
