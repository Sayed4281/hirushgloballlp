import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Employee, AttendanceRecord, LeaveRequest } from '../../types';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  Activity,
  Timer,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface EmployeeDetailsProps {
  employeeId: string;
  onBack: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employeeId, onBack }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves'>('overview');
  
  // Enhanced attendance view state
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch employee details
      const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        setEmployee({
          id: employeeDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Employee);
      }

      // Fetch attendance records
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', employeeId),
        orderBy('date', 'desc')
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceList: AttendanceRecord[] = [];
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceList.push({
          id: doc.id,
          ...data,
          loginTime: data.loginTime?.toDate ? data.loginTime.toDate() : new Date(data.loginTime),
          logoutTime: data.logoutTime?.toDate ? data.logoutTime.toDate() : (data.logoutTime ? new Date(data.logoutTime) : undefined)
        } as AttendanceRecord);
      });
      setAttendanceRecords(attendanceList);

      // Fetch leave requests
      const leaveQuery = query(
        collection(db, 'leaves'),
        where('employeeId', '==', employeeId),
        orderBy('requestedAt', 'desc')
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      const leaveList: LeaveRequest[] = [];
      leaveSnapshot.forEach((doc) => {
        const data = doc.data();
        leaveList.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(data.requestedAt),
          respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate() : (data.respondedAt ? new Date(data.respondedAt) : undefined)
        } as LeaveRequest);
      });
      setLeaveRequests(leaveList);

    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWorkingHours = () => {
    return attendanceRecords.reduce((total, record) => {
      if (record.duration) {
        return total + record.duration;
      }
      return total;
    }, 0);
  };

  // Helper functions for enhanced attendance view
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const processDailyRecords = () => {
    // Group sessions by date
    const dailyGrouped: { [key: string]: AttendanceRecord[] } = {};
    
    attendanceRecords.forEach(session => {
      const dateKey = session.date;
      const sessionDate = new Date(session.loginTime);
      
      // Filter by selected month and year
      if (sessionDate.getMonth() === selectedMonth && sessionDate.getFullYear() === selectedYear) {
        if (!dailyGrouped[dateKey]) {
          dailyGrouped[dateKey] = [];
        }
        dailyGrouped[dateKey].push(session);
      }
    });

    // Convert to daily records array
    const records = Object.entries(dailyGrouped)
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
    if (!employee?.workingHours) return 8; // Default 8 hours
    
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if it's a working day
    if (employee.workingHours.workingDays.includes(dayName)) {
      return employee.workingHours.totalHoursPerDay;
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

  // Process daily records when attendance data changes
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      processDailyRecords();
    }
  }, [attendanceRecords, selectedMonth, selectedYear]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Employee not found</p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const totalHours = calculateTotalWorkingHours();
  const avgHoursPerDay = attendanceRecords.length > 0 ? totalHours / attendanceRecords.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Employee Management</span>
          </button>
        </div>

        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-2xl">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{employee.username}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDistance(employee.createdAt, new Date(), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'attendance', label: 'Attendance History', icon: Clock },
              { id: 'leaves', label: 'Leave Requests', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Attendance Days</p>
                      <p className="text-2xl font-bold text-blue-900">{attendanceRecords.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Working Hours</p>
                      <p className="text-2xl font-bold text-green-900">{Math.round(totalHours / 60)}h {totalHours % 60}m</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Average Hours/Day</p>
                      <p className="text-2xl font-bold text-purple-900">{Math.round(avgHoursPerDay / 60)}h {Math.round(avgHoursPerDay % 60)}m</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {attendanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{record.date}</p>
                        <p className="text-sm text-gray-600">
                          {record.loginTime.toLocaleTimeString()} - {record.logoutTime?.toLocaleTimeString() || 'Still working'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : 'In progress'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Month/Year Filters */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Detailed Attendance Records</h3>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Monthly Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Monthly Summary - {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h5 className="text-lg font-semibold text-blue-900">Total Hours</h5>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatDuration(getMonthlyStats().totalHours * 60)}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <h5 className="text-lg font-semibold text-green-900">Working Days</h5>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{getMonthlyStats().totalDays}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h5 className="text-lg font-semibold text-purple-900">Avg/Day</h5>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatDuration(getMonthlyStats().avgHoursPerDay * 60)}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Timer className="w-5 h-5 text-orange-600" />
                      <h5 className="text-lg font-semibold text-orange-900">Total Sessions</h5>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{getMonthlyStats().totalSessions}</p>
                  </div>
                </div>
              </div>

              {/* Daily Records */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Daily Records</h4>
                
                {dailyRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No attendance records found for {['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</p>
                    <p className="mt-2 text-sm">Employee hasn't checked in/out during this period.</p>
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
                                <h5 className="text-lg font-semibold text-gray-900">
                                  {formatDate(record.date)}
                                </h5>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    <Timer className="w-4 h-4" />
                                    <span>{record.sessionsCount} sessions</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Total: {formatDuration(record.totalMinutes)}</span>
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
                              <h6 className="text-sm font-semibold text-gray-900">Session Breakdown</h6>
                              <div className="bg-blue-100 px-3 py-1 rounded-lg">
                                <span className="text-sm font-semibold text-blue-800">
                                  Daily Total: {formatDuration(record.totalMinutes)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {record.sessions.map((session: AttendanceRecord, index: number) => {
                                const sessionDuration = session.duration || 0;
                                
                                return (
                                  <div key={session.id || index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                        Session {index + 1}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <PlayCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium">
                                          {session.loginTime.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {session.logoutTime && (
                                        <div className="flex items-center space-x-2">
                                          <PauseCircle className="w-4 h-4 text-red-600" />
                                          <span className="text-sm font-medium">
                                            {session.logoutTime.toLocaleTimeString([], { 
                                              hour: '2-digit', 
                                              minute: '2-digit',
                                              second: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {session.location.latitude.toFixed(4)}, {session.location.longitude.toFixed(4)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded">
                                      {session.logoutTime ? formatDuration(sessionDuration) : 'In Progress'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Summary Footer */}
                            <div className="mt-4 bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700 font-medium">
                                  Total Sessions: {record.sessionsCount}
                                </span>
                                <span className="text-blue-700 font-medium">
                                  Total Duration: {formatDuration(record.totalMinutes)}
                                </span>
                                <span className="text-blue-700 font-medium">
                                  Average Session: {formatDuration(record.totalMinutes / record.sessionsCount)}
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
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
              <div className="space-y-4">
                {leaveRequests.map((leave) => (
                  <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(leave.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {leave.startDate.toLocaleDateString()} - {leave.endDate.toLocaleDateString()}
                        </h4>
                        <p className="text-gray-600 mb-2">{leave.reason}</p>
                        <p className="text-sm text-gray-500">
                          Requested {formatDistance(leave.requestedAt, new Date(), { addSuffix: true })}
                        </p>
                        {leave.adminNote && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Admin Note:</strong> {leave.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    No leave requests found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;