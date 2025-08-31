import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';
import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { formatDateTime, formatDuration, formatDate } from '../../utils/dateUtils';

const EmployeeAttendanceHistory: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAttendanceHistory();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchAttendanceHistory = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.uid),
        orderBy('loginTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const loginTime = data.loginTime.toDate();
        
        // Filter by selected month and year
        if (loginTime.getMonth() === selectedMonth && loginTime.getFullYear() === selectedYear) {
          records.push({
            id: doc.id,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            loginTime,
            logoutTime: data.logoutTime ? data.logoutTime.toDate() : undefined,
            location: data.location,
            date: data.date,
            duration: data.duration
          });
        }
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = attendanceRecords.reduce((sum, record) => {
    return sum + (record.duration || 0);
  }, 0);

  const averageHours = attendanceRecords.length > 0 ? totalHours / attendanceRecords.length : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Present</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(averageHours))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
          
          <div className="flex space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {attendanceRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{formatDate(record.loginTime)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(record.loginTime).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  {record.logoutTime ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-4 h-4 mr-1" />
                      Incomplete
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-600">Login</p>
                    <p className="font-medium">{formatTime(record.loginTime)}</p>
                  </div>
                </div>
                
                {record.logoutTime && (
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Logout</p>
                      <p className="font-medium">{formatTime(record.logoutTime)}</p>
                    </div>
                  </div>
                )}

                {record.duration && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{formatDuration(record.duration)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {attendanceRecords.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceHistory;