import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Employee } from '../../types';
import { BarChart3, Download, Calendar, Clock, Users } from 'lucide-react';

interface AttendanceTableRow {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  totalMinutes: number;
  totalHours: string; // Format: "8:30:45"
}

const EmployeeOverview: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceTableRow[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Helper function to format minutes to HH:MM:SS
  const formatTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchAttendanceTableData();
  }, []);

  const fetchAttendanceTableData = async () => {
    try {
      setLoading(true);
      console.log('Fetching attendance table data...');

      // Fetch all employees
      const employeesSnapshot = await getDocs(collection(db, 'employees'));
      const employees: Employee[] = [];
      
      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        employees.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Employee);
      });

      // Fetch all attendance records
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));

      // Create a map for quick employee lookup
      const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

      // Group attendance records by employee and date
      const groupedAttendance = new Map<string, {
        employeeId: string,
        employeeName: string,
        date: string,
        sessions: Array<{
          loginTime: Date | null,
          logoutTime: Date | null,
          duration: number
        }>,
        totalMinutes: number
      }>();

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        const employee = employeeMap.get(data.employeeId);
        
        if (employee) {
          const key = `${data.employeeId}-${data.date}`;
          
          const loginTime = data.checkInTime?.toDate ? data.checkInTime.toDate() : 
                           data.loginTime?.toDate ? data.loginTime.toDate() : 
                           (data.checkInTime || data.loginTime ? new Date(data.checkInTime || data.loginTime) : null);
          
          const logoutTime = data.checkOutTime?.toDate ? data.checkOutTime.toDate() : 
                            data.logoutTime?.toDate ? data.logoutTime.toDate() : 
                            (data.checkOutTime || data.logoutTime ? new Date(data.checkOutTime || data.logoutTime) : null);

          const duration = data.totalMinutes || data.duration || 0;

          if (!groupedAttendance.has(key)) {
            groupedAttendance.set(key, {
              employeeId: employee.employeeId,
              employeeName: employee.name,
              date: data.date,
              sessions: [],
              totalMinutes: 0
            });
          }

          const group = groupedAttendance.get(key)!;
          group.sessions.push({
            loginTime,
            logoutTime,
            duration
          });
          group.totalMinutes += duration;
        }
      });

      // Convert grouped data to table rows
      const attendanceRows: AttendanceTableRow[] = [];
      
      groupedAttendance.forEach((group, key) => {
        attendanceRows.push({
          id: key,
          employeeId: group.employeeId,
          employeeName: group.employeeName,
          date: group.date,
          totalMinutes: group.totalMinutes,
          totalHours: formatTime(group.totalMinutes)
        });
      });

      // Sort by employee name and date
      attendanceRows.sort((a, b) => {
        const nameCompare = a.employeeName.localeCompare(b.employeeName);
        if (nameCompare !== 0) return nameCompare;
        return a.date.localeCompare(b.date);
      });

      setAttendanceData(attendanceRows);
      setFilteredData(attendanceRows);
      console.log('Fetched', attendanceRows.length, 'attendance records');
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on date selection - show all days by default
  useEffect(() => {
    if (selectedDate) {
      const filtered = attendanceData.filter(record => record.date === selectedDate);
      setFilteredData(filtered);
    } else {
      // Show all data when no filter is selected
      setFilteredData(attendanceData);
    }
  }, [attendanceData, selectedDate]);

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = ['Employee ID', 'Employee Name', 'Date', 'Total Hours'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => 
        [record.employeeId, record.employeeName, record.date, record.totalHours].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = selectedDate 
      ? `attendance-report-${selectedDate}.csv`
      : `attendance-report-all-dates.csv`;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate statistics for displayed data
  const getStats = () => {
    if (filteredData.length === 0) return null;
    
    const totalEmployees = filteredData.length;
    const totalMinutes = filteredData.reduce((sum, record) => sum + record.totalMinutes, 0);
    const avgMinutes = totalMinutes / totalEmployees;
    
    // Get unique dates count
    const uniqueDates = [...new Set(filteredData.map(r => r.date))];
    
    return {
      totalEmployees,
      totalHours: formatTime(totalMinutes),
      avgHours: formatTime(avgMinutes),
      maxHours: Math.max(...filteredData.map(r => r.totalMinutes)),
      minHours: Math.min(...filteredData.map(r => r.totalMinutes)),
      dateCount: uniqueDates.length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading attendance data...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="text-blue-600" />
              Employee Attendance Report
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedDate ? `Showing attendance for ${selectedDate}` : 'Showing all attendance records'}
            </p>
          </div>
          
          {/* Filter and Export Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-500" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Show All
                </button>
              )}
            </div>
            
            {filteredData.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="text-blue-600 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Clock className="text-green-600 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <BarChart3 className="text-purple-600 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Calendar className="text-orange-600 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {selectedDate ? 'Selected Date' : 'Total Records'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedDate || stats.dateCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedDate 
              ? `Attendance Records for ${selectedDate}` 
              : 'All Attendance Records'
            }
          </h3>
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} 
            {selectedDate ? ` for ${selectedDate}` : ' across all dates'}
          </p>
        </div>
        
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record, index) => (
                  <tr key={record.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Clock size={16} className="mr-2" />
                        {record.totalHours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDate 
                ? `No employees worked on ${selectedDate}` 
                : 'No attendance data available in the system'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeOverview;