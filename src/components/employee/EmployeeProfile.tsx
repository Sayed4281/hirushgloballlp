import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Employee } from '../../types';
import { 
  User, 
  Mail, 
  FileText, 
  Calendar, 
  Shield, 
  Clock, 
  Briefcase, 
  Badge,
  Timer,
  CalendarDays,
  Building
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const EmployeeProfile: React.FC = () => {
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    if (!user) return;

    try {
      const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        setEmployeeData({
          id: employeeDoc.id,
          employeeId: data.employeeId,
          name: data.name,
          email: data.email,
          username: data.username,
          role: data.role,
          workingHours: data.workingHours,
          idProof: data.idProof,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          isActive: data.isActive
        } as Employee);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Employee data not found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow-md p-4 sm:p-6" style={{ background: '#fff' }}>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: '#102e50' }}>Profile Information</h2>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 pb-4 sm:pb-6 border-b-2" style={{ borderColor: '#FFB74D' }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center" style={{ background: '#FFB74D' }}>
            <User className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#102e50' }} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#102e50' }}>{employeeData.name}</h3>
            <p className="text-sm sm:text-base opacity-80" style={{ color: '#102e50' }}>{employeeData.username}</p>
            {employeeData.employeeId && (
              <p className="text-xs sm:text-sm font-mono px-2 py-1 rounded mt-1 inline-block" style={{ background: '#FFB74D', color: '#102e50' }}>
                {employeeData.employeeId}
              </p>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
              employeeData.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {employeeData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Basic Information */}
          <div className="space-y-4 sm:space-y-6">
            <h4 className="text-base sm:text-lg font-semibold flex items-center" style={{ color: '#102e50' }}>
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: '#FFB74D' }} />
              Basic Information
            </h4>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                <div>
                  <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Email Address</p>
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>{employeeData.email}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                <div>
                  <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Username</p>
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>{employeeData.username}</p>
                </div>
              </div>

              {employeeData.employeeId && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Badge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Employee ID</p>
                    <p className="font-medium font-mono text-sm sm:text-base" style={{ color: '#102e50' }}>{employeeData.employeeId}</p>
                  </div>
                </div>
              )}

              {employeeData.role && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Role</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employeeData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      employeeData.role === 'intern' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {employeeData.role.charAt(0).toUpperCase() + employeeData.role.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                <div>
                  <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Joined Date</p>
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>{formatDate(employeeData.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                <div>
                  <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Account Status</p>
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>
                    {employeeData.isActive ? 'Active Employee' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours Information */}
          <div className="space-y-4 sm:space-y-6">
            <h4 className="text-base sm:text-lg font-semibold flex items-center" style={{ color: '#102e50' }}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: '#FFB74D' }} />
              Working Hours
            </h4>
            
            {employeeData.workingHours ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Daily Schedule</p>
                    <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>
                      {employeeData.workingHours.startTime} - {employeeData.workingHours.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Working Days</p>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-6 sm:ml-8">
                    {employeeData.workingHours.workingDays.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{ background: '#FFB74D', color: '#102e50' }}
                      >
                        {day.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Hours per Day</p>
                    <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>{employeeData.workingHours.totalHoursPerDay} hours</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs sm:text-sm opacity-70" style={{ color: '#102e50' }}>Hours per Week</p>
                    <p className="font-medium text-sm sm:text-base" style={{ color: '#102e50' }}>{employeeData.workingHours.totalHoursPerWeek} hours</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm sm:text-base italic opacity-70" style={{ color: '#102e50' }}>
                Working hours not configured
              </div>
            )}
          </div>
        </div>

        {/* Company Information */}
        <div className="pt-4 sm:pt-6 border-t-2" style={{ borderColor: '#FFB74D' }}>
          <h4 className="text-base sm:text-lg font-semibold flex items-center mb-3 sm:mb-4" style={{ color: '#102e50' }}>
            <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: '#FFB74D' }} />
            Company Information
          </h4>
          
          <div className="rounded-lg p-3 sm:p-4" style={{ background: '#f8f9fa', border: '2px solid #FFB74D' }}>
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FFB74D' }} />
              <div>
                <p className="font-semibold text-sm sm:text-base" style={{ color: '#102e50' }}>Hirush Global LLP</p>
                <p className="text-xs sm:text-sm opacity-80" style={{ color: '#102e50' }}>Technology Solutions & Services</p>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default EmployeeProfile;