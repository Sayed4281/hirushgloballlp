import { useState, useEffect, useCallback } from 'react';
import { collection, doc, addDoc, updateDoc, query, where, orderBy, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceTracking } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useAttendanceTracking = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceTracking | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingTime, setWorkingTime] = useState<string>('00:00:00');

  // Real-time timer for current session
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isCheckedIn && currentSession?.checkInTime) {
      timer = setInterval(() => {
        const now = new Date();
        const checkInTime = new Date(currentSession.checkInTime);
        const diffMs = now.getTime() - checkInTime.getTime();
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setWorkingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckedIn, currentSession]);

  // Check if user is already checked in when component mounts
  useEffect(() => {
    if (user) {
      checkCurrentStatus();
    }
  }, [user]);

  // Listen for attendance records in real-time
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time listener for user:', user.uid);
    
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Real-time update received, records count:', snapshot.size);
        const records: AttendanceTracking[] = [];
        snapshot.forEach((doc) => {
          try {
            const data = doc.data();
            records.push({
              id: doc.id,
              employeeId: data.employeeId,
              employeeName: data.employeeName,
              checkInTime: data.checkInTime.toDate(),
              checkOutTime: data.checkOutTime ? data.checkOutTime.toDate() : undefined,
              date: data.date,
              totalHours: data.totalHours,
              totalMinutes: data.totalMinutes,
              totalSeconds: data.totalSeconds,
              status: data.status,
              location: data.location,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            });
          } catch (error) {
            console.error('Error parsing attendance record:', error, doc.data());
          }
        });
        setAttendanceRecords(records);
        console.log('Updated attendance records:', records.length);
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    return () => {
      console.log('Cleaning up real-time listener');
      unsubscribe();
    };
  }, [user]);

  const checkCurrentStatus = async () => {
    if (!user) return;

    try {
      console.log('Checking current attendance status for user:', user.uid);
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        where('date', '==', today),
        where('status', '==', 'checked-in')
      );

      const querySnapshot = await getDocs(q);
      console.log('Found', querySnapshot.size, 'active sessions');
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        console.log('Active session data:', data);
        
        const session: AttendanceTracking = {
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          checkInTime: data.checkInTime.toDate(),
          checkOutTime: data.checkOutTime ? data.checkOutTime.toDate() : undefined,
          date: data.date,
          status: data.status,
          location: data.location,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };

        setCurrentSession(session);
        setIsCheckedIn(true);
        console.log('Restored active session');
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error checking current status:', error);
    }
  };

  const checkIn = useCallback(async () => {
    if (!user || isCheckedIn) return;

    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      console.log('Starting check-in process for user:', user.uid);

      // Try to get user location but don't block if it fails
      let location = undefined;
      try {
        location = await getCurrentLocation();
        console.log('Location obtained:', location);
      } catch (error) {
        console.log('Location not available, proceeding without it:', error);
      }

      const attendanceData = {
        employeeId: user.uid,
        employeeName: user.name || user.email || 'Unknown',
        checkInTime: Timestamp.fromDate(now),
        date: today,
        status: 'checked-in' as const,
        ...(location && { location }), // Only include location if available
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      console.log('Attendance data to be saved:', attendanceData);

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      console.log('Document created with ID:', docRef.id);
      
      const newSession: AttendanceTracking = {
        id: docRef.id,
        employeeId: attendanceData.employeeId,
        employeeName: attendanceData.employeeName,
        checkInTime: now,
        date: attendanceData.date,
        status: attendanceData.status,
        location: attendanceData.location,
        createdAt: now,
        updatedAt: now,
      };

      setCurrentSession(newSession);
      setIsCheckedIn(true);
      setWorkingTime('00:00:00');
      console.log('Check-in successful');
    } catch (error) {
      console.error('Detailed check-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to check in: ${errorMessage}. Please check your internet connection and try again.`);
    } finally {
      setLoading(false);
    }
  }, [user, isCheckedIn]);

  const checkOut = useCallback(async () => {
    if (!user || !isCheckedIn || !currentSession) return;

    setLoading(true);
    try {
      const now = new Date();
      const checkInTime = new Date(currentSession.checkInTime);
      
      console.log('Starting check-out process for session:', currentSession.id);
      
      // Calculate total working time
      const diffMs = now.getTime() - checkInTime.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const totalHours = `${hours}h ${minutes}m ${seconds}s`;

      console.log('Calculated working time:', totalHours, 'Total minutes:', totalMinutes);

      // Update the document in Firebase
      const docRef = doc(db, 'attendance', currentSession.id);
      const updateData = {
        checkOutTime: Timestamp.fromDate(now),
        totalHours: totalHours,
        totalMinutes: totalMinutes,
        totalSeconds: totalSeconds,
        status: 'checked-out' as const,
        updatedAt: Timestamp.fromDate(now),
      };

      console.log('Update data:', updateData);
      await updateDoc(docRef, updateData);
      console.log('Check-out successful');

      setIsCheckedIn(false);
      setCurrentSession(null);
      setWorkingTime('00:00:00');
    } catch (error) {
      console.error('Detailed check-out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to check out: ${errorMessage}. Please check your internet connection and try again.`);
    } finally {
      setLoading(false);
    }
  }, [user, isCheckedIn, currentSession]);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser');
        resolve(undefined);
        return;
      }

      // Set a timeout for geolocation request
      const timeoutId = setTimeout(() => {
        console.log('Geolocation request timed out');
        resolve(undefined);
      }, 5000); // 5 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('Geolocation error:', error.message);
          resolve(undefined);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000 // Accept cached position up to 1 minute old
        }
      );
    });
  };

  return {
    isCheckedIn,
    currentSession,
    attendanceRecords,
    loading,
    workingTime,
    checkIn,
    checkOut,
  };
};