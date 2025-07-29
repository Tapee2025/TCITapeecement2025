import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Search, Edit, Trash, Users, Eye, EyeOff, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateUserCode } from '../../utils/helpers';
import { GUJARAT_DISTRICTS, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

type User = Database['public']['Tables']['users']['Row'];

const customerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['contractor', 'sub_dealer'] as const),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  mobile_number: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  gst_number: z.string().optional()
}).refine(
  (data) => !(data.role === 'sub_dealer' && !data.gst_number),
  {
    message: 'GST Number is required for Sub Dealers',
    path: ['gst_number'],
  }
);

type CustomerFormData = z.infer<typeof customerSchema>;

export default function ManageCustomers() {
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    contractors: 0,
    subDealers: 0,
    activeThisMonth: 0
  });

  const { 
    register, 
    handleSubmit,
    reset,
    formState: { errors } 
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      role: 'sub_dealer'
    }
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchCustomers();
    }
  }, [authLoading, currentUser]);

  async function fetchCustomers() {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all customers in the same district as the dealer
      let query = supabase
        .from('users')
        .select('*')
        .eq('district', currentUser.district)
        .in('role', ['contractor', 'sub_dealer'])
        .neq('id', currentUser.id) // Exclude the dealer themselves
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setCustomers(data || []);

      // Calculate stats
      const totalCustomers = data?.length || 0;
      const contractors = data?.filter(c => c.role === 'contractor').length || 0;
      const subDealers = data?.filter(c => c.role === 'sub_dealer').length || 0;

      // Get customers active this month (with transactions)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const { data: activeCustomers } = await supabase
        .from('transactions')
        .select('user_id')
        .gte('created_at', thisMonth.toISOString())
        .in('user_id', data?.map(c => c.id) || []);

      const uniqueActiveCustomers = new Set(activeCustomers?.map(t => t.user_id)).size;

      setStats({
        totalCustomers,
        contractors,
        subDealers,
        activeThisMonth: uniqueActiveCustomers
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: CustomerFormData) {
    if (!currentUser) {
      toast.error('User information not loaded');
      return;
    }

    setSubmitting(true);
    
    try {
      // Generate user code
      const userCode = generateUserCode();

      // First create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('This email is already registered. Please use a different email.');
        } else {
          toast.error('An error occurred during registration. Please try again.');
        }
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create user account. Please try again.');
        return;
      }

      // Then create the public user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          city: data.city,
          address: data.address,
          district: currentUser.district, // Same district as dealer
          mobile_number: data.mobile_number,
          user_code: userCode,
          points: 0,
          created_by: currentUser.id
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Try to clean up the auth user since profile creation failed
        await supabase.auth.signOut();
        toast.error('Failed to create customer profile. Please try again.');
        return;
      }

      toast.success('Customer created successfully!');
      setShowAddModal(false);
      reset();
      fetchCustomers();
    } catch (error) {
      console.error('Customer creation error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  }

  function openAddModal() {
    setEditingCustomer(null);
    reset();
    setShowAddModal(true);
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = (
      customer.first_name.toLowerCase().includes(searchString) ||
      customer.last_name.toLowerCase().includes(searchString) ||
      customer.email.toLowerCase().includes(searchString) ||
      customer.user_code.toLowerCase().includes(searchString)
    );
    
    const matchesRole = roleFilter === 'all' || customer.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if no user is authenticated
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Authentication Required</h3>
          <p className="text-gray-500">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Customers</h1>
          <p className="text-gray-600">Add and manage your customers (contractors and sub dealers)</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center"
        >
          <UserPlus size={20} className="mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contractors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contractors}</p>
            </div>
            <Users className="w-8 h-8 text-accent-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sub Dealers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.subDealers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeThisMonth}</p>
            </div>
            <Users className="w-8 h-8 text-success-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Customer Types</option>
            <option value="contractor">Contractors Only</option>
            <option value="sub_dealer">Sub Dealers Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {customer.first_name[0]}{customer.last_name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.role === 'contractor' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.role === 'sub_dealer' ? 'Sub Dealer' : 'Contractor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.user_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{customer.mobile_number}</div>
                      <div className="text-xs text-gray-400">{customer.city}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Customers Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No customers match your search for "${searchQuery}"`
                : 'Start by adding your first customer'}
            </p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Add New Customer
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('first_name')}
                      placeholder="John"
                    />
                    {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('last_name')}
                      placeholder="Doe"
                    />
                    {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    {...register('email')}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      {...register('password')}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Customer Type</label>
                    <select
                      className="form-input"
                      {...register('role')}
                    >
                      <option value="sub_dealer">Sub Dealer</option>
                      <option value="contractor">Contractor/Mason</option>
                    </select>
                    {errors.role && <p className="form-error">{errors.role.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('mobile_number')}
                      placeholder="10-digit mobile number"
                    />
                    {errors.mobile_number && <p className="form-error">{errors.mobile_number.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('address')}
                    placeholder="Full address"
                  />
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('city')}
                    placeholder="City name"
                  />
                  {errors.city && <p className="form-error">{errors.city.message}</p>}
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <strong>Note:</strong> Customer will be created in your district ({currentUser?.district}) and can login with the provided email and password. Sub dealers can also manage their own customers.
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Customer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}