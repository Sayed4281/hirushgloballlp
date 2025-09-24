import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AttendanceRecord, Employee } from '../../types';
import { 
  Calendar, 
  Download, 
  BarChart3, 
  Users, 
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceStats {
  employeeId: string;
  employeeName: string;
  totalDaysWorked: number;
  totalDaysPresent: number;
  totalDaysAbsent: number;
  totalHoursWorked: number;
  attendancePercentage: number;
  dailyAttendance: { [date: string]: 'present' | 'absent' | 'half-day' };
}

const AttendanceReports: React.FC = () => {
  const [, setEmployees] = useState<Employee[]>([]);
  const [, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'chart'>('table');

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('isActive', '==', true),
        orderBy('name')
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(employeesData);

      // Fetch attendance records for selected month/year
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      const attendanceQuery = query(
        collection(db, 'attendanceRecords'),
        where('date', '>=', formatDate(startDate)),
        where('date', '<=', formatDate(endDate)),
        orderBy('date')
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        loginTime: doc.data().loginTime?.toDate(),
        logoutTime: doc.data().logoutTime?.toDate()
      })) as AttendanceRecord[];
      
      setAttendanceRecords(attendanceData);
      
      // Calculate attendance statistics
      calculateAttendanceStats(employeesData, attendanceData, startDate, endDate);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const calculateAttendanceStats = (
    employees: Employee[], 
    attendanceRecords: AttendanceRecord[], 
    startDate: Date, 
    endDate: Date
  ) => {
    const stats: AttendanceStats[] = employees.map(employee => {
      const employeeAttendance = attendanceRecords.filter(
        record => record.employeeId === employee.id
      );

      // Get working days in the month (excluding weekends based on employee's working days)
      const workingDays = getWorkingDaysInRange(startDate, endDate, employee.workingHours.workingDays);
      
      // Calculate daily attendance
      const dailyAttendance: { [date: string]: 'present' | 'absent' | 'half-day' } = {};
      
      workingDays.forEach(date => {
        const dateStr = formatDate(date);
        const dayRecords = employeeAttendance.filter(record => record.date === dateStr);
        
        if (dayRecords.length === 0) {
          dailyAttendance[dateStr] = 'absent';
        } else {
          // Check if it's a full day or half day based on total hours
          const totalMinutes = dayRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
          const expectedMinutes = employee.workingHours.totalHoursPerDay * 60;
          
          if (totalMinutes >= expectedMinutes * 0.75) {
            dailyAttendance[dateStr] = 'present';
          } else if (totalMinutes >= expectedMinutes * 0.25) {
            dailyAttendance[dateStr] = 'half-day';
          } else {
            dailyAttendance[dateStr] = 'absent';
          }
        }
      });

      const totalDaysWorked = workingDays.length;
      const totalDaysPresent = Object.values(dailyAttendance).filter(status => status === 'present').length;
      const totalDaysAbsent = Object.values(dailyAttendance).filter(status => status === 'absent').length;
      const totalHoursWorked = employeeAttendance.reduce((sum, record) => sum + (record.duration || 0), 0) / 60;
      const attendancePercentage = totalDaysWorked > 0 ? (totalDaysPresent / totalDaysWorked) * 100 : 0;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalDaysWorked,
        totalDaysPresent,
        totalDaysAbsent,
        totalHoursWorked,
        attendancePercentage,
        dailyAttendance
      };
    });

    setAttendanceStats(stats);
  };

  const getWorkingDaysInRange = (startDate: Date, endDate: Date, workingDays: string[]): Date[] => {
    const days: Date[] = [];
    const current = new Date(startDate);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    while (current <= endDate) {
      const dayName = dayNames[current.getDay()];
      if (workingDays.includes(dayName)) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = attendanceStats.map(stat => ({
      'Employee Name': stat.employeeName,
      'Total Working Days': stat.totalDaysWorked,
      'Days Present': stat.totalDaysPresent,
      'Days Absent': stat.totalDaysAbsent,
      'Total Hours Worked': stat.totalHoursWorked.toFixed(2),
      'Attendance Percentage': `${stat.attendancePercentage.toFixed(1)}%`
    }));
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Daily attendance sheet
    const dailyData: any[] = [];
    const monthDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let day = 1; day <= monthDays; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateStr = formatDate(date);
      
      const row: any = { Date: dateStr };
      
      attendanceStats.forEach(stat => {
        row[stat.employeeName] = stat.dailyAttendance[dateStr] || 'N/A';
      });
      
      dailyData.push(row);
    }
    
    const dailySheet = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Attendance');
    
    // Save the file
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const fileName = `Attendance_Report_${monthNames[selectedMonth]}_${selectedYear}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const filteredStats = attendanceStats.filter(stat =>
    stat.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: '#102e50' }}>
            <th className="border border-gray-300 px-4 py-2 text-left text-white">Employee Name</th>
            <th className="border border-gray-300 px-4 py-2 text-center text-white">Working Days</th>
            <th className="border border-gray-300 px-4 py-2 text-center text-white">Present</th>
            <th className="border border-gray-300 px-4 py-2 text-center text-white">Absent</th>
            <th className="border border-gray-300 px-4 py-2 text-center text-white">Total Hours</th>
            <th className="border border-gray-300 px-4 py-2 text-center text-white">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {filteredStats.map((stat, index) => (
            <tr key={stat.employeeId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 px-4 py-2 font-medium">{stat.employeeName}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{stat.totalDaysWorked}</td>
              <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-semibold">
                {stat.totalDaysPresent}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center text-red-600 font-semibold">
                {stat.totalDaysAbsent}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {stat.totalHoursWorked.toFixed(1)}h
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <span className={`font-semibold ${
                  stat.attendancePercentage >= 90 ? 'text-green-600' :
                  stat.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stat.attendancePercentage.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCalendarView = () => {
    const monthDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    
    return (
      <div className="space-y-6">
        {filteredStats.map(stat => (
          <div key={stat.employeeId} className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-lg mb-3" style={{ color: '#102e50' }}>
              {stat.employeeName}
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="font-semibold p-2 bg-gray-100">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              
              {Array.from({ length: monthDays }, (_, i) => {
                const day = i + 1;
                const date = new Date(selectedYear, selectedMonth, day);
                const dateStr = formatDate(date);
                const status = stat.dailyAttendance[dateStr];
                
                const getStatusColor = () => {
                  switch (status) {
                    case 'present': return 'bg-green-100 text-green-800 border-green-300';
                    case 'half-day': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                    case 'absent': return 'bg-red-100 text-red-800 border-red-300';
                    default: return 'bg-gray-100 text-gray-600 border-gray-300';
                  }
                };
                
                return (
                  <div
                    key={day}
                    className={`p-2 border rounded ${getStatusColor()}`}
                  >
                    <div className="font-semibold">{day}</div>
                    <div className="text-xs mt-1">
                      {status === 'present' ? 'P' : 
                       status === 'half-day' ? 'H' : 
                       status === 'absent' ? 'A' : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 flex justify-between items-center text-sm">
              <div className="flex space-x-4">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
                  Present: {stat.totalDaysPresent}
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
                  Absent: {stat.totalDaysAbsent}
                </span>
              </div>
              <div className="font-semibold" style={{ color: '#102e50' }}>
                {stat.attendancePercentage.toFixed(1)}% Attendance
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-2xl font-bold" style={{ color: '#102e50' }}>
              {filteredStats.length}
            </p>
          </div>
          <Users className="w-8 h-8" style={{ color: '#FFB74D' }} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Attendance</p>
            <p className="text-2xl font-bold text-green-600">
              {(filteredStats.reduce((sum, stat) => sum + stat.attendancePercentage, 0) / filteredStats.length || 0).toFixed(1)}%
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-2xl font-bold" style={{ color: '#102e50' }}>
              {filteredStats.reduce((sum, stat) => sum + stat.totalHoursWorked, 0).toFixed(0)}h
            </p>
          </div>
          <Clock className="w-8 h-8" style={{ color: '#FFB74D' }} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Perfect Attendance</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredStats.filter(stat => stat.attendancePercentage >= 100).length}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  );

  const renderChartView = () => (
    <div className="space-y-6">
      {/* Attendance Chart */}
      <div>
        <h3 className="font-semibold text-lg mb-4" style={{ color: '#102e50' }}>
          Employee Attendance Chart
        </h3>
        <div className="space-y-4">
          {filteredStats.map(stat => (
            <div key={stat.employeeId}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{stat.employeeName}</span>
                <span className={`font-semibold ${
                  stat.attendancePercentage >= 90 ? 'text-green-600' :
                  stat.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stat.attendancePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    stat.attendancePercentage >= 90 ? 'bg-green-500' :
                    stat.attendancePercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stat.attendancePercentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance Categories */}
      <div>
        <h3 className="font-semibold text-lg mb-4" style={{ color: '#102e50' }}>
          Performance Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Excellent (90%+)</h4>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {filteredStats.filter(stat => stat.attendancePercentage >= 90).length}
            </p>
            <ul className="text-sm text-green-700 space-y-1">
              {filteredStats
                .filter(stat => stat.attendancePercentage >= 90)
                .slice(0, 3)
                .map(stat => (
                  <li key={stat.employeeId}>
                    {stat.employeeName} ({stat.attendancePercentage.toFixed(1)}%)
                  </li>
                ))}
              {filteredStats.filter(stat => stat.attendancePercentage >= 90).length > 3 && (
                <li className="font-medium">
                  +{filteredStats.filter(stat => stat.attendancePercentage >= 90).length - 3} more
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Good (75-89%)</h4>
            <p className="text-2xl font-bold text-yellow-600 mb-2">
              {filteredStats.filter(stat => stat.attendancePercentage >= 75 && stat.attendancePercentage < 90).length}
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {filteredStats
                .filter(stat => stat.attendancePercentage >= 75 && stat.attendancePercentage < 90)
                .slice(0, 3)
                .map(stat => (
                  <li key={stat.employeeId}>
                    {stat.employeeName} ({stat.attendancePercentage.toFixed(1)}%)
                  </li>
                ))}
              {filteredStats.filter(stat => stat.attendancePercentage >= 75 && stat.attendancePercentage < 90).length > 3 && (
                <li className="font-medium">
                  +{filteredStats.filter(stat => stat.attendancePercentage >= 75 && stat.attendancePercentage < 90).length - 3} more
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Needs Improvement (&lt;75%)</h4>
            <p className="text-2xl font-bold text-red-600 mb-2">
              {filteredStats.filter(stat => stat.attendancePercentage < 75).length}
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              {filteredStats
                .filter(stat => stat.attendancePercentage < 75)
                .slice(0, 3)
                .map(stat => (
                  <li key={stat.employeeId}>
                    {stat.employeeName} ({stat.attendancePercentage.toFixed(1)}%)
                  </li>
                ))}
              {filteredStats.filter(stat => stat.attendancePercentage < 75).length > 3 && (
                <li className="font-medium">
                  +{filteredStats.filter(stat => stat.attendancePercentage < 75).length - 3} more
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102e50' }}></div>
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#102e50' }}>
            Attendance Reports
          </h1>
          
          {/* Month/Year Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-lg font-semibold" style={{ color: '#102e50' }}>
              {monthNames[selectedMonth]} {selectedYear}
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* View Mode Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                viewMode === 'table' ? 'text-white' : 'text-gray-700 bg-gray-100'
              }`}
              style={{ backgroundColor: viewMode === 'table' ? '#102e50' : undefined }}
            >
              <FileText className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                viewMode === 'calendar' ? 'text-white' : 'text-gray-700 bg-gray-100'
              }`}
              style={{ backgroundColor: viewMode === 'calendar' ? '#102e50' : undefined }}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                viewMode === 'chart' ? 'text-white' : 'text-gray-700 bg-gray-100'
              }`}
              style={{ backgroundColor: viewMode === 'chart' ? '#102e50' : undefined }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Chart</span>
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="px-4 py-2 rounded-lg flex items-center space-x-2 text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#FFB74D' }}
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {renderStatisticsCards()}
      
      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'chart' && renderChartView()}
      </div>
    </div>
  );
};

export default AttendanceReports;