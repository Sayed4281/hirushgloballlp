import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AttendanceRecord, Holiday } from '../../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Users,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeCalendar: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance records (filter by current employee if needed)
      const attendanceQuery = query(collection(db, 'attendance'), orderBy('loginTime', 'desc'));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const records: AttendanceRecord[] = [];
      
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        // Show all attendance records for calendar view
        records.push({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          loginTime: data.loginTime.toDate(),
          logoutTime: data.logoutTime ? data.logoutTime.toDate() : undefined,
          location: data.location,
          date: data.date,
          duration: data.duration
        });
      });
      
      setAttendanceRecords(records);

      // Fetch holidays
      const holidaysQuery = query(collection(db, 'holidays'), orderBy('date', 'asc'));
      const holidaysSnapshot = await getDocs(holidaysQuery);
      const holidaysList: Holiday[] = [];
      
      holidaysSnapshot.forEach((doc) => {
        const data = doc.data();
        holidaysList.push({
          id: doc.id,
          date: data.date,
          name: data.name,
          description: data.description,
          isPublicHoliday: data.isPublicHoliday || false,
          country: data.country || 'Global',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });
      
      setHolidays(holidaysList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDateForComparison = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getMyAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => 
      record.date === date && record.employeeId === user?.uid
    );
  };

  const getHolidayForDate = (date: string) => {
    return holidays.find(holiday => holiday.date === date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateForComparison(date) === formatDateForComparison(today);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const myAttendanceRecords = attendanceRecords.filter(record => record.employeeId === user?.uid);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Company Calendar</h2>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CalendarDays className="w-4 h-4 inline mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              My Attendance
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Calendar Guide:</strong> Click a day to view details • 
              Green = Your Attendance • Purple = Public Holiday • Red = Company Holiday • Blue outline = Today
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ✨ View-only calendar - holidays and attendance are managed by admin
            </p>
            {selectedDate && (
              <p className="text-xs text-blue-600 mt-1">
                Currently selected: {selectedDate}
              </p>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentDate).map((day, index) => {
              if (!day) {
                return <div key={index} className="h-20"></div>;
              }

              const dateStr = formatDateForComparison(day);
              const dayAttendance = getAttendanceForDate(dateStr);
              const myAttendance = getMyAttendanceForDate(dateStr);
              const holiday = getHolidayForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-20 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : holiday 
                        ? holiday.isPublicHoliday 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-red-50 border-red-200'
                        : myAttendance.length > 0 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${isTodayDate ? 'ring-1 ring-blue-300' : ''}`}
                  title={holiday ? 
                    `${holiday.isPublicHoliday ? 'Public Holiday' : 'Company Holiday'}: ${holiday.name}` : 
                    myAttendance.length > 0 ? 'You were present' : 'Click to view details'
                  }
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </span>
                    {holiday && (
                      <span className={`text-xs ${holiday.isPublicHoliday ? 'text-purple-600' : 'text-red-600'}`}>
                        {holiday.isPublicHoliday ? '🏛️' : '🎉'}
                      </span>
                    )}
                  </div>
                  
                  {myAttendance.length > 0 && !holiday && (
                    <div className="mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                        Present
                      </span>
                    </div>
                  )}

                  {dayAttendance.length > 0 && !holiday && myAttendance.length === 0 && (
                    <div className="mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                        {dayAttendance.length} others
                      </span>
                    </div>
                  )}
                  
                  {holiday && (
                    <div className="mt-1">
                      <span className={`text-xs truncate block ${
                        holiday.isPublicHoliday ? 'text-purple-600' : 'text-red-600'
                      }`}>
                        {holiday.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* My Attendance List View */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">My Attendance History</h3>
            {myAttendanceRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.date}</h3>
                      <p className="text-sm text-gray-600">
                        {record.loginTime.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    {record.logoutTime ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Login Time</p>
                    <p className="font-medium">{record.loginTime.toLocaleTimeString()}</p>
                  </div>
                  
                  {record.logoutTime && (
                    <div>
                      <p className="text-gray-600">Logout Time</p>
                      <p className="font-medium">{record.logoutTime.toLocaleTimeString()}</p>
                    </div>
                  )}

                  {record.duration && (
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">
                        {Math.floor(record.duration / 60)}h {record.duration % 60}m
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {myAttendanceRecords.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No attendance records found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Details for {(() => {
                const [year, month, day] = selectedDate.split('-').map(Number);
                const displayDate = new Date(year, month - 1, day);
                return displayDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              })()}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Holiday Display */}
          {getHolidayForDate(selectedDate) && (
            <div className={`mb-4 p-4 border rounded-lg ${
              getHolidayForDate(selectedDate)?.isPublicHoliday 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div>
                <h4 className={`font-medium ${
                  getHolidayForDate(selectedDate)?.isPublicHoliday 
                    ? 'text-purple-900' 
                    : 'text-red-900'
                }`}>
                  {getHolidayForDate(selectedDate)?.isPublicHoliday ? '🏛️' : '🎉'} {getHolidayForDate(selectedDate)?.name}
                  {getHolidayForDate(selectedDate)?.isPublicHoliday && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Public Holiday
                    </span>
                  )}
                </h4>
                {getHolidayForDate(selectedDate)?.description && (
                  <p className={`text-sm mt-1 ${
                    getHolidayForDate(selectedDate)?.isPublicHoliday 
                      ? 'text-purple-700' 
                      : 'text-red-700'
                  }`}>
                    {getHolidayForDate(selectedDate)?.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* My Attendance for Selected Date */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              My Attendance ({getMyAttendanceForDate(selectedDate).length > 0 ? 'Present' : 'Absent'})
            </h4>
            {getMyAttendanceForDate(selectedDate).map((record) => (
              <div key={record.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">You were present</span>
                  <span className="text-sm text-green-700">
                    {record.loginTime.toLocaleTimeString()} - {record.logoutTime?.toLocaleTimeString() || 'Active'}
                  </span>
                </div>
                {record.duration && (
                  <p className="text-sm text-green-600 mt-1">
                    Duration: {Math.floor(record.duration / 60)}h {record.duration % 60}m
                  </p>
                )}
              </div>
            ))}
            {getMyAttendanceForDate(selectedDate).length === 0 && (
              <p className="text-gray-500 text-center py-4">You were not present on this day</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCalendar;
