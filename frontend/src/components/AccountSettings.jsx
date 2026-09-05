import React, { useState } from 'react';
import { changePassword, deleteAccount } from '../api';

export default function AccountSettings({ onLogout }) {
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passwords);
      setMsg('Password updated successfully!');
      setPasswords({ old_password: '', new_password: '' });
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account?')) {
      try {
        await deleteAccount();
        onLogout();
      } catch (err) {
        alert('Failed to delete account.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        {msg && <p className="text-sm mb-3 text-indigo-400">{msg}</p>}
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <input
            type="password"
            placeholder="Current Password"
            value={passwords.old_password}
            onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm"
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwords.new_password}
            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium">
            Update Password
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-slate-800 p-6 rounded-xl border border-red-900/50">
        
        <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium">
          Delete Account
        </button>
        <p className="text-sm text-slate-400 mb-4">Permanently remove your account and all associated data.</p>
      </div>
    </div>
  );
}