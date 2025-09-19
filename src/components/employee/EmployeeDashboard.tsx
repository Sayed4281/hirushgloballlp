import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Clock, Calendar, MessageSquare, User, CalendarDays, FileText, History } from 'lucide-react';
import AttendanceTracker from './AttendanceTracker';
import EmployeeAttendanceHistory from './EmployeeAttendanceHistory';
import EmployeeMessages from './EmployeeMessages';
import EmployeeProfile from './EmployeeProfile';
import EmployeeCalendar from './EmployeeCalendar';
import LeaveRequest from './LeaveRequest';
import EmployeeLeaveHistory from './EmployeeLeaveHistory';
import EmployeeHeader from './EmployeeHeader';

type TabType = 'attendance' | 'history' | 'calendar' | 'messages' | 'profile' | 'leave' | 'leaveHistory';

const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const { signOut } = useAuth();

  const tabs = [
    { id: 'attendance' as TabType, label: 'Attendance', icon: Clock },
    { id: 'history' as TabType, label: 'History', icon: Calendar },
    { id: 'calendar' as TabType, label: 'Calendar', icon: CalendarDays },
    { id: 'leave' as TabType, label: 'Leave Request', icon: FileText },
    { id: 'leaveHistory' as TabType, label: 'My Leaves', icon: History },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceTracker />;
      case 'history':
        return <EmployeeAttendanceHistory />;
      case 'calendar':
        return <EmployeeCalendar />;
      case 'leave':
        return <LeaveRequest />;
      case 'leaveHistory':
        return <EmployeeLeaveHistory />;
      case 'messages':
        return <EmployeeMessages />;
      case 'profile':
        return <EmployeeProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={signOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;