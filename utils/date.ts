/** Returns 'YYYY-MM-DD' for a Date (local timezone). */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the date key for yesterday. */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

/** Format a Unix timestamp to 'HH:MM AM/PM'. */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/** Returns the dateKey N days ago. */
export function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateKey(d);
}

/** Returns an array of dateKeys for the last N days (most recent first). */
export function lastNDaysKeys(n: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < n; i++) keys.push(daysAgoKey(i));
  return keys;
}

/** Returns dateKeys for a week starting at weekOffset (0 = this week, 1 = last week, etc.). */
export function weekKeys(weekOffset: number): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek - weekOffset * 7);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/** Short day label from a dateKey (e.g. 'Mon'). */
export function dayLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

/** Days between two dates (dateKey strings). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round(Math.abs(db - da) / (1000 * 60 * 60 * 24));
}

/** Auto-detect meal type from current hour. */
export function inferMealType(hour?: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = hour ?? new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}
