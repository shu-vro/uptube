/**
 * gets a - b in days
 * @param a date string
 * @param b date string
 * @returns difference in days
 */
export function differenceInDays(a: string, b: string): number {
  const dateA = new Date(a);
  const dateB = new Date(b);
  const diffTime = dateA.getTime() - dateB.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
