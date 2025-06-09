import React, { useState, useEffect } from 'react';
import { User, Camera, Save } from 'lucide-react';
import { supabase, getProfilePictureUrl } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import ImageUpload from '../../components/ui/ImageUpload';
import { toast } from 'react-toastify';

type Profile = Database['public']['Tables']['users']['Row'];

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Fetching profile for user:', user.id);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile data:', data);
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

  async function handleImageSelect(file: File) {
    try {
      setUploading(true);
      
      if (!profile) {
        toast.error('Profile not loaded');
        return;
      }

      console.log('Uploading image for user:', profile.id);

      // Upload to Supabase Storage (assumes 'avatars' bucket already exists)
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

      console.log('Saving profile for user:', profile.id);

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
    <div className="container mx-auto px-4 py-8">
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
              <User className="w-16 h-16 text-primary-600" />
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
          <p className="text-sm text-gray-400 capitalize">{profile.role}</p>
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

            {profile.role === 'dealer' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  value={profile.gst_number || 'Not provided'}
                  disabled
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">User Code</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.user_code}
                disabled
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.role}
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

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">District</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={profile.district}
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
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.role !== 'dealer' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Points</p>
                <p className="text-2xl font-bold text-blue-700">{profile.points}</p>
              </div>
            )}
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">City</p>
              <p className="text-2xl font-bold text-green-700">{profile.city}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Address</p>
              <p className="text-sm font-medium text-purple-700 break-words">{profile.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}