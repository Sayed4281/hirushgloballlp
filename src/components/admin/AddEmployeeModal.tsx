import React, { useState, useEffect } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { X, User, Mail, Key, FileText, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { generateEmployeeId, getDefaultWorkingHours, type EmployeeRole } from '../../utils/employeeUtils';

interface AddEmployeeModalProps {
  onClose: () => void;
  onEmployeeAdded: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onEmployeeAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'employee' as EmployeeRole
  });
  
  const [workingHours, setWorkingHours] = useState(getDefaultWorkingHours('employee'));
  const [previewEmployeeId, setPreviewEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Update working hours when role changes
  useEffect(() => {
    setWorkingHours(getDefaultWorkingHours(formData.role));
    generatePreviewId();
  }, [formData.role]);

  const generatePreviewId = async () => {
    try {
      const id = await generateEmployeeId(formData.role);
      setPreviewEmployeeId(id);
    } catch (error) {
      console.error('Error generating preview ID:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleWorkingHoursChange = (field: string, value: string | number | string[]) => {
    setWorkingHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate the actual employee ID
      const employeeId = await generateEmployeeId(formData.role);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Add employee to Firestore with the auth UID as document ID
      await setDoc(doc(db, 'employees', userCredential.user.uid), {
        employeeId,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        workingHours,
        createdAt: serverTimestamp(),
        isActive: true
      });

      setSuccess(true);
      setTimeout(() => {
        onEmployeeAdded();
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Employee Added Successfully!</h3>
          <p className="text-gray-600 mb-2">Employee ID: <span className="font-semibold text-blue-600">{previewEmployeeId}</span></p>
          <p className="text-gray-600">The employee has been created and can now log in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Add New Employee</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preview Employee ID */}
          {previewEmployeeId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Employee ID Preview:</span> 
                <span className="font-bold ml-2">{previewEmployeeId}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as EmployeeRole }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="intern">Intern</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Working Hours Configuration */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Working Hours Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={workingHours.startTime}
                  onChange={e => setWorkingHours(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={workingHours.endTime}
                  onChange={e => setWorkingHours(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Per Day
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={workingHours.totalHoursPerDay}
                  onChange={e => setWorkingHours(prev => ({ ...prev, totalHoursPerDay: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Per Week
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="60"
                  value={workingHours.totalHoursPerWeek}
                  onChange={e => setWorkingHours(prev => ({ ...prev, totalHoursPerWeek: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={workingHours.workingDays.includes(day)}
                      onChange={e => {
                        if (e.target.checked) {
                          setWorkingHours(prev => ({ ...prev, workingDays: [...prev.workingDays, day] }));
                        } else {
                          setWorkingHours(prev => ({ ...prev, workingDays: prev.workingDays.filter(d => d !== day) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;