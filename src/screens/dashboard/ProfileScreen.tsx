import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, MapPin, Building, Edit, Save, X } from 'lucide-react';

export default function ProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    mobile_number: user?.mobile_number || '',
    city: user?.city || '',
    address: user?.address || '',
    gst_number: user?.gst_number || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await updateProfile(formData);

    if (error) {
      setError(error);
    } else {
      setSuccess('Profile updated successfully!');
      setEditing(false);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      mobile_number: user?.mobile_number || '',
      city: user?.city || '',
      address: user?.address || '',
      gst_number: user?.gst_number || '',
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Header */}
      <div className="card text-center">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {user.first_name} {user.last_name}
        </h2>
        <p className="text-gray-600 capitalize">{user.role}</p>
        <p className="text-sm text-gray-500">User Code: {user.user_code}</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <Edit size={20} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700"
              >
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input-field"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <span>{user.first_name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input-field"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <span>{user.last_name}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{user.email}</span>
              <span className="text-xs text-gray-500">(Cannot be changed)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            {editing ? (
              <input
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <span>{user.mobile_number}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              {editing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{user.city}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>{user.district}</span>
                <span className="text-xs text-gray-500">(Cannot be changed)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            {editing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 text-gray-400" />
                <span>{user.address}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number
            </label>
            {editing ? (
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter GST number (optional)"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 text-gray-400" />
                <span>{user.gst_number || 'Not provided'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">{user.points}</p>
            <p className="text-sm text-primary-700">Current Points</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700">Member Since</p>
          </div>
        </div>
      </div>
    </div>
  );
}