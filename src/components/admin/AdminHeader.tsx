import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Clock } from 'lucide-react';

const AdminHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="shadow-sm border-b-2" style={{ background: '#102e50', borderColor: '#FFB74D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ background: '#FFB74D' }}>
              <Shield className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#102e50' }} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#fff' }}>Admin Dashboard</h1>
              <p className="text-xs sm:text-sm opacity-80" style={{ color: '#FFB74D' }}>Hirush Global LLP</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium" style={{ color: '#fff' }}>{user?.name || 'Admin User'}</p>
              <p className="text-xs opacity-80" style={{ color: '#FFB74D' }}>
                Administrator
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ background: '#FFB74D' }}>
              <span className="text-xs sm:text-sm font-bold" style={{ color: '#102e50' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;