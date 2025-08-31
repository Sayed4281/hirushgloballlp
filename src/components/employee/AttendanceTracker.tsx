import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';
import {
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { getTodayDateString, formatTime, calculateDuration, formatDuration } from '../../utils/dateUtils';

const AttendanceTracker: React.FC = () => {
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    checkTodayAttendance();
  }, [user]);

  const checkTodayAttendance = async () => {
    if (!user) return;

    try {
      const today = getTodayDateString();
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        where('date', '==', today),
        orderBy('loginTime', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setCurrentAttendance({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          loginTime: data.loginTime.toDate(),
          logoutTime: data.logoutTime ? data.logoutTime.toDate() : undefined,
          location: data.location,
          date: data.date,
          duration: data.duration
        });
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const handleLogin = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const attendanceData = {
        employeeId: user.uid,
        employeeName: user.name || 'Employee',
        loginTime: new Date(),
        date: getTodayDateString(),
        location: { latitude: 0, longitude: 0 }, // Default location values
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);

      setCurrentAttendance({
        id: docRef.id,
        ...attendanceData,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to record login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!user || !currentAttendance || currentAttendance.logoutTime) return;

    setLoading(true);

    try {
      const logoutTime = new Date();
      const duration = calculateDuration(currentAttendance.loginTime, logoutTime);

      await updateDoc(doc(db, 'attendance', currentAttendance.id), {
        logoutTime: logoutTime,
        duration: duration,
      });

      setCurrentAttendance((prev) =>
        prev
          ? {
              ...prev,
              logoutTime,
              duration,
            }
          : null
      );
    } catch (error: any) {
      setError(error.message || 'Failed to record logout');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total working hours for the day
  const calculateTotalHours = (records: AttendanceRecord[]): number => {
    return records.reduce((total: number, record: AttendanceRecord) => {
      if (record.loginTime && record.logoutTime) {
        const duration = calculateDuration(record.loginTime, record.logoutTime);
        return total + duration;
      }
      return total;
    }, 0);
  };

  // Fetch attendance records for the day
  const fetchDailyAttendance = async () => {
    if (!user) return;

    try {
      const today = getTodayDateString();
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        where('date', '==', today),
        orderBy('loginTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          loginTime: data.loginTime.toDate(),
          logoutTime: data.logoutTime ? data.logoutTime.toDate() : undefined,
          location: data.location,
          date: data.date,
          duration: data.duration,
        };
      });

      const totalHours = calculateTotalHours(records);
      console.log(`Total working hours for ${today}:`, totalHours);
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
    }
  };

  useEffect(() => {
    fetchDailyAttendance();
  }, [user]);

  const isLoggedIn = currentAttendance && !currentAttendance.logoutTime;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Tracker</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Session */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Current Session</h3>

            {currentAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700">Login Time</p>
                    <p className="font-semibold text-blue-900">
                      {formatTime(currentAttendance.loginTime)}
                    </p>
                  </div>
                </div>

                {currentAttendance.logoutTime ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-700">Logout Time</p>
                      <p className="font-semibold text-blue-900">
                        {formatTime(currentAttendance.logoutTime)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-blue-700">Currently logged in</p>
                  </div>
                )}

                {currentAttendance.duration && (
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm text-blue-700">Total Duration</p>
                      <p className="font-semibold text-blue-900">
                        {formatDuration(currentAttendance.duration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-blue-700">No active session for today</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isLoggedIn ? (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <LogIn className="w-6 h-6" />
                <span>{loading ? 'Logging In...' : 'Login'}</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <LogOut className="w-6 h-6" />
                <span>{loading ? 'Logging Out...' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;