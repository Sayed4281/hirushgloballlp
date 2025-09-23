import React, { useState, useEffect } from 'react';
import { useAttendanceTracking } from '../../hooks/useAttendanceTracking';
import { 
  Calendar,
  Clock,
  CheckCircle,
  Timer,
  Filter,
  Download,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { attendanceRecords, isCheckedIn, workingTime, currentSession } = useAttendanceTracking();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [liveWorkingTimes, setLiveWorkingTimes] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Filter records by selected month and year
  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
  });

  // Group records by date and calculate daily totals
  interface DailySummary {
    date: string;
    sessions: typeof filteredRecords;
    totalSeconds: number;
    totalHours: string;
    isWorkingToday: boolean;
  }

  const dailySummaries = React.useMemo(() => {
    const groupedByDate: Record<string, typeof filteredRecords> = {};
    
    filteredRecords.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });

    const summaries: DailySummary[] = Object.entries(groupedByDate).map(([date, sessions]) => {
      let totalSeconds = 0;
      let isWorkingToday = false;

      sessions.forEach(session => {
        if (session.status === 'checked-out' && session.totalSeconds) {
          totalSeconds += session.totalSeconds;
        } else if (session.status === 'checked-in') {
          isWorkingToday = true;
          // Calculate current session time
          const now = new Date();
          const checkInTime = new Date(session.checkInTime);
          const currentSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
          totalSeconds += currentSeconds;
        }
      });

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const totalHours = `${hours}h ${minutes}m ${seconds}s`;

      return {
        date,
        sessions,
        totalSeconds,
        totalHours,
        isWorkingToday
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return summaries;
  }, [filteredRecords]);

  // Live timer for checked-in records and daily totals
  useEffect(() => {
    const timer = setInterval(() => {
      const newLiveWorkingTimes: Record<string, string> = {};
      
      // Update individual session times
      filteredRecords.forEach(record => {
        if (record.status === 'checked-in') {
          const now = new Date();
          const checkInTime = new Date(record.checkInTime);
          const diffMs = now.getTime() - checkInTime.getTime();
          
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          newLiveWorkingTimes[record.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      
      setLiveWorkingTimes(newLiveWorkingTimes);
    }, 1000);

    return () => clearInterval(timer);
  }, [filteredRecords]);

  // Calculate total working hours for the month from daily summaries
  const totalMonthlySeconds = dailySummaries.reduce((total, day) => {
    return total + day.totalSeconds;
  }, 0);

  const totalMonthlyMinutes = Math.floor(totalMonthlySeconds / 60);

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force a refresh by updating the component state
    setTimeout(() => {
      setIsRefreshing(false);
      // Force re-render by updating a state value
      setLiveWorkingTimes(prev => ({ ...prev }));
    }, 1000);
  };

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Tracking</h1>
          <p className="text-gray-600">Monitor your daily check-in and check-out records</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Current Status Card */}
      {isCheckedIn && currentSession && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(76, 175, 80, 0.1)', borderColor: '#4CAF50' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Timer className="w-6 h-6" style={{ color: '#4CAF50' }} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Currently Working</h3>
                <p className="text-sm text-gray-600">
                  Started at {formatTime(currentSession.checkInTime)} • {formatDate(currentSession.date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: '#4CAF50' }}>{workingTime}</p>
              <p className="text-sm text-gray-600">Working Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Stats */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Monthly Hours</p>
            <p className="text-lg font-bold text-blue-600">{formatTotalTime(totalMonthlyMinutes)}</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Timer className="w-4 h-4 mr-1" />
                    Total Daily Hours
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailySummaries.length > 0 ? (
                <>
                  {dailySummaries.map((daySummary) => (
                    <React.Fragment key={daySummary.date}>
                      {/* Daily Summary Row */}
                      <tr 
                        className={`hover:bg-gray-50 ${
                          daySummary.isWorkingToday 
                            ? 'bg-green-50 border-l-4 border-green-500' 
                            : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(daySummary.date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(daySummary.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {daySummary.sessions.length} session{daySummary.sessions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {daySummary.isWorkingToday ? (
                              <>
                                <Play className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm font-medium text-green-600">
                                  {daySummary.totalHours} (Live)
                                </span>
                              </>
                            ) : (
                              <>
                                <Timer className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {daySummary.totalHours}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {daySummary.isWorkingToday ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-sm font-medium text-green-600">Working</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                                <span className="text-sm text-blue-600">Completed</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleDayExpansion(daySummary.date)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expandedDays.has(daySummary.date) ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Show
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Individual Sessions (when expanded) */}
                      {expandedDays.has(daySummary.date) && daySummary.sessions.map((session) => (
                        <tr key={`${daySummary.date}-${session.id}`} className="bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="pl-6 text-xs text-gray-500">
                              Session {daySummary.sessions.indexOf(session) + 1}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="flex items-center text-xs">
                              <Clock className="w-3 h-3 text-green-500 mr-1" />
                              <span>{formatTime(session.checkInTime)}</span>
                              {session.checkOutTime && (
                                <>
                                  <span className="mx-1">→</span>
                                  <Clock className="w-3 h-3 text-red-500 mr-1" />
                                  <span>{formatTime(session.checkOutTime)}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-600">
                              {session.status === 'checked-out' ? (
                                session.totalHours || '-'
                              ) : (
                                <span className="text-green-600">
                                  {liveWorkingTimes[session.id] || '00:00:00'} (Live)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`text-xs ${
                              session.status === 'checked-in' 
                                ? 'text-green-600' 
                                : 'text-gray-600'
                            }`}>
                              {session.status === 'checked-in' ? 'Active' : 'Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap"></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No attendance records found</p>
                      <p className="text-gray-400 text-sm">
                        Records for {getMonthName(filterMonth)} {filterYear} will appear here
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      {filteredRecords.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Days Worked</p>
                <p className="text-2xl font-bold text-gray-900">{dailySummaries.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(totalMonthlyMinutes / 60)}h {totalMonthlyMinutes % 60}m
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Timer className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Daily Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dailySummaries.length > 0 
                    ? `${Math.floor(totalMonthlyMinutes / dailySummaries.length / 60)}h ${Math.floor((totalMonthlyMinutes / dailySummaries.length) % 60)}m`
                    : '0h 0m'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;