import { useState, useEffect } from 'react';
import { User, Camera, Save, Building2, Phone, Mail, MapPin, CreditCard, Calendar, BarChart3, ShoppingBag } from 'lucide-react';
import { supabase, getProfilePictureUrl } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import ImageUpload from '../../components/ui/ImageUpload';
import { toast } from 'react-toastify';

type Profile = Database['public']['Tables']['users']['Row'];

export default function DealerProfile() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [performanceData, setPerformanceData] = useState({
    currentMonth: { bags: 0, points: 0, transactions: 0, customers: 0, name: '' },
    last3Months: { bags: 0, points: 0, transactions: 0, customers: 0 },
    last6Months: { bags: 0, points: 0, transactions: 0, customers: 0 },
    yearly: { bags: 0, points: 0, transactions: 0, customers: 0 },
    lifetime: { bags: 0, points: 0, transactions: 0, customers: 0 }
  });
  const [selectedPeriod, setSelectedPeriod] = useState('currentMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (selectedPeriod === 'custom') {
      setShowCustomPeriod(true);
    } else {
      setShowCustomPeriod(false);
    }
  }, [selectedPeriod]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      setProfile(data);
      setEditedEmail(data.email);
      setEditedPhone(data.mobile_number);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPerformanceData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch performance data for all periods - explicitly pass null for optional parameters
      const periods = ['current_month', 'last_3_months', 'last_6_months', 'yearly', 'lifetime'];
      const performancePromises = periods.map(period =>
        supabase.rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: period,
          p_start_date: null,
          p_end_date: null
        })
      );

      const results = await Promise.all(performancePromises);
      
      // Get current month name
      const currentMonthName = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      setPerformanceData({
        currentMonth: {
          bags: results[0].data?.[0]?.total_bags_sold || 0,
          points: results[0].data?.[0]?.total_points_approved || 0,
          transactions: results[0].data?.[0]?.total_transactions || 0,
          customers: results[0].data?.[0]?.unique_customers || 0,
          name: currentMonthName
        },
        last3Months: {
          bags: results[1].data?.[0]?.total_bags_sold || 0,
          points: results[1].data?.[0]?.total_points_approved || 0,
          transactions: results[1].data?.[0]?.total_transactions || 0,
          customers: results[1].data?.[0]?.unique_customers || 0
        },
        last6Months: {
          bags: results[2].data?.[0]?.total_bags_sold || 0,
          points: results[2].data?.[0]?.total_points_approved || 0,
          transactions: results[2].data?.[0]?.total_transactions || 0,
          customers: results[2].data?.[0]?.unique_customers || 0
        },
        yearly: {
          bags: results[3].data?.[0]?.total_bags_sold || 0,
          points: results[3].data?.[0]?.total_points_approved || 0,
          transactions: results[3].data?.[0]?.total_transactions || 0,
          customers: results[3].data?.[0]?.unique_customers || 0
        },
        lifetime: {
          bags: results[4].data?.[0]?.total_bags_sold || 0,
          points: results[4].data?.[0]?.total_points_approved || 0,
          transactions: results[4].data?.[0]?.total_transactions || 0,
          customers: results[4].data?.[0]?.unique_customers || 0
        }
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  }

  async function fetchCustomPeriodData() {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'custom',
          p_start_date: customStartDate,
          p_end_date: customEndDate
        });

      setPerformanceData(prev => ({
        ...prev,
        currentMonth: {
          bags: customData?.[0]?.total_bags_sold || 0,
          points: customData?.[0]?.total_points_approved || 0,
          transactions: customData?.[0]?.total_transactions || 0,
          customers: customData?.[0]?.unique_customers || 0,
          name: `Custom Period (${customStartDate} to ${customEndDate})`
        }
      }));

      toast.success('Custom period data loaded');
    } catch (error) {
      console.error('Error fetching custom period data:', error);
      toast.error('Failed to load custom period data');
    }
  }

  async function handleImageSelect(file: File) {
    try {
      setUploading(true);
      
      if (!profile) {
        toast.error('Profile not loaded');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      // Delete old profile picture if exists
      if (profile.profile_picture_url) {
        try {
          const oldFileName = profile.profile_picture_url.split('/').pop();
          if (oldFileName && !oldFileName.startsWith('http')) {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
          }
        } catch (deleteError) {
          console.warn('Could not delete old profile picture:', deleteError);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Update user profile with just the filename
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_picture_url: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setProfile({ ...profile, profile_picture_url: fileName });
      toast.success('Profile picture updated successfully');
      setShowImageUpload(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile) {
      toast.error('Profile not loaded');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          email: editedEmail,
          mobile_number: editedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      // Update auth email if changed
      if (editedEmail !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: editedEmail
        });
        if (authError) {
          console.warn('Could not update auth email:', authError);
        }
      }

      setProfile({ ...profile, email: editedEmail, mobile_number: editedPhone });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const getCurrentPeriodData = () => {
    return performanceData[selectedPeriod as keyof typeof performanceData];
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'currentMonth': return performanceData.currentMonth.name;
      case 'last3Months': return 'Last 3 Months';
      case 'last6Months': return 'Last 6 Months';
      case 'yearly': return new Date().getFullYear().toString();
      case 'lifetime': return 'All Time';
      case 'custom': return performanceData.currentMonth.name;
      default: return performanceData.currentMonth.name;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load profile data</p>
        <button 
          onClick={fetchProfile}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const profileImageUrl = profile.profile_picture_url ? getProfilePictureUrl(profile.profile_picture_url) : null;
  const currentData = getCurrentPeriodData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Profile</h1>
        <p className="text-gray-600">Manage your dealer account information and view performance metrics</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${profile.first_name}'s profile`}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  console.error('Error loading profile image');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-white shadow-lg ${profileImageUrl ? 'hidden' : ''}`}>
              <Building2 className="w-16 h-16 text-primary-600" />
            </div>
            <button
              onClick={() => setShowImageUpload(true)}
              className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
              title="Change profile picture"
            >
              <Camera size={20} className="text-gray-600" />
            </button>
          </div>
          <h2 className="text-xl font-semibold mt-4">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-500">{profile.email}</p>
          <div className="flex items-center mt-2">
            <Building2 size={16} className="text-primary-600 mr-1" />
            <span className="text-sm text-primary-600 font-medium">Authorized Dealer</span>
          </div>
        </div>

        {/* Image Upload Modal */}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Update Profile Picture</h3>
                <ImageUpload
                  onImageSelect={(file) => handleImageSelect(file)}
                  maxSize={2 * 1024 * 1024} // 2MB
                  className="mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="btn btn-outline"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={`${profile.first_name} ${profile.last_name}`}
                disabled
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                className="form-input"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.gst_number || 'Not provided'}
                disabled
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Dealer Code</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.user_code}
                disabled
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">District</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.district}
                disabled
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.city}
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Member Since</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={format(new Date(profile.created_at), 'MMMM d, yyyy')}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm\" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="mr-2 text-primary-600" size={20} />
          Address Information
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-700">{profile.address}</p>
          <p className="text-gray-600 text-sm mt-1">{profile.city}, {profile.district}</p>
        </div>
      </div>

      {/* Performance Metrics with Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 text-primary-600" size={20} />
            Performance Metrics
          </h3>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-input text-sm"
            >
              <option value="currentMonth">Current Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="yearly">This Year</option>
              <option value="lifetime">Lifetime</option>
              <option value="custom">Custom Period</option>
            </select>
            
            {showCustomPeriod && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="form-input text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="form-input text-sm"
                  placeholder="End Date"
                />
                <button
                  onClick={fetchCustomPeriodData}
                  className="btn btn-primary btn-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Bags Sold</p>
                <p className="text-2xl font-bold text-green-700">{currentData.bags}</p>
                <p className="text-xs text-green-600">{getPeriodLabel()}</p>
              </div>
              <ShoppingBag className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Points Approved</p>
                <p className="text-2xl font-bold text-blue-700">{currentData.points}</p>
                <p className="text-xs text-blue-600">{getPeriodLabel()}</p>
              </div>
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Transactions</p>
                <p className="text-2xl font-bold text-purple-700">{currentData.transactions}</p>
                <p className="text-xs text-purple-600">{getPeriodLabel()}</p>
              </div>
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Unique Customers</p>
                <p className="text-2xl font-bold text-orange-700">{currentData.customers}</p>
                <p className="text-xs text-orange-600">{getPeriodLabel()}</p>
              </div>
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Bags Sold Comparison</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{performanceData.currentMonth.bags}</p>
              <p className="text-xs text-gray-600">{performanceData.currentMonth.name.split(' ')[0]}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{performanceData.last3Months.bags}</p>
              <p className="text-xs text-gray-600">Last 3 Months</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{performanceData.last6Months.bags}</p>
              <p className="text-xs text-gray-600">Last 6 Months</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{performanceData.yearly.bags}</p>
              <p className="text-xs text-gray-600">This Year</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{performanceData.lifetime.bags}</p>
              <p className="text-xs text-gray-600">Lifetime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Phone className="text-primary-600" size={20} />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{profile.mobile_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Mail className="text-primary-600" size={20} />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          
          {profile.gst_number && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <CreditCard className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-medium">{profile.gst_number}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Building2 className="text-primary-600" size={20} />
            <div>
              <p className="text-sm text-gray-500">Dealer Code</p>
              <p className="font-medium">{profile.user_code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}