import numeral from "numeral";
import { formatDistanceToNow } from "date-fns";

export const miniNumber = (value: number) =>
  numeral(value).format("0a").toUpperCase();

export const numberToTime = (value: number | undefined) => {
  const v = value || 0;
  const hours = Math.floor(v / 3600);
  const minutes = Math.floor((v % 3600) / 60);
  const seconds = Math.floor(v % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const distanceFromToday = (dateString: string | number) =>
  formatDistanceToNow(new Date(dateString), { addSuffix: true });

export const twoDateDifference = (date1: Date, date2: Date) =>
  Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
