import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Employee } from '../../types';
import { Plus, Search, Edit, UserCheck, UserX, Users, Trash2 } from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import EmployeeDetails from './EmployeeDetails';

import companyLogo from '../../assets/company-logo.png';
const COMPANY_NAME = "Hirush Global LLP";
const COMPANY_LOCATION = { lat: 11.2658, lon: 75.7707 };

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const employeeList: Employee[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        employeeList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Employee);
      });
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        isActive: !currentStatus
      });
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'employees', employeeToDelete.id));
      await fetchEmployees();
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const cancelDeleteEmployee = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.employeeId && employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.role && employee.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show employee details if viewing a specific employee
  if (viewingEmployeeId) {
    return (
      <EmployeeDetails
        employeeId={viewingEmployeeId}
        onBack={() => setViewingEmployeeId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center space-x-4 bg-blue-700 rounded-lg p-6 mb-4">
        <img src={companyLogo} alt="Company Logo" className="w-16 h-16 rounded-full bg-white p-2" />
        <div>
          <h1 className="text-3xl font-bold text-white">{COMPANY_NAME}</h1>
          <p className="text-blue-100 text-sm">Location: {COMPANY_LOCATION.lat}, {COMPANY_LOCATION.lon}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Working Hours</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {employee.employeeId || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => setViewingEmployeeId(employee.id)}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors text-left"
                      >
                        {employee.name}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{employee.email}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      employee.role === 'intern' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : 'Employee'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {employee.workingHours ? (
                      <div className="text-sm text-gray-600">
                        <div>{employee.workingHours.startTime} - {employee.workingHours.endTime}</div>
                        <div className="text-xs text-gray-500">
                          {employee.workingHours.totalHoursPerDay}h/day • {employee.workingHours.totalHoursPerWeek}h/week
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}
                        className={`p-2 rounded-lg transition-all ${
                          employee.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={employee.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {employee.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Employee"
                        onClick={() => { setSelectedEmployee(employee); setShowEditModal(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Employee"
                        onClick={() => handleDeleteEmployee(employee)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onEmployeeAdded={fetchEmployees}
          onEmployeeCreated={(employeeId) => {
            setShowAddModal(false);
            setViewingEmployeeId(employeeId);
          }}
        />
      )}

      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => { setShowEditModal(false); setSelectedEmployee(null); }}
          onEmployeeUpdated={fetchEmployees}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Delete Employee
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{employeeToDelete.name}</strong>? 
              This action cannot be undone and the employee will no longer be able to access their account.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteEmployee}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;