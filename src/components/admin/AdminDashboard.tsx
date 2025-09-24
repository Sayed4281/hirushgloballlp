import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Users, MessageSquare, Calendar, FileText, BarChart3 } from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';
import AttendanceView from './AttendanceView';
import MessageCenter from './MessageCenter';
import AdminHeader from './AdminHeader';
import AdminLeavePage from './AdminLeavePage';
import EmployeeOverview from './EmployeeOverview';

type TabType = 'overview' | 'employees' | 'attendance' | 'messages' | 'leave';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { signOut } = useAuth();

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'employees' as TabType, label: 'Employees', icon: Users },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Calendar },
    { id: 'leave' as TabType, label: 'Leave Management', icon: FileText },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <EmployeeOverview />;
      case 'employees':
        return <EmployeeManagement />;
      case 'attendance':
        return <AttendanceView />;
      case 'leave':
        return <AdminLeavePage />;
      case 'messages':
        return <MessageCenter />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: '#f8f9fa' }}>
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="w-full xl:w-64 flex-shrink-0 hidden xl:block">
            <div className="rounded-lg shadow-md p-3 sm:p-4" style={{ background: '#fff' }}>
              <nav className="space-y-1 sm:space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-all text-sm sm:text-base ${
                        activeTab === tab.id
                          ? 'border-2'
                          : 'hover:opacity-80'
                      }`}
                      style={activeTab === tab.id ? {
                        background: '#FFB74D',
                        color: '#102e50',
                        borderColor: '#102e50'
                      } : {
                        background: '#f8f9fa',
                        color: '#102e50'
                      }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t-2" style={{ borderColor: '#FFB74D' }}>
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-center xl:justify-start space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-sm sm:text-base hover:opacity-80"
                  style={{ background: '#102e50', color: '#fff' }}
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="w-full">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 xl:hidden border-t-2 shadow-lg" style={{ background: '#102e50', borderColor: '#FFB74D' }}>
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                  activeTab === tab.id ? 'opacity-100' : 'opacity-60'
                }`}
                style={{ color: activeTab === tab.id ? '#FFB74D' : '#fff' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sign Out Overlay */}
      <div className="xl:hidden fixed top-4 right-4 z-10">
        <button
          onClick={signOut}
          className="p-2 rounded-lg shadow-lg transition-all hover:opacity-80"
          style={{ background: '#102e50', color: '#fff' }}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;