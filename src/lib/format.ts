const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Formats a local wall-clock kickoff ("YYYY-MM-DDTHH:MM:SS") for display. */
export const formatKickoff = (local: string): string => {
  const [datePart, timePart] = local.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const time = (timePart ?? '00:00:00').slice(0, 5);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${MONTHS[month - 1]} ${day} · ${time}`;
};

export const formatDateLong = (ymd: string): string => {
  const [year, month, day] = ymd.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${MONTHS[month - 1]} ${day}, ${year}`;
};

export const formatPriceUsd = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};
