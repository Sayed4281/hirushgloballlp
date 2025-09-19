import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, User, Mail, FileText, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Employee } from '../../types';
import { EmployeeRole, generateEmployeeId, getDefaultWorkingHours } from '../../utils/employeeUtils';

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onEmployeeUpdated: () => void;
}

const roles: EmployeeRole[] = ['admin', 'employee', 'intern'];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, onClose, onEmployeeUpdated }) => {
  const originalRole = employee.role;
  
  const [formData, setFormData] = useState({
    name: employee.name || '',
    email: employee.email || '',
    username: employee.username || '',
    role: employee.role || 'employee' as EmployeeRole,
    isActive: employee.isActive !== undefined ? employee.isActive : true,
    workingHours: employee.workingHours || getDefaultWorkingHours('employee')
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as EmployeeRole;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      workingHours: getDefaultWorkingHours(newRole)
    }));
  };

  const handleWorkingTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
        totalHoursPerDay: calculateDailyHours(
          field === 'startTime' ? value : prev.workingHours.startTime,
          field === 'endTime' ? value : prev.workingHours.endTime
        ),
        totalHoursPerWeek: calculateWeeklyHours(
          field === 'startTime' ? value : prev.workingHours.startTime,
          field === 'endTime' ? value : prev.workingHours.endTime,
          prev.workingHours.workingDays.length
        )
      }
    }));
  };

  const handleWorkingDayToggle = (day: string) => {
    setFormData(prev => {
      const newWorkingDays = prev.workingHours.workingDays.includes(day)
        ? prev.workingHours.workingDays.filter(d => d !== day)
        : [...prev.workingHours.workingDays, day];
      
      return {
        ...prev,
        workingHours: {
          ...prev.workingHours,
          workingDays: newWorkingDays,
          totalHoursPerWeek: calculateWeeklyHours(
            prev.workingHours.startTime,
            prev.workingHours.endTime,
            newWorkingDays.length
          )
        }
      };
    });
  };

  const calculateDailyHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2023-01-01T${startTime}:00`);
    const end = new Date(`2023-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const calculateWeeklyHours = (startTime: string, endTime: string, workingDaysCount: number): number => {
    const dailyHours = calculateDailyHours(startTime, endTime);
    return dailyHours * workingDaysCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let newEmployeeId = employee.employeeId;
      
      if (originalRole !== formData.role) {
        newEmployeeId = await generateEmployeeId(formData.role);
      }

      await updateDoc(doc(db, 'employees', employee.id), {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive,
        employeeId: newEmployeeId,
        workingHours: formData.workingHours
      });
      
      setSuccess(true);
      setTimeout(() => {
        onEmployeeUpdated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Employee Updated Successfully!</h3>
          <p className="text-gray-600">The employee details have been updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Employee Details</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
                required
              >
                {roles.map(role => (
                  <option key={role} value={role} className="capitalize">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">Employee ID</p>
            <p className="text-lg font-semibold text-blue-900">
              {originalRole !== formData.role ? `New ID will be generated for ${formData.role}` : employee.employeeId}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Working Hours Configuration</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.workingHours.startTime}
                  onChange={(e) => handleWorkingTimeChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.workingHours.endTime}
                  onChange={(e) => handleWorkingTimeChange('endTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <label className="block text-sm font-medium text-gray-700">Working Days</label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weekDays.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.workingHours.workingDays.includes(day)}
                      onChange={() => handleWorkingDayToggle(day)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Hours Summary</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Hours:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formData.workingHours.totalHoursPerDay.toFixed(1)} hrs
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Working Days:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formData.workingHours.workingDays.length} days
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Weekly Hours:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formData.workingHours.totalHoursPerWeek.toFixed(1)} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Employee is Active</span>
            </label>
          </div>

          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
