import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) throw error;

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', data.email)
        .single();

      if (userError) throw userError;

      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'dealer') {
        navigate('/dealer/dashboard');
      } else {
        navigate('/dashboard');
      }

      toast.success('Logged in successfully');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Sign in to your account to continue</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="your.email@example.com"
            {...register('email')}
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="form-label">Password</label>
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Sign in
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}