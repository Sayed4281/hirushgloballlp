import React, { useState } from 'react';
import companyLogo from '../assets/company-logo.png';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle, LogIn } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ background: '#102e50' }}>
      <div className="max-w-md w-full rounded-2xl shadow-xl p-6 sm:p-8" style={{ background: '#fff' }}>
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 bg-white border-2 shadow-lg" style={{ borderColor: '#FFB74D' }}>
            <img src={companyLogo} alt="Company Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#FFB74D' }}>Hirush Global LLP</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: '#102e50' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center space-x-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#102e50' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm sm:text-base"
                style={{ 
                  background: '#fff', 
                  color: '#102e50',
                  borderColor: '#FFB74D',
                  focusRingColor: '#FFB74D'
                }}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#102e50' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFB74D' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="Enter your password"
                style={{ 
                  background: '#fff', 
                  color: '#102e50',
                  borderColor: '#FFB74D'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 sm:py-3 rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center space-x-2"
            style={{ background: '#FFB74D', color: '#102e50' }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;