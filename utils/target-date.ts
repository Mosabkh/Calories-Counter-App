const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getTargetDate(
  currentWeight: number,
  targetWeight: number,
  weeklySpeed: number,
  weightUnit: 'kg' | 'lb' = 'kg',
): string {
  const rawDiff = Math.abs(currentWeight - targetWeight);
  // weeklySpeed is always kg/week — convert lb diff to kg so units match
  const diff = weightUnit === 'lb' ? rawDiff / 2.20462 : rawDiff;
  const speed = weeklySpeed > 0 ? weeklySpeed : 0.5;
  const weeks = Math.ceil(diff / speed);
  const now = new Date();
  const target = new Date();
  target.setDate(target.getDate() + weeks * 7);
  const showYear = weeks > 26 || target.getFullYear() !== now.getFullYear();
  const dateStr = `${MONTHS[target.getMonth()]} ${ordinal(target.getDate())}`;
  return showYear ? `${dateStr}, ${target.getFullYear()}` : dateStr;
}
