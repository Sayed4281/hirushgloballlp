import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { 
  User, 
  Clock, 
  PlayCircle, 
  PauseCircle, 
  Timer,
  AlertCircle 
} from 'lucide-react';

const EmployeeHeader: React.FC = () => {
  const { user } = useAuth();
  const { 
    isCheckedIn, 
    currentSession, 
    loading, 
    error, 
    checkIn, 
    checkOut, 
    getCurrentSessionDuration,
    formatDuration,
    totalHoursToday
  } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Employee Portal</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Attendance Controls */}
            <div className="flex items-center space-x-4">
              {/* Check In/Out Button */}
              <div className="text-center">
                {!isCheckedIn ? (
                  <button
                    onClick={checkIn}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{loading ? 'Checking In...' : 'Check In'}</span>
                  </button>
                ) : (
                  <button
                    onClick={checkOut}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>{loading ? 'Checking Out...' : 'Check Out'}</span>
                  </button>
                )}
              </div>

              {/* Session Status */}
              <div className="text-right bg-gray-50 rounded-lg px-3 py-2">
                {isCheckedIn && currentSession ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatDuration(getCurrentSessionDuration())}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Since: {currentSession.loginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <PauseCircle className="w-4 h-4" />
                    <span className="text-sm">Not Working</span>
                  </div>
                )}
              </div>

              {/* Daily Total */}
              <div className="text-right bg-blue-50 rounded-lg px-3 py-2">
                <div className="text-sm font-medium text-blue-900">
                  {formatDuration((totalHoursToday * 60) + (isCheckedIn ? getCurrentSessionDuration() : 0))}
                </div>
                <div className="text-xs text-blue-700">
                  Today's Total
                </div>
              </div>
            </div>

            {/* Current Time */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-600">
                {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="pb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default EmployeeHeader;