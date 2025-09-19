import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type EmployeeRole = 'admin' | 'employee' | 'intern';

// Generate employee ID based on role
export const generateEmployeeId = async (role: EmployeeRole): Promise<string> => {
  try {
    let prefix = '';
    switch (role) {
      case 'admin':
        prefix = 'HRG-ADM';
        break;
      case 'employee':
        prefix = 'HRG-EMP';
        break;
      case 'intern':
        prefix = 'HRG-INT';
        break;
      default:
        prefix = 'HRG-EMP';
    }

    // Get the last employee with the same role to determine the next number
    const employeesRef = collection(db, 'employees');
    const q = query(
      employeesRef,
      where('role', '==', role),
      orderBy('employeeId', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let nextNumber = 1;

    if (!querySnapshot.empty) {
      const lastEmployee = querySnapshot.docs[0].data();
      const lastEmployeeId = lastEmployee.employeeId as string;
      
      if (lastEmployeeId && lastEmployeeId.startsWith(prefix)) {
        // Extract the number from the last ID
        const lastNumber = parseInt(lastEmployeeId.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    // Format the number with leading zeros (001, 002, etc.)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${formattedNumber}`;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // Fallback to timestamp-based ID if there's an error
    const timestamp = Date.now().toString().slice(-3);
    const prefix = role === 'admin' ? 'HRG-ADM' : role === 'intern' ? 'HRG-INT' : 'HRG-EMP';
    return `${prefix}-${timestamp}`;
  }
};

// Validate employee ID format
export const validateEmployeeId = (employeeId: string): boolean => {
  const validFormats = [
    /^HRG-ADM-\d{3}$/,  // HRG-ADM-001
    /^HRG-EMP-\d{3}$/,  // HRG-EMP-001  
    /^HRG-INT-\d{3}$/   // HRG-INT-001
  ];
  
  return validFormats.some(format => format.test(employeeId));
};

// Get role from employee ID
export const getRoleFromEmployeeId = (employeeId: string): EmployeeRole => {
  if (employeeId.startsWith('HRG-ADM')) return 'admin';
  if (employeeId.startsWith('HRG-INT')) return 'intern';
  return 'employee';
};

// Default working hours templates
export const getDefaultWorkingHours = (role: EmployeeRole) => {
  const baseWorkingHours = {
    startTime: '09:00',
    endTime: '17:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    totalHoursPerDay: 8,
    totalHoursPerWeek: 40
  };

  switch (role) {
    case 'admin':
      return {
        ...baseWorkingHours,
        startTime: '08:30',
        endTime: '17:30',
        totalHoursPerDay: 8.5,
        totalHoursPerWeek: 42.5
      };
    case 'intern':
      return {
        ...baseWorkingHours,
        startTime: '10:00',
        endTime: '16:00',
        totalHoursPerDay: 6,
        totalHoursPerWeek: 30
      };
    default:
      return baseWorkingHours;
  }
};