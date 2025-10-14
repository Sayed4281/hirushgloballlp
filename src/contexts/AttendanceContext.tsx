import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord } from '../types';
import { getCurrentLocation } from '../utils/geolocation';
import { useAuth } from './AuthContext';

interface DailySession {
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // in minutes
}

interface AttendanceContextType {
  isCheckedIn: boolean;
  currentSession: AttendanceRecord | null;
  todaysSessions: DailySession[];
  attendanceSessions: AttendanceRecord[];
  totalHoursToday: number;
  loading: boolean;
  error: string;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  loadTodaysAttendance: () => Promise<void>;
  getCurrentSessionDuration: () => number;
  formatDuration: (minutes: number) => string;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

interface AttendanceProviderProps {
  children: ReactNode;
}

export const AttendanceProvider: React.FC<AttendanceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<DailySession[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceRecord[]>([]);
  const [totalHoursToday, setTotalHoursToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load today's attendance on component mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      // Always restore the latest session for today after login or page reload
      const restoreSession = async () => {
        await loadTodaysAttendance();
        await loadAllAttendance();
        setupAttendanceListener();
      };
      restoreSession();
    } else {
      // Only reset state if user logs out
      setIsCheckedIn(false);
      setCurrentSession(null);
      setAttendanceSessions([]);
      setTodaysSessions([]);
      setTotalHoursToday(0);
    }
  }, [user]);

  const setupAttendanceListener = () => {
    if (!user?.uid) return;

    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('employeeId', '==', user.uid),
      where('date', '==', today),
      orderBy('loginTime', 'desc')
    );

    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        loginTime: doc.data().loginTime.toDate(),
        logoutTime: doc.data().logoutTime?.toDate()
      })) as AttendanceRecord[];

      // Update attendance sessions
      setAttendanceSessions(records);

      // Find if there's an active session (no logout time)
      const activeSession = records.find(record => !record.logoutTime);
      setCurrentSession(activeSession || null);
      setIsCheckedIn(!!activeSession);

      // Calculate sessions and total hours
      const sessions: DailySession[] = records.map(record => ({
        checkInTime: record.loginTime,
        checkOutTime: record.logoutTime,
        duration: record.duration
      }));

      setTodaysSessions(sessions);

      // Calculate total hours worked today
      const totalMinutes = records.reduce((total, record) => {
        return total + (record.duration || 0);
      }, 0);
      setTotalHoursToday(totalMinutes / 60);
    });

    return unsubscribe;
  };

  const loadAllAttendance = async () => {
    if (!user?.uid) return;

    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        orderBy('loginTime', 'desc')
      );

      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        loginTime: doc.data().loginTime.toDate(),
        logoutTime: doc.data().logoutTime?.toDate()
      })) as AttendanceRecord[];

      setAttendanceSessions(records);
    } catch (err) {
      console.error('Error loading all attendance:', err);
    }
  };

  const loadTodaysAttendance = async () => {
    if (!user?.uid) return;

    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        where('date', '==', today),
        orderBy('loginTime', 'desc')
      );

      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        loginTime: doc.data().loginTime.toDate(),
        logoutTime: doc.data().logoutTime?.toDate()
      })) as AttendanceRecord[];

      // Update attendance sessions
      setAttendanceSessions(records);

      // Find if there's an active session (no logout time)
      const activeSession = records.find(record => !record.logoutTime);
      setCurrentSession(activeSession || null);
      setIsCheckedIn(!!activeSession);

      // Calculate sessions and total hours
      const sessions: DailySession[] = records.map(record => ({
        checkInTime: record.loginTime,
        checkOutTime: record.logoutTime,
        duration: record.duration
      }));

      setTodaysSessions(sessions);

      // Calculate total hours worked today
      const totalMinutes = records.reduce((total, record) => {
        return total + (record.duration || 0);
      }, 0);
      setTotalHoursToday(totalMinutes / 60);

    } catch (err) {
      console.error('Error loading attendance:', err);
      setError('Failed to load attendance data');
    }
  };

  const checkIn = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    try {
      const location = await getCurrentLocation();
      
      const attendanceData = {
        employeeId: user.uid,
        employeeName: user.name || user.email || 'Unknown',
        loginTime: new Date(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        date: today
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      
      const newSession = {
        id: docRef.id,
        ...attendanceData
      } as AttendanceRecord;

      setCurrentSession(newSession);
      setIsCheckedIn(true);
      // Real-time listener will update the data automatically

    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError('');

    try {
      const checkOutTime = new Date();
      const duration = Math.round((checkOutTime.getTime() - currentSession.loginTime.getTime()) / (1000 * 60));

      await updateDoc(doc(db, 'attendance', currentSession.id), {
        logoutTime: checkOutTime,
        duration: duration
      });

      // Only reset state after backend confirms check-out
      setCurrentSession(null);
      setIsCheckedIn(false);
      // Real-time listener will update the data automatically

    } catch (err: any) {
      setError(err.message || 'Failed to check out');
      // Do NOT reset state on error
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSessionDuration = (): number => {
    if (!currentSession) return 0;
    return (new Date().getTime() - currentSession.loginTime.getTime()) / (1000 * 60);
  };

  const formatDuration = (minutes: number): string => {
    const totalSeconds = Math.floor(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const value: AttendanceContextType = {
    isCheckedIn,
    currentSession,
    todaysSessions,
    attendanceSessions,
    totalHoursToday,
    loading,
    error,
    checkIn,
    checkOut,
    loadTodaysAttendance,
    getCurrentSessionDuration,
    formatDuration
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};