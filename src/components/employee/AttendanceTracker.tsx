import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  Calendar,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  Timer,
  MapPin,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2
} from 'lucide-react';

interface DailyAttendance {
  date: string;
  sessions: Array<{
    id: string;
    checkInTime: Date;
    checkOutTime?: Date;
    duration?: number;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
  totalMinutes: number;
  totalHours: number;
  sessionsCount: number;
}

const AttendanceTracker: React.FC = () => {
  const { 
    isCheckedIn, 
    attendanceSessions,
    totalHoursToday,
    getCurrentSessionDuration,
    formatDuration
  } = useAttendance();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyRecords, setDailyRecords] = useState<DailyAttendance[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Process attendance sessions into daily records
  useEffect(() => {
    if (attendanceSessions && attendanceSessions.length > 0) {
      processDailyRecords();
    }
  }, [attendanceSessions, selectedMonth, selectedYear]);

  const processDailyRecords = () => {
    // Group sessions by date
    const dailyGrouped: { [key: string]: any[] } = {};
    
    attendanceSessions.forEach(session => {
      const dateKey = session.loginTime.toISOString().split('T')[0];
      const sessionDate = new Date(session.loginTime);
      
      // Filter by selected month and year
      if (sessionDate.getMonth() === selectedMonth && sessionDate.getFullYear() === selectedYear) {
        if (!dailyGrouped[dateKey]) {
          dailyGrouped[dateKey] = [];
        }
        dailyGrouped[dateKey].push({
          id: session.id,
          checkInTime: session.loginTime,
          checkOutTime: session.logoutTime,
          duration: session.duration,
          location: session.location
        });
      }
    });

    // Convert to DailyAttendance array
    const records: DailyAttendance[] = Object.entries(dailyGrouped)
      .map(([date, sessions]) => {
        const totalMinutes = sessions.reduce((sum, session) => {
          return sum + (session.duration || 0);
        }, 0);

        return {
          date,
          sessions,
          totalMinutes,
          totalHours: totalMinutes / 60,
          sessionsCount: sessions.length
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setDailyRecords(records);
  };

  // Helper function to get expected working hours for a specific date
  const getExpectedWorkingHours = (dateStr: string): number => {
    if (!user?.workingHours) return 8; // Default 8 hours
    
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if it's a working day
    if (user.workingHours.workingDays.includes(dayName)) {
      return user.workingHours.totalHoursPerDay;
    }
    return 0; // Non-working day
  };

  // Helper function to calculate work completion percentage
  const getWorkCompletionPercentage = (actualHours: number, expectedHours: number): number => {
    if (expectedHours === 0) return 0;
    return Math.min((actualHours / expectedHours) * 100, 100);
  };

  // Helper function to get completion status color
  const getCompletionStatusColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleExpanded = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthlyStats = () => {
    const totalMinutes = dailyRecords.reduce((sum, record) => sum + record.totalMinutes, 0);
    const totalHours = totalMinutes / 60;
    const totalDays = dailyRecords.length;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const totalSessions = dailyRecords.reduce((sum, record) => sum + record.sessionsCount, 0);

    return { totalHours, totalDays, avgHoursPerDay, totalSessions };
  };

  const monthlyStats = getMonthlyStats();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Attendance</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Time Today */}
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-blue-900">Total Time Today</h4>
            </div>
            <p className="text-3xl font-bold text-blue-900 mb-2">
              {formatDuration((totalHoursToday * 60) + (isCheckedIn ? getCurrentSessionDuration() : 0))}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              {isCheckedIn ? 'Currently working' : 'Off duty'}
            </p>
          </div>

          {/* Current Session */}
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Timer className="w-6 h-6 text-green-600" />
              <h4 className="text-lg font-semibold text-green-900">Current Session</h4>
            </div>
            <p className="text-3xl font-bold text-green-900 mb-2">
              {isCheckedIn && formatDuration
                ? formatDuration(getCurrentSessionDuration()) 
                : '0h 0m 0s'}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {isCheckedIn ? 'Active session' : 'No active session'}
            </p>
          </div>

          {/* Current Date */}
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-semibold text-purple-900">Today</h4>
            </div>
            <p className="text-lg font-bold text-purple-900 mb-2">
              {currentTime.toLocaleDateString()}
            </p>
            <p className="text-xs text-purple-600 mt-2">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>

          {/* Current Time */}
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Activity className="w-6 h-6 text-orange-600" />
              <h4 className="text-lg font-semibold text-orange-900">Current Time</h4>
            </div>
            <p className="text-lg font-bold text-orange-900 mb-2">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-xs text-orange-600 mt-2">
              Live time
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Monthly Summary - {months[selectedMonth]} {selectedYear}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-blue-900">Total Hours</h4>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatDuration ? formatDuration(monthlyStats.totalHours * 60) : '0h 0m'}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-semibold text-green-900">Working Days</h4>
            </div>
            <p className="text-2xl font-bold text-green-900">{monthlyStats.totalDays}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-semibold text-purple-900">Avg/Day</h4>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatDuration ? formatDuration(monthlyStats.avgHoursPerDay * 60) : '0h 0m'}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Timer className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-semibold text-orange-900">Total Sessions</h4>
            </div>
            <p className="text-2xl font-bold text-orange-900">{monthlyStats.totalSessions}</p>
          </div>
        </div>
      </div>

      {/* Daily Records */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Daily Attendance History</h3>
        
        {dailyRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No attendance records found for {months[selectedMonth]} {selectedYear}</p>
            <p className="mt-2 text-sm">Start checking in/out to see your daily records here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyRecords.map((record) => {
              const expectedHours = getExpectedWorkingHours(record.date);
              const actualHours = record.totalHours;
              const completionPercentage = getWorkCompletionPercentage(actualHours, expectedHours);
              const statusColor = getCompletionStatusColor(completionPercentage);
              
              return (
              <div key={record.date} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpanded(record.date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Date(record.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getDayName(record.date)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {formatDate(record.date)}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>{record.sessionsCount} sessions</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Total: {formatDuration ? formatDuration(record.totalMinutes) : '0h 0m'}</span>
                          </span>
                          {expectedHours > 0 && (
                            <span className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>Target: {expectedHours}h</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Working Hours Comparison */}
                      {expectedHours > 0 && (
                        <div className="text-center bg-gray-50 rounded-lg p-3 min-w-[120px]">
                          <div className="text-xs text-gray-600 font-medium mb-1">
                            EXPECTED HOURS
                          </div>
                          <div className="text-xl font-bold text-gray-700">
                            {expectedHours}h
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Working Day
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center bg-blue-50 rounded-lg p-3 min-w-[120px]">
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          ACTUAL HOURS
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {actualHours.toFixed(1)}h
                        </div>
                        {expectedHours > 0 && (
                          <div className={`text-xs mt-1 font-medium ${statusColor}`}>
                            {completionPercentage.toFixed(0)}% Complete
                          </div>
                        )}
                      </div>
                      
                      {expectedHours > 0 && (
                        <div className="text-center bg-green-50 rounded-lg p-3 min-w-[120px]">
                          <div className="text-xs text-green-600 font-medium mb-1">
                            STATUS
                          </div>
                          <div className="flex items-center justify-center">
                            {completionPercentage >= 100 ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <div className={`text-sm font-semibold ${statusColor}`}>
                                {(expectedHours - actualHours).toFixed(1)}h left
                              </div>
                            )}
                          </div>
                          <div className={`text-xs mt-1 font-medium ${statusColor}`}>
                            {completionPercentage >= 100 ? 'Completed' : 
                             completionPercentage >= 75 ? 'On Track' :
                             completionPercentage >= 50 ? 'Behind' : 'Far Behind'}
                          </div>
                        </div>
                      )}
                      
                      {expandedDate === record.date ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedDate === record.date && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-gray-900">Session Breakdown</h5>
                      <div className="bg-blue-100 px-3 py-1 rounded-lg">
                        <span className="text-sm font-semibold text-blue-800">
                          Daily Total: {formatDuration ? formatDuration(record.totalMinutes) : '0h 0m'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {record.sessions.map((session, index) => {
                        const sessionDuration = session.duration || 0;
                        
                        return (
                          <div key={session.id || index} className="bg-white rounded-lg p-4 border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <PlayCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      Check In: {session.checkInTime.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        second: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  {session.checkOutTime && (
                                    <div className="flex items-center space-x-2">
                                      <PauseCircle className="w-4 h-4 text-red-600" />
                                      <span className="text-sm font-medium text-gray-900">
                                        Check Out: {session.checkOutTime.toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {session.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">Location tracked</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="bg-green-50 px-3 py-2 rounded-lg">
                                  <div className="text-lg font-bold text-green-700">
                                    {session.checkOutTime ? (formatDuration ? formatDuration(sessionDuration) : '0h 0m') : 'In Progress'}
                                  </div>
                                  <div className="text-xs text-green-600">
                                    Session Duration
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                          Total sessions: {record.sessionsCount}
                        </span>
                        <span className="text-lg font-bold text-blue-800">
                          Total time: {formatDuration ? formatDuration(record.totalMinutes) : '0h 0m'} ({record.totalHours.toFixed(2)} hours)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
