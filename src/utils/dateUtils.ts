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

// Calculate day type based on total minutes worked
export const calculateDayType = (totalMinutes: number): 'full' | 'half' | 'absent' => {
  const totalHours = totalMinutes / 60;
  
  if (totalHours >= 5) {
    return 'full';
  } else if (totalHours > 0) {
    return 'half';
  } else {
    return 'absent';
  }
};

// Calculate total working time for all sessions in a day
export const calculateTotalDayMinutes = (attendanceRecords: any[]): number => {
  return attendanceRecords.reduce((total, record) => {
    if (record.duration) {
      return total + record.duration;
    }
    return total;
  }, 0);
};

// Format total day hours for display
export const formatTotalDayTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const dayType = calculateDayType(totalMinutes);
  
  const timeString = `${hours}h ${minutes}m`;
  const typeString = dayType === 'full' ? '(Full Day)' : dayType === 'half' ? '(Half Day)' : '(Absent)';
  
  return `${timeString} ${typeString}`;
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