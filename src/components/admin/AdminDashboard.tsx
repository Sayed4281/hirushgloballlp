import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Users, MessageSquare, Calendar, BarChart3, FileText } from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';
import AttendanceView from './AttendanceView';
import MessageCenter from './MessageCenter';
import AdminLeavePage from './AdminLeavePage';
import AdminHeader from './AdminHeader';

type TabType = 'employees' | 'attendance' | 'leaves' | 'messages' | 'reports';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const { signOut } = useAuth();

  const tabs = [
    { id: 'employees' as TabType, label: 'Employees', icon: Users },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Calendar },
    { id: 'leaves' as TabType, label: 'Leave Requests', icon: FileText },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeManagement />;
      case 'attendance':
        return <AttendanceView />;
      case 'leaves':
        return <AdminLeavePage />;
      case 'messages':
        return <MessageCenter />;
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports</h2>
            <p className="text-gray-600">Reports functionality coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
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

export default AdminDashboard;