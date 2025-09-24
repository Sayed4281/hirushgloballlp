import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
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
      console.log('Starting to fetch leaves for admin view...');
      
      if (!db) {
        throw new Error('Database connection not available');
      }

      // Try to access 'leaves' collection (same as employee page)
      const leavesRef = collection(db, 'leaves');
      console.log('Created collection reference for leaves');
      
      const querySnapshot = await getDocs(leavesRef);
      console.log('Total documents found in leaves collection:', querySnapshot.size);
      
      const leaveList: Leave[] = [];
      
      if (querySnapshot && querySnapshot.size > 0) {
        querySnapshot.forEach((docSnap) => {
          try {
            const data = docSnap.data();
            console.log('Processing admin document ID:', docSnap.id);
            console.log('Document data:', {
              employeeId: data.employeeId,
              employeeName: data.employeeName,
              startDate: data.startDate,
              endDate: data.endDate,
              status: data.status,
              reason: data.reason,
              description: data.description,
              requestedAt: data.requestedAt
            });
            
            // Use consistent field names with employee page
            const employeeId = data.employeeId;
            const employeeName = data.employeeName || 'Unknown Employee';
            
            if (employeeId && data.startDate && data.endDate) {
              // Convert Firebase timestamps to dates properly
              const startDate = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate);
              const endDate = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);
              const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(data.requestedAt || Date.now());

              leaveList.push({
                id: docSnap.id,
                employeeId,
                employeeName,
                startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                endDate: endDate.toISOString().split('T')[0],
                reason: data.reason || 'No reason provided',
                description: data.description || '',
                status: data.status || 'pending',
                createdAt: requestedAt
              });
            } else {
              console.warn('Skipping document with missing required fields:', docSnap.id, {
                employeeId, startDate: data.startDate, endDate: data.endDate
              });
            }
          } catch (docError) {
            console.error('Error processing document:', docSnap.id, docError);
          }
        });
      }
      
      // Sort by request date (newest first)
      leaveList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('Total leaves processed for admin:', leaveList.length);
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
      console.log(`Updating leave ${leaveId} to status: ${status}`);
      
      // Update in leaves collection with additional fields
      await updateDoc(doc(db, 'leaves', leaveId), { 
        status,
        respondedAt: new Date(),
        adminNote: status === 'approved' ? 'Leave approved by admin' : 'Leave rejected by admin'
      });
      
      console.log('Leave status updated successfully');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Employee Leave Requests</h2>
        </div>
        <button
          onClick={fetchLeaves}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
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
