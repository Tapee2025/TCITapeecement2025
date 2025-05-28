import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterFormData, UserRole } from '../../types';
import { GUJARAT_DISTRICTS, USER_ROLES } from '../../utils/constants';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['builder', 'dealer', 'contractor'] as const),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  gstNumber: z.string().optional(),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(
  (data) => !(data.role === 'dealer' && !data.gstNumber),
  {
    message: 'GST Number is required for Dealers/Distributors',
    path: ['gstNumber'],
  }
);

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'contractor'
    }
  });
  
  const selectedRole = watch('role');
  
  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    
    try {
      await registerUser(data);
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fade-in pb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
        <p className="text-gray-600">Join the Tapee Cement loyalty program</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="form-label">First Name</label>
            <input
              id="firstName"
              type="text"
              className="form-input"
              placeholder="John"
              {...register('firstName')}
            />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          
          <div>
            <label htmlFor="lastName" className="form-label">Last Name</label>
            <input
              id="lastName"
              type="text"
              className="form-input"
              placeholder="Doe"
              {...register('lastName')}
            />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="role" className="form-label">User Type</label>
          <select
            id="role"
            className="form-input"
            {...register('role')}
          >
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="form-error">{errors.role.message}</p>}
        </div>
        
        <div>
          <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
          <input
            id="mobileNumber"
            type="text"
            className="form-input"
            placeholder="10-digit mobile number"
            {...register('mobileNumber')}
          />
          {errors.mobileNumber && <p className="form-error">{errors.mobileNumber.message}</p>}
        </div>
        
        <div>
          <label htmlFor="address" className="form-label">Address</label>
          <input
            id="address"
            type="text"
            className="form-input"
            placeholder="Your full address"
            {...register('address')}
          />
          {errors.address && <p className="form-error">{errors.address.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="form-label">City</label>
            <input
              id="city"
              type="text"
              className="form-input"
              placeholder="Your city"
              {...register('city')}
            />
            {errors.city && <p className="form-error">{errors.city.message}</p>}
          </div>
          
          <div>
            <label htmlFor="district" className="form-label">District</label>
            <select
              id="district"
              className="form-input"
              {...register('district')}
            >
              <option value="">Select district</option>
              {GUJARAT_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {errors.district && <p className="form-error">{errors.district.message}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="gstNumber" className="form-label">
            GST Number {selectedRole === 'dealer' ? '(Required)' : '(Optional)'}
          </label>
          <input
            id="gstNumber"
            type="text"
            className="form-input"
            placeholder="GST Number"
            {...register('gstNumber')}
          />
          {errors.gstNumber && <p className="form-error">{errors.gstNumber.message}</p>}
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm\" className="mr-2" /> : null}
          Create Account
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}