import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { calculatePointsByCementType } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { Package, Building, CheckCircle, Truck } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type User = Database['public']['Tables']['users']['Row'];

const pointsRequestSchema = z.object({
  bagsCount: z.string().refine(
    (val) => {
      const num = Number(val); // Use Number() instead of parseInt to avoid truncation
      return !isNaN(num) && num > 0;
    },
    { message: 'Please enter a valid number of bags' }
  ),
  cementType: z.enum(['OPC', 'PPC'], { 
    required_error: 'Please select a cement type' 
  }),
  dealerId: z.string().min(1, 'Please select a dealer')
});

type PointsRequestFormData = z.infer<typeof pointsRequestSchema>;

export default function GetPoints() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dealers, setDealers] = useState<User[]>([]);
  const [pointsPreview, setPointsPreview] = useState(0);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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
      const bagsCount = Number(bagsCountValue); // Use Number() instead of parseInt
      console.log('Bags count input:', bagsCountValue, 'Parsed:', bagsCount); // Debug log
      if (!isNaN(bagsCount) && bagsCount > 0) {
        const calculatedPoints = calculatePointsByCementType(bagsCount, cementTypeValue);
        console.log('Calculated points:', calculatedPoints); // Debug log
        setPointsPreview(calculatedPoints);
      } else {
        setPointsPreview(0);
      }
    } else {
      setPointsPreview(0);
    }
  }, [bagsCountValue, cementTypeValue]);

  useEffect(() => {
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

        // Only fetch dealers if user is a contractor or sub_dealer
        if (profile.role === 'contractor' || profile.role === 'sub_dealer') {
          // Get all dealers in the user's district
          const { data: dealersData, error: dealersError } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'dealer')
            .eq('district', profile.district)
            .order('first_name', { ascending: true });

          if (dealersError) throw dealersError;
          setDealers(dealersData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dealers');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  async function onSubmit(data: PointsRequestFormData) {
    if (!currentUser) return;
    
    setSubmitting(true);
    
    try {
      const selectedDealer = dealers.find(d => d.id === data.dealerId);
      if (!selectedDealer) throw new Error('Dealer not found');

      const bagsCount = Number(data.bagsCount); // Use Number() instead of parseInt
      const pointsAmount = calculatePointsByCementType(bagsCount, data.cementType);
      
      console.log('Submitting request:', {
        bagsCount: data.bagsCount,
        parsedBagsCount: bagsCount,
        cementType: data.cementType,
        pointsAmount
      }); // Debug log
      
      // Create the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          dealer_id: data.dealerId,
          type: 'earned',
          amount: pointsAmount,
          description: `Purchased ${bagsCount} bags of ${data.cementType} cement from ${selectedDealer.first_name} ${selectedDealer.last_name}`,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;
      
      toast.success('Points request submitted successfully!');
      setRequestSubmitted(true);
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

  if (currentUser?.role === 'dealer') {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-warning-100 text-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Not Available</h2>
          <p className="text-gray-600 mb-6">
            As a dealer, you cannot request points. This feature is only available for contractors and sub dealers.
          </p>
        </div>
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
            Your points request has been submitted to the dealer for approval.
            You'll be notified once it's approved.
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Get Points</h1>
      
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
                    Enter the number of cement bags you've purchased
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="font-medium">3. Select Dealer</h3>
                  <p className="text-sm text-gray-600">
                    Choose the dealer you purchased from in your district
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-medium">4. Submit Request</h3>
                  <p className="text-sm text-gray-600">
                    The dealer will verify your purchase and approve points
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary-50 rounded-md">
              <p className="text-sm text-primary-800">
                <strong>Points System:</strong><br/>
                • OPC Cement: 5 points per bag<br/>
                • PPC Cement: 10 points per bag<br/>
                Your district is <strong>{currentUser?.district}</strong>
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
                  Number of Cement Bags Purchased
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
                      <CheckCircle className="text-success-600 mr-2" size={16} />
                      <span className="text-sm text-success-700">
                        You will earn <strong>{pointsPreview} points</strong> for this purchase
                        {cementTypeValue && bagsCountValue && (
                          <span className="ml-1">({bagsCountValue} bags of {cementTypeValue} cement)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="dealerId" className="form-label">
                  Select Dealer/Distributor
                </label>
                
                {dealers.length > 0 ? (
                  <div className="space-y-3">
                    {dealers.map((dealer) => (
                      <label
                        key={dealer.id}
                        className="flex items-start p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          value={dealer.id}
                          className="mt-1"
                          {...register('dealerId')}
                        />
                        <div className="ml-3">
                          <p className="font-medium">{dealer.first_name} {dealer.last_name}</p>
                          <p className="text-sm text-gray-600">
                            {dealer.gst_number && <span>GST: {dealer.gst_number}</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dealer.city}, {dealer.district} • {dealer.mobile_number}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-md">
                    No dealers found in your district ({currentUser?.district}). Please contact support.
                  </p>
                )}
                
                {errors.dealerId && (
                  <p className="form-error">{errors.dealerId.message}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={submitting || dealers.length === 0}
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
        </div>
      </div>
    </div>
  );
}