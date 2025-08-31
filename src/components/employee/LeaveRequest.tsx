import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveRequest as LeaveRequestType } from '../../types';
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const LeaveRequest: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLeaveRequests();
    }
  }, [user]);

  const fetchLeaveRequests = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'leaves'),
        where('employeeId', '==', user.uid),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests: LeaveRequestType[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          reason: data.reason,
          status: data.status,
          requestedAt: data.requestedAt.toDate(),
          respondedAt: data.respondedAt ? data.respondedAt.toDate() : undefined,
          adminNote: data.adminNote
        });
      });
      
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (startDate > endDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      if (startDate < new Date()) {
        setError('Start date cannot be in the past');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'leaves'), {
        employeeId: user.uid,
        employeeName: user.name || 'Employee',
        startDate,
        endDate,
        reason: formData.reason,
        status: 'pending',
        requestedAt: new Date()
      });

      setSuccess('Leave request submitted successfully!');
      setFormData({ startDate: '', endDate: '', reason: '' });
      await fetchLeaveRequests();
    } catch (error: any) {
      setError(error.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
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

  return (
    <div className="space-y-6">
      {/* Leave Request Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for Leave</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Please explain the reason for your leave request..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FileText className="w-5 h-5" />
            <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </form>
      </div>

      {/* Leave Request History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Request History</h2>
        
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Requested on {formatDate(request.requestedAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(request.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">{request.reason}</p>
              </div>

              {request.adminNote && (
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600 mb-1">Admin Note:</p>
                  <p className="text-sm text-gray-800 bg-blue-50 p-2 rounded">{request.adminNote}</p>
                </div>
              )}
            </div>
          ))}

          {leaveRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave requests submitted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;