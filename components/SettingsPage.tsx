
import React from 'react';
import { Shield, Bell, Eye, Database, Smartphone, Lock, Trash2, ChevronRight } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const settingsGroups = [
    {
      title: 'Account & Security',
      items: [
        { label: 'Login & Security', icon: <Shield className="text-blue-500" />, desc: 'Change password and manage 2FA' },
        { label: 'Privacy Center', icon: <Lock className="text-emerald-500" />, desc: 'Control who sees your profile activity' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', icon: <Bell className="text-orange-500" />, desc: 'Mute chats or enable sound alerts' },
        { label: 'Appearance', icon: <Eye className="text-purple-500" />, desc: 'Switch to Dark Mode or customize accent colors' },
      ]
    },
    {
      title: 'Data & Sync',
      items: [
        { label: 'Storage Usage', icon: <Database className="text-slate-500" />, desc: 'Clear cache and manage shared files' },
        { label: 'Device Management', icon: <Smartphone className="text-sky-500" />, desc: 'See active sessions on other devices' },
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
              {group.items.map((item, i) => (
                <button 
                  key={i} 
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
              ))}
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
    </div>
  );
};

export default SettingsPage;
