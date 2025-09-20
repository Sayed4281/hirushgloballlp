import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          if (firebaseUser.email === 'hirush@admin.com') {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'admin',
              name: 'Admin'
            });
          } else {
            // Get employee data from Firestore
            const employeeDoc = await getDoc(doc(db, 'employees', firebaseUser.uid));
            if (employeeDoc.exists() && firebaseUser.email) {
              const employeeData = employeeDoc.data();
              
              // Check if employee is active
              if (employeeData.isActive === false) {
                // Employee is inactive, sign them out
                await firebaseSignOut(auth);
                throw new Error('Your account has been deactivated. Please contact your administrator.');
              }
              
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: employeeData.role || 'employee',
                name: employeeData.name,
                username: employeeData.username,
                workingHours: employeeData.workingHours
              });
            } else {
              // Employee not found in database
              await firebaseSignOut(auth);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // If not admin, check if employee is active
    if (email !== 'hirush@admin.com') {
      const employeeDoc = await getDoc(doc(db, 'employees', userCredential.user.uid));
      if (employeeDoc.exists()) {
        const employeeData = employeeDoc.data();
        if (employeeData.isActive === false) {
          // Sign out immediately if inactive
          await firebaseSignOut(auth);
          throw new Error('Your account has been deactivated. Please contact your administrator.');
        }
      } else {
        // Employee not found in database
        await firebaseSignOut(auth);
        throw new Error('Employee account not found. Please contact your administrator.');
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};