import React, { useState, useEffect } from 'react';
import { Users, UsersIcon, MessageSquare, Star, TrendingUp, TrendingDown, Activity, Clock, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface DashboardStats {
  total_users: number;
  total_groups: number;
  total_messages: number;
  total_feedback: number;
  active_groups: number;
  leaders_count: number;
  members_count: number;
  recent_users: any[];
  recent_groups: any[];
  recent_feedback: any[];
  groups_by_status: any[];
  groups_by_faculty: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch('http://localhost:8000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchDashboard();
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-purple-600 animate-pulse" />
            </div>
            <p className="text-slate-600 font-bold">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-[2rem] p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">Welcome to Admin Dashboard</h1>
              <p className="text-purple-100 font-medium">Monitor and manage your StudyHub platform</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-purple-100 text-sm font-medium">
                <Clock size={16} />
                <span>Updated {getTimeAgo(lastUpdated)}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Users</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_users || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-slate-500">Leaders: {stats?.leaders_count || 0}</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm font-bold text-slate-500">Members: {stats?.members_count || 0}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UsersIcon size={24} className="text-emerald-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Study Groups</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_groups || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">{stats?.active_groups || 0} Active</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} className="text-orange-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Messages</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_messages || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-500">Platform activity</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star size={24} className="text-amber-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Feedback</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_feedback || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-slate-500">Reviews received</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Recent Users</h3>
              <p className="text-sm text-slate-500 font-medium">Latest registered users</p>
            </div>
            <div className="p-6 space-y-4">
              {stats?.recent_users.map((user: any) => (
                <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'leader'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Groups */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Recent Groups</h3>
              <p className="text-sm text-slate-500 font-medium">Latest created study groups</p>
            </div>
            <div className="p-6 space-y-4">
              {stats?.recent_groups.map((group: any) => (
                <div key={group.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                    {group.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{group.name}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{group.subject}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {group.members_count} members
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups by Faculty */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Groups by Faculty</h3>
            <p className="text-sm text-slate-500 font-medium">Distribution across faculties</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.groups_by_faculty.map((item: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{item.faculty}</span>
                    <span className="text-sm font-black text-purple-600">{item.count} groups</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / (stats?.total_groups || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
