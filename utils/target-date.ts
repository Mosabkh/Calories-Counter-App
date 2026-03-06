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
): string {
  const diff = Math.abs(currentWeight - targetWeight);
  const speed = weeklySpeed > 0 ? weeklySpeed : 0.5;
  const weeks = Math.ceil(diff / speed);
  const target = new Date();
  target.setDate(target.getDate() + weeks * 7);
  return `${MONTHS[target.getMonth()]} ${ordinal(target.getDate())}`;
}
