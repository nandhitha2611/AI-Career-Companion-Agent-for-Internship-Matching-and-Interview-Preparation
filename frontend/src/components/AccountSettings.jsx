import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000';

export default function AccountSettings({ token, onLogout }) {
  const [email, setEmail] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch current user email on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error('Failed to fetch user email:', err);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password.');
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to delete account.');
      }

      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error deleting account.' });
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-1">Account Settings</h2>
        <p className="text-xs text-gray-500">Manage your profile email, password, and security settings.</p>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. Account Email Section */}
<div className="border border-gray-200/80 rounded-xl p-4 bg-gray-50/50 cursor-not-allowed select-none">
  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 cursor-not-allowed">
    Registered Email
  </label>
  <p className="text-xs font-medium text-gray-700 cursor-not-allowed">
    {email || 'Loading...'}
  </p>
</div>

      {/* 2. Masked Password & Expandable Form Section */}
      <div className="border border-gray-200/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <p className="text-sm font-mono text-gray-800 tracking-widest">••••••••••••</p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingPassword(!isEditingPassword)}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
          >
            {isEditingPassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {isEditingPassword && (
          <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingPassword(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Danger Zone: Delete Account Section */}
      <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-0.5">Danger Zone</h3>
            <p className="text-[11px] text-gray-500">Permanently delete your account and all profile data.</p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}