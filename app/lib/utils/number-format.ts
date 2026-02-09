import numeral from 'numeral';
import { formatDistanceToNow } from 'date-fns';

export const miniNumber = (value: number) => {
  return numeral(value).format('0a').toUpperCase();
};

export const numberToTime = (value: number | undefined) => {
  value = value || 0;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${formatTime(minutes)}:${formatTime(seconds)}`;
  }
  return `${formatTime(minutes)}:${formatTime(seconds)}`;
};

export const distanceFromToday = (dateString: string | number) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export const twoDateDifference = (date1: Date, date2: Date): number => {
  const diffInMs = date1.getTime() - date2.getTime();
  const msInADay = 1000 * 60 * 60 * 24;
  return Math.floor(diffInMs / msInADay);
};
