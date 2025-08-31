import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Employee } from '../../types';
import { User, Mail, FileText, Calendar, Shield } from 'lucide-react';
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
          name: data.name,
          email: data.email,
          username: data.username,
          idProof: data.idProof,
          createdAt: data.createdAt.toDate(),
          isActive: data.isActive
        });
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
      
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{employeeData.name}</h3>
            <p className="text-gray-600">{employeeData.username}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{employeeData.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium text-gray-900">{employeeData.username}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Joined Date</p>
                <p className="font-medium text-gray-900">{formatDate(employeeData.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="font-medium text-gray-900">
                  {employeeData.isActive ? 'Active Employee' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default EmployeeProfile;