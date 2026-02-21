
import React, { useState } from 'react';
import { Shield, Bell, Eye, Database, Lock, Trash2, ChevronRight, X, Loader2, CheckCircle2, Moon, Volume2, VolumeX } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useTheme } from '../contexts/ThemeContext';
import { initAudioContext, playNotificationSound } from '../App';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    localStorage.getItem('notification_sound') !== 'false'
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('notification_sound', next ? 'true' : 'false');
    if (next) {
      // User just enabled sound — this click is a user gesture, so init + preview
      initAudioContext();
      setTimeout(playNotificationSound, 50);
    }
  };

  const settingsGroups = [
    {
      title: 'Account & Security',
      items: [
        { label: 'Login & Security', icon: <Shield className="text-blue-500" />, desc: 'Change password' },
        { label: 'Privacy Center', icon: <Lock className="text-emerald-500" />, desc: 'Control who sees your profile activity' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', icon: <Bell className="text-orange-500" />, desc: soundEnabled ? 'Sound alerts on' : 'Sound alerts off' },
        { label: 'Appearance', icon: <Eye className="text-purple-500" />, desc: 'Switch to Dark Mode' },
      ]
    },
    {
      title: 'Data & Sync',
      items: [
        { label: 'Storage Usage', icon: <Database className="text-slate-500" />, desc: 'Clear cache and manage shared files' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{group.title}</h3>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              {group.items.map((item, i) => {
                if (item.label === 'Notifications') {
                  return (
                    <div
                      key={i}
                      className={`w-full flex items-center justify-between p-6 ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
                          {soundEnabled ? <Volume2 size={20} className="text-orange-500" /> : <VolumeX size={20} className="text-slate-400" />}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-slate-900">{item.label}</h4>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            {soundEnabled ? 'Sound alerts on' : 'Sound alerts off'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleSound}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${soundEnabled ? 'bg-orange-500' : 'bg-slate-200'}`}
                        aria-label="Toggle notification sound"
                        role="switch"
                        aria-checked={soundEnabled}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                }
                if (item.label === 'Appearance') {
                  return (
                    <div
                      key={i}
                      className={`w-full flex items-center justify-between p-6 ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
                          {theme === 'dark' ? <Moon size={20} className="text-purple-500" /> : <Eye size={20} className="text-purple-500" />}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-slate-900">{item.label}</h4>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            {theme === 'dark' ? 'Dark mode is on' : 'Switch to Dark Mode'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-orange-500' : 'bg-slate-200'}`}
                        aria-label="Toggle dark mode"
                        role="switch"
                        aria-checked={theme === 'dark'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (item.label === 'Login & Security') {
                        setShowPasswordModal(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-white shadow-sm">
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-900">{item.label}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-8 space-y-4">
          <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] ml-2">Danger Zone</h3>
          <div className="bg-white border border-red-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-6 hover:bg-red-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100/50 rounded-2xl flex items-center justify-center">
                  <Trash2 className="text-red-500" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-red-600">Delete Account</h4>
                  <p className="text-xs font-semibold text-red-400 mt-0.5">Permanently remove all your data and groups</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-red-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 flex justify-between items-center" style={{ color: 'white' }}>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>Change Password</h2>
                <p className="font-medium text-sm mt-1" style={{ color: 'rgb(191 219 254)' }}>Update your account password</p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                  setSuccess(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={20} style={{ color: 'white' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {success ? (
                <div className="py-12 text-center">
                  <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Password Changed!</h3>
                  <p className="text-sm text-slate-600">Your password has been updated successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-600 font-semibold">{error}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      placeholder="Enter new password (min 8 characters)"
                      disabled={loading}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setError('');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
