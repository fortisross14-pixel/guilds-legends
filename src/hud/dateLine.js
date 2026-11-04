import { MONTHS } from '../data/content.js';

/** "June 1187 · week 2, day 3": the date as the place tag shows it. */
export function dateLine(date) {
  return `${MONTHS[date.month]} ${date.year} · week ${(date.week || 0) + 1}, day ${(date.day || 0) + 1}`;
}
