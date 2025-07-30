import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { 
    register, 
    handleSubmit,
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login for:', data.email);
      await login(data.email, data.password);
      
      // The AuthContext will handle the redirect based on user role
      // We don't need to manually navigate here
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message === 'Invalid login credentials' 
        ? 'Invalid email or password'
        : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fade-in relative">
      {/* Floating Elements */}
      {/* Building Silhouettes */}
      <div className="absolute -top-2 -left-4 opacity-10 animate-pulse">
        <svg width="80" height="100" viewBox="0 0 80 100" className="text-primary-400">
          <rect x="10" y="30" width="15" height="70" fill="currentColor" />
          <rect x="30" y="20" width="20" height="80" fill="currentColor" />
          <rect x="55" y="40" width="15" height="60" fill="currentColor" />
          <rect x="12" y="35" width="2" height="3" fill="white" opacity="0.6" />
          <rect x="16" y="35" width="2" height="3" fill="white" opacity="0.6" />
          <rect x="12" y="42" width="2" height="3" fill="white" opacity="0.6" />
          <rect x="16" y="42" width="2" height="3" fill="white" opacity="0.6" />
          <rect x="32" y="25" width="3" height="4" fill="white" opacity="0.6" />
          <rect x="38" y="25" width="3" height="4" fill="white" opacity="0.6" />
          <rect x="44" y="25" width="3" height="4" fill="white" opacity="0.6" />
          <rect x="32" y="35" width="3" height="4" fill="white" opacity="0.6" />
          <rect x="38" y="35" width="3" height="4" fill="white" opacity="0.6" />
          <rect x="44" y="35" width="3" height="4" fill="white" opacity="0.6" />
        </svg>
      </div>
      
      <div className="absolute -bottom-4 -right-6 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}>
        <svg width="120" height="80" viewBox="0 0 120 80" className="text-accent-400">
          <rect x="5" y="25" width="25" height="55" fill="currentColor" />
          <rect x="35" y="15" width="30" height="65" fill="currentColor" />
          <rect x="70" y="30" width="20" height="50" fill="currentColor" />
          <rect x="95" y="20" width="20" height="60" fill="currentColor" />
          {/* Windows */}
          <rect x="8" y="30" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="14" y="30" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="20" y="30" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="8" y="40" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="14" y="40" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="20" y="40" width="3" height="4" fill="white" opacity="0.7" />
          <rect x="40" y="20" width="4" height="5" fill="white" opacity="0.7" />
          <rect x="48" y="20" width="4" height="5" fill="white" opacity="0.7" />
          <rect x="56" y="20" width="4" height="5" fill="white" opacity="0.7" />
          <rect x="40" y="30" width="4" height="5" fill="white" opacity="0.7" />
          <rect x="48" y="30" width="4" height="5" fill="white" opacity="0.7" />
          <rect x="56" y="30" width="4" height="5" fill="white" opacity="0.7" />
        </svg>
      </div>
      
      <div className="absolute top-1/3 -left-6 opacity-12 animate-pulse" style={{ animationDelay: '2s' }}>
        <svg width="60" height="70" viewBox="0 0 60 70" className="text-secondary-400">
          <rect x="15" y="20" width="12" height="50" fill="currentColor" />
          <rect x="30" y="10" width="15" height="60" fill="currentColor" />
          <rect x="48" y="25" width="10" height="45" fill="currentColor" />
          {/* Construction crane */}
          <line x1="52" y1="25" x2="52" y2="5" stroke="currentColor" strokeWidth="1" />
          <line x1="52" y1="5" x2="70" y2="5" stroke="currentColor" strokeWidth="1" />
          <line x1="70" y1="5" x2="65" y2="15" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      
      <div className="text-center mb-8">
        <div className="relative">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h2>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full opacity-60"></div>
        </div>
        <p className="text-gray-600 text-lg">Sign in to access your cement rewards</p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {/* Construction/cement themed dots */}
            <div className="w-2 h-2 bg-gray-400 rounded-sm animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-sm animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-sm animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {authError && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 text-sm flex items-center transform animate-shake">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {authError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-primary-400" />
              </div>
              <input
                id="email"
                type="email"
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-300 bg-white/80 backdrop-blur-sm"
                placeholder="your.email@example.com"
                {...register('email')}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-purple-500/5 pointer-events-none"></div>
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-primary-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="block w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-300 bg-white/80 backdrop-blur-sm"
                placeholder="••••••••"
                {...register('password')}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-purple-500/5 pointer-events-none"></div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-2xl transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-primary-400 hover:text-primary-600" />
                ) : (
                  <Eye className="h-5 w-5 text-primary-400 hover:text-primary-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
        
        {/* Enhanced Submit Button */}
        <button
          type="submit"
          className="w-full relative overflow-hidden flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 hover:from-primary-700 hover:via-primary-800 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] group"
          disabled={loading}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span className="relative z-10">Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              <span className="relative z-10">Sign In</span>
            </>
          )}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}