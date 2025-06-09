import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });
  
  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);
    
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
        <p className="text-gray-600">
          Enter your email and we'll send you a link to reset your password
        </p>
      </div>
      
      {emailSent ? (
        <div className="text-center">
          <div className="bg-success-100 text-success-800 p-4 rounded-md mb-4">
            Password reset link sent! Check your email inbox.
          </div>
          <Link to="/login" className="btn btn-primary">
            Return to login
          </Link>
        </div>
      ) : (
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
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Send Reset Link
          </button>
        </form>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}