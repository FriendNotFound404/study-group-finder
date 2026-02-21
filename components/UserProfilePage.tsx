import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Book, Users, AlertTriangle, Award, MapPin, Mail, Loader2, ArrowLeft, Ban } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiService } from '../services/apiService';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const [userData, userStats] = await Promise.all([
          apiService.getUserById(parseInt(userId)),
          apiService.getUserStats(parseInt(userId))
        ]);

        setUser(userData);
        setStats(userStats);
      } catch (err) {
        console.error("Failed to load user profile", err);
        alert("Failed to load user profile. They may have privacy settings enabled.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const warningStatus = user?.banned
    ? { label: 'Status', value: 'BANNED', icon: <Ban className="text-red-500" />, color: 'text-red-600' }
    : { label: 'Warnings', value: `${user?.warnings || 0}/3`, icon: <AlertTriangle className="text-amber-500" />, color: (user?.warnings || 0) >= 2 ? 'text-amber-600' : 'text-slate-900' };

  const statCards = [
    { label: 'Groups Joined', value: stats?.groups_joined || '0', icon: <Users className="text-orange-500" />, color: 'text-slate-900' },
    { label: 'Meetings', value: stats?.study_hours || '0', icon: <Book className="text-blue-500" />, color: 'text-slate-900' },
    warningStatus,
    { label: 'Karma Points', value: stats?.karma || '0', icon: <Award className="text-emerald-500" />, color: 'text-slate-900' },
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

  if (!user) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-600 font-bold">User not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-[3rem] shadow-xl shadow-orange-100"></div>
        <div className="absolute top-8 left-12 flex flex-col md:flex-row items-start gap-6 w-[calc(100%-6rem)]">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-2xl shrink-0">
            <div className="w-full h-full bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-600 text-4xl font-black border border-orange-200">
              {user.avatar || user.name[0]}
            </div>
          </div>
          <div className="mt-12 space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
              {user.role === 'admin' && (
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-lg">
                  Admin
                </span>
              )}
              {user.role === 'moderator' && (
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-lg">
                  Moderator
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white font-bold text-sm">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-white" /> {user.location || 'Location not set'}</div>
              <div className="flex items-center gap-1.5"><Mail size={14} className="text-white" /> {user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Personal Details</h2>

            <div className="space-y-6">
              <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Major</span>
                <p className="font-bold text-slate-800">{user.major || 'Not specified'}</p>
              </div>
              <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</span>
                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                  {user.bio ? `"${user.bio}"` : 'No bio available'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, idx) => (
              <div key={idx} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center group hover:border-orange-200 transition-all ${stat.label === 'Status' && user?.banned ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white transition-colors">
                  {stat.icon}
                </div>
                <h4 className={`text-2xl font-black ${stat.color || 'text-slate-900'}`}>{stat.value}</h4>
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
                  <h4 className="font-bold text-slate-900">Karma Points</h4>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Community Contributions</p>
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

export default UserProfilePage;
