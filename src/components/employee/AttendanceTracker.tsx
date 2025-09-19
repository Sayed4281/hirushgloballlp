import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react';

const AttendanceTracker: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Information Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome Message */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Welcome</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">Employee</p>
                  <p className="font-semibold text-blue-900">
                    {user?.name || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Date */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Today</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Date</p>
                  <p className="font-semibold text-green-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Time */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Time</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">Current Time</p>
                  <p className="font-semibold text-purple-900">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900">Information</h3>
            <p className="text-yellow-800">
              This is your employee dashboard. Use the navigation menu to access different features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;