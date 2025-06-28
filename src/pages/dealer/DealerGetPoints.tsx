import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { calculatePointsByCementType } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { Package, CheckCircle, Building2, TrendingUp, Truck } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type User = Database['public']['Tables']['users']['Row'];

const pointsRequestSchema = z.object({
  bagsCount: z.string().refine(
    (val) => {
      const num = parseInt(val, 10); // Explicitly use base 10
      return !isNaN(num) && num > 0;
    },
    { message: 'Please enter a valid number of bags' }
  ),
  cementType: z.enum(['OPC', 'PPC'], { 
    required_error: 'Please select a cement type' 
  })
});

type PointsRequestFormData = z.infer<typeof pointsRequestSchema>;

export default function DealerGetPoints() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pointsPreview, setPointsPreview] = useState(0);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<PointsRequestFormData>({
    resolver: zodResolver(pointsRequestSchema)
  });
  
  const bagsCountValue = watch('bagsCount');
  const cementTypeValue = watch('cementType');

  useEffect(() => {
    if (bagsCountValue && cementTypeValue) {
      const bagsCount = parseInt(bagsCountValue, 10); // Explicitly use base 10
      console.log('Dealer bags count input:', bagsCountValue, 'Parsed:', bagsCount); // Debug log
      if (!isNaN(bagsCount) && bagsCount > 0) {
        const calculatedPoints = calculatePointsByCementType(bagsCount, cementTypeValue);
        console.log('Dealer calculated points:', calculatedPoints); // Debug log
        setPointsPreview(calculatedPoints);
      } else {
        setPointsPreview(0);
      }
    } else {
      setPointsPreview(0);
    }
  }, [bagsCountValue, cementTypeValue]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Get current user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');
      
      setCurrentUser(profile);

      // Get recent requests
      const { data: requests, error: requestsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'earned')
        .order('created_at', { ascending: false })
        .limit(5);

      if (requestsError) throw requestsError;
      setRecentRequests(requests || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }
  
  async function onSubmit(data: PointsRequestFormData) {
    if (!currentUser) return;
    
    setSubmitting(true);
    
    try {
      const bagsCount = parseInt(data.bagsCount, 10); // Explicitly use base 10
      const pointsAmount = calculatePointsByCementType(bagsCount, data.cementType);
      
      console.log('Dealer submitting request:', {
        bagsCount: data.bagsCount,
        parsedBagsCount: bagsCount,
        cementType: data.cementType,
        pointsAmount
      }); // Debug log
      
      // Create the transaction request to admin
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          type: 'earned',
          amount: pointsAmount,
          description: `Dealer request: ${bagsCount} bags of ${data.cementType} cement sold by ${currentUser.first_name} ${currentUser.last_name} (${currentUser.user_code})`,
          status: 'pending', // Will be approved by admin
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;
      
      toast.success('Points request submitted to admin successfully!');
      setRequestSubmitted(true);
      fetchData(); // Refresh recent requests
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requestSubmitted) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your points request has been submitted to the admin for approval.
            You'll be notified once it's processed.
          </p>
          <button
            onClick={() => setRequestSubmitted(false)}
            className="btn btn-primary"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Points</h1>
        <p className="text-gray-600">Submit points request to admin for bags sold</p>
      </div>

      {/* Dealer Info Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Dealer Points System</h2>
            <p className="text-primary-100">Request points for bags sold to customers</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Current Points</p>
            <p className="text-3xl font-bold">{currentUser?.points || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instructions */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            <h2 className="text-lg font-semibold mb-4">How It Works</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-medium">1. Select Cement Type</h3>
                  <p className="text-sm text-gray-600">
                    Choose between OPC or PPC cement type
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-medium">2. Enter Bag Count</h3>
                  <p className="text-sm text-gray-600">
                    Enter the total number of cement bags sold
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-medium">3. Submit Request</h3>
                  <p className="text-sm text-gray-600">
                    Submit your points request to admin
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-medium">4. Admin Approval</h3>
                  <p className="text-sm text-gray-600">
                    Admin will review and approve your request
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary-50 rounded-md">
              <p className="text-sm text-primary-800">
                <strong>Points System:</strong><br/>
                • OPC Cement: 5 points per bag<br/>
                • PPC Cement: 10 points per bag<br/>
                Points will be added after admin approval.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6">Submit Points Request</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="cementType" className="form-label">
                  Cement Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="OPC"
                      className="mr-3"
                      {...register('cementType')}
                    />
                    <div>
                      <p className="font-medium text-gray-900">OPC Cement</p>
                      <p className="text-sm text-gray-600">5 points per bag</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="PPC"
                      className="mr-3"
                      {...register('cementType')}
                    />
                    <div>
                      <p className="font-medium text-gray-900">PPC Cement</p>
                      <p className="text-sm text-gray-600">10 points per bag</p>
                    </div>
                  </label>
                </div>
                {errors.cementType && (
                  <p className="form-error">{errors.cementType.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="bagsCount" className="form-label">
                  Number of Cement Bags Sold
                </label>
                <input
                  id="bagsCount"
                  type="number"
                  className="form-input"
                  placeholder="Enter number of bags"
                  min="1"
                  step="1"
                  {...register('bagsCount')}
                />
                {errors.bagsCount && (
                  <p className="form-error">{errors.bagsCount.message}</p>
                )}
                
                {pointsPreview > 0 && (
                  <div className="mt-2 p-3 bg-success-50 rounded-md">
                    <div className="flex items-center">
                      <TrendingUp className="text-success-600 mr-2" size={16} />
                      <span className="text-sm text-success-700">
                        You will earn <strong>{pointsPreview} points</strong> for this request
                        {cementTypeValue && bagsCountValue && (
                          <span className="ml-1">({bagsCountValue} bags of {cementTypeValue} cement)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Points Request'
                )}
              </button>
            </form>
          </div>

          {/* Recent Requests */}
          {recentRequests.length > 0 && (
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.amount} points requested
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {request.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'approved' ? 'bg-success-100 text-success-700' :
                      request.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                      'bg-error-100 text-error-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}