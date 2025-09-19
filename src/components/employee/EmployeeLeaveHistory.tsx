import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const EmployeeLeaveHistory: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaveHistory();
  }, [user]);

  const fetchLeaveHistory = async () => {
    if (!user?.uid) return;

    try {
      const leavesRef = collection(db, 'leaves');
      const q = query(
        leavesRef,
        where('employeeId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const leaveData: LeaveRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaveData.push({
          id: doc.id,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          description: data.description || '',
          status: data.status,
          createdAt: data.createdAt
        });
      });
      
      setLeaves(leaveData);
    } catch (error) {
      console.error('Error fetching leave history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">My Leave History</h2>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
          <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {leave.startDate} - {leave.endDate}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(leave.status)}
                      <span className={getStatusBadge(leave.status)}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {leave.reason}
                    </h3>
                    {leave.description && (
                      <p className="text-gray-600 text-sm">
                        {leave.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      Submitted on {leave.createdAt ? new Date(leave.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveHistory;