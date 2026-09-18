const OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(value: Date): string {
  return DATE.format(value);
}

export function startOfNamedDay(value: Date): number {
  return (
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) -
    OFFSET_MS
  );
}

export function endOfNamedDay(value: Date): number {
  return startOfNamedDay(value) + DAY_MS;
}
