import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

const AdminLeavePage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'leaves'));
      const leaveList: Leave[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        leaveList.push({
          id: docSnap.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          status: data.status
        });
      });
      setLeaves(leaveList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId: string, status: string) => {
    await updateDoc(doc(db, 'leaves', leaveId), { status });
    fetchLeaves();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Leave Requests</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-center">{error}</div>}
      {!loading && !error && leaves.length === 0 && (
        <div className="text-center py-12 text-gray-600">No leave requests found.</div>
      )}
      {!loading && !error && leaves.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left">Employee</th>
              <th className="py-3 px-4 text-left">Dates</th>
              <th className="py-3 px-4 text-left">Reason</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id} className="border-b border-gray-100">
                <td className="py-4 px-4">{leave.employeeName}</td>
                <td className="py-4 px-4">{leave.startDate} - {leave.endDate}</td>
                <td className="py-4 px-4">{leave.reason}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {leave.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        onClick={() => updateLeaveStatus(leave.id, 'approved')}
                      >Approve</button>
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        onClick={() => updateLeaveStatus(leave.id, 'rejected')}
                      >Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminLeavePage;
