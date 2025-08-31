import { format, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const calculateDuration = (loginTime: Date, logoutTime: Date): number => {
  return differenceInMinutes(logoutTime, loginTime);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getTodayDateString = (): string => {
  return formatDate(new Date());
};

export const getDayStart = (date: Date): Date => {
  return startOfDay(date);
};

export const getDayEnd = (date: Date): Date => {
  return endOfDay(date);
};