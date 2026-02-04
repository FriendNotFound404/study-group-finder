
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Edit2, Save, Book, Users, Star, Award, MapPin, Mail, Loader2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiService } from '../services/apiService';

interface ProfilePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [profile, setProfile] = useState({
    major: user.major || '',
    bio: user.bio || '',
    location: user.location || ''
  });

  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true);
      try {
        const [latestProfile, latestStats] = await Promise.all([
          apiService.getProfile(),
          apiService.getProfileStats()
        ]);
        
        setProfile({
          major: latestProfile.major || '',
          bio: latestProfile.bio || '',
          location: latestProfile.location || ''
        });
        setStats(latestStats);
        
        // Sync global state if backend has newer info
        onUserUpdate(latestProfile);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };
    
    initializeProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await apiService.updateProfile(profile);
      onUserUpdate(updatedUser);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: 'Groups Joined', value: stats?.groups_joined || '0', icon: <Users className="text-orange-500" /> },
    { label: 'Study Sessions', value: stats?.study_hours || '0', icon: <Book className="text-blue-500" /> },
    { label: 'Avg Rating', value: '5.0', icon: <Star className="text-yellow-500" /> },
    { label: 'Karma Points', value: stats?.karma || '0', icon: <Award className="text-emerald-500" /> },
  ];

  const activityData = stats?.activity?.map((val: number, i: number) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    hours: val
  })) || [];

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-[3rem] shadow-xl shadow-orange-100"></div>
        <div className="absolute -bottom-12 left-12 flex flex-col md:flex-row items-end gap-6 w-[calc(100%-6rem)]">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-2xl shrink-0">
            <div className="w-full h-full bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-600 text-4xl font-black border border-orange-200">
              {user.avatar || user.name[0]}
            </div>
          </div>
          <div className="mb-2 space-y-1 flex-1 min-w-0">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight truncate">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" /> {profile.location || 'Location not set'}</div>
              <div className="flex items-center gap-1.5"><Mail size={14} className="text-orange-500" /> {user.email}</div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-12 right-12 hidden md:block">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                disabled={saving}
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-white text-red-500 border border-red-100 rounded-2xl font-bold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={saving}
                onClick={handleSave}
                className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-24 md:hidden px-4">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full px-6 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold shadow-md flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                disabled={saving}
                onClick={handleSave}
                className="w-full px-6 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
              <button 
                disabled={saving}
                onClick={() => setIsEditing(false)}
                className="w-full px-6 py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-bold"
              >
                Cancel
              </button>
            </div>
          )}
      </div>

      <div className={`${isEditing ? 'mt-8' : 'mt-20'} grid grid-cols-1 lg:grid-cols-3 gap-8`}>
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Personal Details</h2>
              {!isEditing && <Info size={16} className="text-slate-300" />}
            </div>
            
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Academic Major</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-orange-500 focus:bg-white transition-all"
                      placeholder="e.g. Computer Science"
                      value={profile.major}
                      onChange={e => setProfile({...profile, major: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-orange-500 focus:bg-white transition-all"
                      placeholder="e.g. Bangkok, Thailand"
                      value={profile.location}
                      onChange={e => setProfile({...profile, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">About Me / Bio</label>
                  <textarea 
                    rows={4}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm resize-none focus:border-orange-500 focus:bg-white transition-all"
                    placeholder="Tell us a bit about your study habits or interests..."
                    value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Major</span>
                  <p className="font-bold text-slate-800">{profile.major || 'Not specified'}</p>
                </div>
                <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</span>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    {profile.bio ? `"${profile.bio}"` : 'Write something about yourself...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center group hover:border-orange-200 transition-all">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white transition-colors">
                  {stat.icon}
                </div>
                <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-8">Weekly Activity</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  />
                  <Bar dataKey="hours" radius={[8, 8, 8, 8]} barSize={40}>
                    {activityData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 5 || index === 6 ? '#F97316' : '#f1f5f9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Karma Milestone</h4>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Contribute to the hub to earn more!</p>
                </div>
              </div>
              <span className="text-4xl font-black text-orange-500">{stats?.karma || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
