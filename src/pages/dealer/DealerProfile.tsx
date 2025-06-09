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
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    totalPointsApproved: 0,
    totalBagsSold: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchDealerStats();
  }, []);

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

  async function fetchDealerStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id);

      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'pending');

      // Get approved this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: approvedThisMonth } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .in('status', ['dealer_approved', 'approved'])
        .gte('created_at', startOfMonth.toISOString());

      // Get total points approved
      const { data: approvedTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('dealer_id', user.id)
        .in('status', ['dealer_approved', 'approved']);

      const totalPointsApproved = approvedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalBagsSold = Math.floor(totalPointsApproved / 10);

      setStats({
        totalTransactions: totalTransactions || 0,
        pendingApprovals: pendingApprovals || 0,
        approvedThisMonth: approvedThisMonth || 0,
        totalPointsApproved,
        totalBagsSold
      });
    } catch (error) {
      console.error('Error fetching dealer stats:', error);
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

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-2 text-primary-600" size={20} />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Bags Sold</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalBagsSold}</p>
              </div>
              <ShoppingBag className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalTransactions}</p>
              </div>
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</p>
              </div>
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Approved This Month</p>
                <p className="text-2xl font-bold text-purple-700">{stats.approvedThisMonth}</p>
              </div>
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Total Points Approved</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.totalPointsApproved}</p>
              </div>
              <BarChart3 className="text-indigo-600" size={24} />
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