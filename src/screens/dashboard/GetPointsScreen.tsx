import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Plus, User, Building } from 'lucide-react';

interface Dealer {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  district: string;
  user_code: string;
}

export default function GetPointsScreen() {
  const { user } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [bags, setBags] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDealers();
  }, [user]);

  const fetchDealers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, city, district, user_code')
        .eq('role', 'dealer')
        .eq('district', user.district)
        .order('first_name');

      if (error) {
        console.error('Error fetching dealers:', error);
      } else {
        setDealers(data || []);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!selectedDealer || !bags || !description) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const bagsNumber = parseInt(bags);
    if (bagsNumber <= 0) {
      setError('Number of bags must be greater than 0');
      setLoading(false);
      return;
    }

    const points = bagsNumber * 10; // 10 points per bag

    try {
      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          type: 'earned',
          amount: points,
          description: `${description} (${bagsNumber} bags)`,
          status: 'pending',
          dealer_id: selectedDealer,
        });

      if (transactionError) {
        setError(transactionError.message);
      } else {
        setSuccess(true);
        setBags('');
        setDescription('');
        setSelectedDealer('');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earn Points</h1>
        <p className="text-gray-600">
          Submit your cement bag purchases to earn loyalty points
        </p>
      </div>

      {/* Points Info */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="p-3 bg-primary-600 rounded-full">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-primary-900">
              Earn 10 Points per Cement Bag
            </p>
            <p className="text-primary-700">
              Get your purchases verified by authorized dealers
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
          Points request submitted successfully! Your dealer will review and approve it.
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="dealer" className="block text-sm font-medium text-gray-700 mb-2">
              Select Dealer
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="dealer"
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                className="input-field pl-10"
                required
              >
                <option value="">Choose a dealer in your district</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.first_name} {dealer.last_name} - {dealer.city} ({dealer.user_code})
                  </option>
                ))}
              </select>
            </div>
            {dealers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No dealers found in your district ({user?.district})
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bags" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Cement Bags
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="bags"
                type="number"
                min="1"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter number of bags purchased"
                required
              />
            </div>
            {bags && (
              <p className="text-sm text-primary-600 mt-1">
                You will earn {parseInt(bags) * 10} points for {bags} bags
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Describe your purchase (e.g., construction project, location, etc.)"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || dealers.length === 0}
            className="w-full btn-primary py-3 text-lg"
          >
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>

      {/* How it Works */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How it Works</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-gray-700">Select an authorized dealer from your district</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="text-gray-700">Enter the number of cement bags purchased</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="text-gray-700">Provide a description of your purchase</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <p className="text-gray-700">Wait for dealer approval to receive your points</p>
          </div>
        </div>
      </div>
    </div>
  );
}