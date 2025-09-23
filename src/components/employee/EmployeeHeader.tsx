import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendanceTracking } from '../../hooks/useAttendanceTracking';
import { 
  User, 
  Clock,
  LogIn,
  LogOut,
  Timer
} from 'lucide-react';

const EmployeeHeader: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isCheckedIn, workingTime, loading, checkIn, checkOut } = useAttendanceTracking();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="shadow-sm border-b-2" style={{ background: '#102e50', borderColor: '#FFB74D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ background: '#FFB74D' }}>
              <User className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#102e50' }} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#fff' }}>Employee Portal</h1>
              <p className="text-xs sm:text-sm opacity-80" style={{ color: '#FFB74D' }}>
                Welcome back, {user?.name || 'Employee'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Attendance Tracking Buttons */}
            <div className="flex items-center space-x-2">
              {!isCheckedIn ? (
                <button
                  onClick={checkIn}
                  disabled={loading}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#4CAF50', color: 'white' }}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Check In</span>
                  <span className="sm:hidden">In</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
                    <Timer className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{workingTime}</span>
                    <span className="sm:hidden">{workingTime.split(':').slice(0, 2).join(':')}</span>
                  </div>
                  <button
                    onClick={checkOut}
                    disabled={loading}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#f44336', color: 'white' }}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Check Out</span>
                    <span className="sm:hidden">Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current Time */}
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium flex items-center justify-end" style={{ color: '#fff' }}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">{currentTime.toLocaleTimeString()}</span>
                <span className="sm:hidden">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </p>
              <p className="text-xs opacity-80" style={{ color: '#FFB74D' }}>
                {currentTime.toLocaleDateString([], {month: 'short', day: 'numeric'})}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ background: '#FFB74D' }}>
              <span className="text-xs sm:text-sm font-bold" style={{ color: '#102e50' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EmployeeHeader;