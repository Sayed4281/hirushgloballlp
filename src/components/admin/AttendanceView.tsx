import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AttendanceRecord, Holiday, Employee } from '../../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  X,
  Users,
  CalendarDays,
  Star,
  UserCheck,
  UserX
} from 'lucide-react';
import { formatDateTime, formatDuration } from '../../utils/dateUtils';
import { 
  getPublicHolidaysForYear
} from '../../utils/publicHolidays';

const AttendanceView: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoPopulateEnabled, setAutoPopulateEnabled] = useState(true);

  useEffect(() => {
    fetchData();
    if (autoPopulateEnabled) {
      autoPopulatePublicHolidays();
    }
  }, [autoPopulateEnabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // Auto-populate public holidays function
  const autoPopulatePublicHolidays = async () => {
    try {
      console.log('Auto-populating public holidays...');
      
      // Get current year and next year
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear + 1];
      
      for (const year of years) {
        const yearHolidays = getPublicHolidaysForYear(year);
        
        for (const publicHoliday of yearHolidays) {
          // Check if this public holiday already exists in Firestore
          const existingHolidayQuery = query(
            collection(db, 'holidays'), 
            where('date', '==', publicHoliday.date)
          );
          const existingSnapshot = await getDocs(existingHolidayQuery);
          
          // If it doesn't exist, add it
          if (existingSnapshot.empty) {
            console.log(`Adding public holiday: ${publicHoliday.name} on ${publicHoliday.date}`);
            
            await addDoc(collection(db, 'holidays'), {
              date: publicHoliday.date,
              name: publicHoliday.name,
              description: publicHoliday.description,
              isPublicHoliday: true,
              country: publicHoliday.country || 'Global',
              createdAt: serverTimestamp()
            });
          }
        }
      }
      
      console.log('Public holidays auto-population completed');
    } catch (error) {
      console.error('Error auto-populating public holidays:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance records
      const attendanceQuery = query(collection(db, 'attendance'), orderBy('loginTime', 'desc'));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const records: AttendanceRecord[] = [];
      
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
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

      // Fetch employees
      const employeesQuery = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesList: Employee[] = [];
      
      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        employeesList.push({
          id: doc.id,
          employeeId: data.employeeId,
          name: data.name,
          email: data.email,
          username: data.username,
          role: data.role,
          idProof: data.idProof,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          isActive: data.isActive,
          workingHours: data.workingHours
        });
      });
      
      setEmployees(employeesList);

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

  const addHoliday = async () => {
    if (!selectedDate || !holidayName.trim()) {
      console.log('Cannot add holiday: missing date or name', { selectedDate, holidayName });
      return;
    }
    
    try {
      console.log('Adding holiday:', { date: selectedDate, name: holidayName.trim() });
      
      const docRef = await addDoc(collection(db, 'holidays'), {
        date: selectedDate,
        name: holidayName.trim(),
        description: holidayDescription.trim(),
        createdAt: serverTimestamp()
      });
      
      console.log('Holiday added successfully with ID:', docRef.id);
      
      // Clear form and close modal
      setHolidayName('');
      setHolidayDescription('');
      setShowHolidayModal(false);
      
      // Refresh data to show the new holiday
      await fetchData();
      
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Error adding holiday: ' + error);
    }
  };

  const removeHoliday = async (holidayId: string) => {
    try {
      await deleteDoc(doc(db, 'holidays', holidayId));
      fetchData();
    } catch (error) {
      console.error('Error removing holiday:', error);
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
    // Fix timezone issue by using local date formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getHolidayForDate = (date: string) => {
    return holidays.find(holiday => holiday.date === date);
  };

  const getPresentEmployeesForDate = (date: string) => {
    const attendanceForDate = getAttendanceForDate(date);
    return attendanceForDate.map(record => ({
      ...employees.find(emp => emp.employeeId === record.employeeId),
      attendanceRecord: record
    })).filter(emp => emp.id); // Filter out any undefined employees
  };

  const getAbsentEmployeesForDate = (date: string) => {
    const attendanceForDate = getAttendanceForDate(date);
    const presentEmployeeIds = attendanceForDate.map(record => record.employeeId);
    
    // Check if it's a working day for each employee
    const selectedDateObj = new Date(date);
    const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    return employees.filter(employee => {
      // Only include active employees
      if (!employee.isActive) return false;
      
      // Check if this is a working day for the employee
      const isWorkingDay = employee.workingHours.workingDays.includes(dayName);
      
      // Employee is absent if they should be working but don't have attendance
      return isWorkingDay && !presentEmployeeIds.includes(employee.employeeId);
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateForComparison(date) === formatDateForComparison(today);
  };

  const handleDayClick = (dateStr: string, holiday: Holiday | undefined) => {
    if (clickTimeout) {
      // This is a double-click
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      
      console.log('Double-clicked date:', dateStr);
      setSelectedDate(dateStr);
      if (!holiday) {
        console.log('Opening holiday modal for:', dateStr);
        setShowHolidayModal(true);
      } else {
        console.log('Date already has holiday:', holiday.name);
      }
    } else {
      // This might be a single click - wait to see if there's a second click
      const timeout = setTimeout(() => {
        console.log('Single-clicked date:', dateStr);
        setSelectedDate(dateStr);
        setClickTimeout(null);
      }, 300);
      setClickTimeout(timeout);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const filteredRecords = attendanceRecords.filter(record => 
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedDate || record.date === selectedDate)
  );

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
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setAutoPopulateEnabled(!autoPopulateEnabled)}
              className={`px-3 py-2 rounded-lg transition-all text-sm ${
                autoPopulateEnabled 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle automatic public holiday marking"
            >
              <Star className="w-4 h-4 inline mr-1" />
              Auto Holidays
            </button>
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
              List
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
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
              <strong>Quick Guide:</strong> Click a day to view details • Double-click a day to mark as holiday • 
              Green = Attendance • Red = Custom Holiday • Purple = Public Holiday • Blue outline = Today
            </p>
            {autoPopulateEnabled && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Public holidays are automatically marked with 🏛️
              </p>
            )}
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
              const holiday = getHolidayForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dateStr, holiday)}
                  className={`h-20 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : holiday 
                        ? holiday.isPublicHoliday 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-red-50 border-red-200'
                        : dayAttendance.length > 0 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${isTodayDate ? 'ring-1 ring-blue-300' : ''}`}
                  title={holiday ? 
                    `${holiday.isPublicHoliday ? 'Public Holiday' : 'Holiday'}: ${holiday.name}` : 
                    `Click to select, double-click to mark as holiday`
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
                  
                  {dayAttendance.length > 0 && !holiday && (
                    <div className="mt-1 space-y-1">
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded block">
                        ✓ {dayAttendance.length}
                      </span>
                      {(() => {
                        const absentCount = getAbsentEmployeesForDate(dateStr).length;
                        return absentCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-1 rounded block">
                            ✗ {absentCount}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  
                  {dayAttendance.length === 0 && !holiday && (() => {
                    const absentCount = getAbsentEmployeesForDate(dateStr).length;
                    return absentCount > 0 && (
                      <div className="mt-1">
                        <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                          ✗ {absentCount}
                        </span>
                      </div>
                    );
                  })()}
                  
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
        /* List View */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.employeeName}</h3>
                      <p className="text-sm text-gray-600">{record.date}</p>
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
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Login</p>
                      <p className="font-medium">{formatDateTime(record.loginTime)}</p>
                    </div>
                  </div>
                  
                  {record.logoutTime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Logout</p>
                        <p className="font-medium">{formatDateTime(record.logoutTime)}</p>
                      </div>
                    </div>
                  )}

                  {record.duration && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">{formatDuration(record.duration)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredRecords.length === 0 && (
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
                // Fix date parsing to avoid timezone issues
                const [year, month, day] = selectedDate.split('-').map(Number);
                const displayDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                return displayDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              })()}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHolidayModal(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Mark Holiday</span>
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Holiday Display */}
          {getHolidayForDate(selectedDate) && (
            <div className={`mb-4 p-4 border rounded-lg ${
              getHolidayForDate(selectedDate)?.isPublicHoliday 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
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
                {!getHolidayForDate(selectedDate)?.isPublicHoliday && (
                  <button
                    onClick={() => removeHoliday(getHolidayForDate(selectedDate)!.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove custom holiday"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Attendance for Selected Date */}
          <div className="space-y-6">
            {/* Present Employees */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">
                  Employees Present ({getAttendanceForDate(selectedDate).length})
                </h4>
              </div>
              {getAttendanceForDate(selectedDate).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{record.employeeName}</span>
                      <p className="text-xs text-gray-600">ID: {record.employeeId}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="text-right">
                      <div>{record.loginTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs">
                        - {record.logoutTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || 'Active'}
                      </div>
                      {record.duration && (
                        <div className="text-xs text-green-600 font-medium">
                          {Math.floor(record.duration / 60)}h {record.duration % 60}m
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {getAttendanceForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No employees present on this day</p>
                </div>
              )}
            </div>

            {/* Absent Employees */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-gray-900">
                  Employees Absent ({getAbsentEmployeesForDate(selectedDate).length})
                </h4>
              </div>
              {getAbsentEmployeesForDate(selectedDate).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-medium text-sm">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{employee.name}</span>
                      <p className="text-xs text-gray-600">ID: {employee.employeeId}</p>
                    </div>
                  </div>
                  <div className="text-sm text-red-600 font-medium">
                    Absent
                  </div>
                </div>
              ))}
              {getAbsentEmployeesForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border">
                  <UserX className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No absent employees (all present or non-working day)</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Daily Summary</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getAttendanceForDate(selectedDate).length}
                  </div>
                  <div className="text-gray-600">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {getAbsentEmployeesForDate(selectedDate).length}
                  </div>
                  <div className="text-gray-600">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(() => {
                      const selectedDateObj = new Date(selectedDate);
                      const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      return employees.filter(emp => 
                        emp.isActive && emp.workingHours.workingDays.includes(dayName)
                      ).length;
                    })()}
                  </div>
                  <div className="text-gray-600">Expected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Mark Holiday</h3>
              <button
                onClick={() => {
                  setShowHolidayModal(false);
                  setHolidayName('');
                  setHolidayDescription('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Date:</strong> {(() => {
                    // Fix date parsing to avoid timezone issues
                    const [year, month, day] = selectedDate.split('-').map(Number);
                    const displayDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                    return displayDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  })()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Independence Day, Christmas, etc."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Additional details about the holiday..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowHolidayModal(false);
                    setHolidayName('');
                    setHolidayDescription('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addHoliday}
                  disabled={!holidayName.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🎉 Mark Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;