import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Helper function to safely convert Firestore timestamp to Date
const convertTimestampToDate = (timestamp: any): Date => {
  try {
    if (timestamp instanceof Date) {
      return timestamp;
    } else if (timestamp && typeof timestamp === 'object') {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      } else if (timestamp.seconds && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
      }
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
  } catch (error) {
    console.error('Error converting timestamp:', error);
  }
  return new Date(); // Fallback to current date
};

const AdminLeavePage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLeaves();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting to fetch leaves...');
      
      if (!db) {
        throw new Error('Database connection not available');
      }

      // Try to access both 'leaves' and 'leaveRequests' collections
      const leavesRef = collection(db, 'leaves');
      const leaveRequestsRef = collection(db, 'leaveRequests');
      console.log('Created collection references');
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(leavesRef);
        console.log('Total documents found in leaves collection:', querySnapshot.size);
      } catch (leavesError) {
        console.log('Error accessing leaves collection, trying leaveRequests:', leavesError);
        querySnapshot = await getDocs(leaveRequestsRef);
        console.log('Total documents found in leaveRequests collection:', querySnapshot.size);
      }
      
      const leaveList: Leave[] = [];
      
      if (querySnapshot && querySnapshot.size > 0) {
        querySnapshot.forEach((docSnap) => {
          try {
            const data = docSnap.data();
            console.log('Document ID:', docSnap.id);
            console.log('Document fields:', {
              employeeId: data.employeeId,
              employeeName: data.employeeName,
              startDate: data.startDate,
              endDate: data.endDate,
              status: data.status,
              reason: data.reason
            });
            
            // More flexible validation - handle different data structures
            const employeeId = data.employeeId || data.userId || '';
            const employeeName = data.employeeName || data.name || data.employeeName || 'Unknown Employee';
            const startDate = data.startDate || data.fromDate || '';
            const endDate = data.endDate || data.toDate || '';
            
            if (employeeId && startDate && endDate) {
              // Handle createdAt timestamp properly using helper function
              const rawTimestamp = data.createdAt || data.requestedAt || data.submittedAt;
              const processedCreatedAt = convertTimestampToDate(rawTimestamp);

              leaveList.push({
                id: docSnap.id,
                employeeId,
                employeeName,
                startDate,
                endDate,
                reason: data.reason || data.leaveType || 'No reason provided',
                description: data.description || data.notes || '',
                status: data.status || 'pending',
                createdAt: processedCreatedAt
              });
            } else {
              console.warn('Skipping document with missing required fields:', docSnap.id, {
                employeeId, employeeName, startDate, endDate
              });
            }
          } catch (docError) {
            console.error('Error processing document:', docSnap.id, docError);
          }
        });
      }
      
      console.log('Total leaves processed:', leaveList.length);
      setLeaves(leaveList);
    } catch (err: any) {
      console.error('Error fetching leaves:', err);
      setError(err.message || 'Failed to fetch leave requests. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      // Try both collections to update the status
      try {
        await updateDoc(doc(db, 'leaves', leaveId), { status });
      } catch (leavesError) {
        console.log('Error updating in leaves collection, trying leaveRequests:', leavesError);
        await updateDoc(doc(db, 'leaveRequests', leaveId), { status });
      }
      await fetchLeaves(); // Refresh the list
    } catch (err) {
      console.error('Error updating leave status:', err);
      setError('Failed to update leave status. Please check your permissions.');
    }
  };

  // Add early return if there's no user or if it's loading
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Employee Leave Requests</h2>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-center">
          <XCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {!loading && !error && leaves.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
          <p className="text-gray-500">No employee leave requests have been submitted yet.</p>
        </div>
      )}

      {!loading && !error && leaves.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{leave.employeeName}</div>
                      <div className="text-sm text-gray-500">ID: {leave.employeeId}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {leave.startDate} - {leave.endDate}
                        </span>
                      </div>
                      {leave.createdAt && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Applied: {(() => {
                              try {
                                if (leave.createdAt instanceof Date) {
                                  return leave.createdAt.toLocaleDateString();
                                }
                                return 'Date not available';
                              } catch (error) {
                                console.error('Error formatting createdAt date:', error);
                                return 'Date not available';
                              }
                            })()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">{leave.reason}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-600 truncate" title={leave.description}>
                          {leave.description || 'No description provided'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {leave.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {leave.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                        {leave.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            onClick={() => updateLeaveStatus(leave.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            onClick={() => updateLeaveStatus(leave.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="text-sm text-gray-400">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeavePage;
