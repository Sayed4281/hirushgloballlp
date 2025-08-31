import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import AdminDashboard from './admin/AdminDashboard';
import EmployeeDashboard from './employee/EmployeeDashboard';
import LoadingSpinner from './LoadingSpinner';

const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginForm />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
};

export default AppRouter;