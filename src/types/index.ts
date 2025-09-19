export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'employee';
  name?: string;
  username?: string;
  createdAt?: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  idProof?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  loginTime: Date;
  logoutTime?: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  date: string; // YYYY-MM-DD format
  duration?: number; // in minutes
  dayType?: 'full' | 'half' | 'absent'; // New field for day classification
  totalDayMinutes?: number; // Total minutes worked in the day (all sessions combined)
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  respondedAt?: Date;
  adminNote?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId?: string; // undefined means broadcast to all
  toUserName?: string;
  content: string;
  sentAt: Date;
  isRead: boolean;
  type: 'direct' | 'broadcast';
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  description?: string;
  createdAt: Date;
  isPublicHoliday?: boolean; // True if this is an auto-populated public holiday
  country?: string; // Country for which this holiday applies
}