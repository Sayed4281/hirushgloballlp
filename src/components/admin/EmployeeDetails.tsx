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
  Activity
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Login Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Logout Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{record.date}</td>
                        <td className="py-4 px-4">{record.loginTime.toLocaleTimeString()}</td>
                        <td className="py-4 px-4">{record.logoutTime?.toLocaleTimeString() || 'Still working'}</td>
                        <td className="py-4 px-4">
                          {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : 'In progress'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceRecords.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    No attendance records found
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