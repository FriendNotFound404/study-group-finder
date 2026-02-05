import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, UsersIcon, MessageSquare, BarChart3, Loader2, RefreshCw, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface AnalyticsData {
  user_growth: Array<{ date: string; count: number }>;
  group_growth: Array<{ date: string; count: number }>;
  message_activity: Array<{ date: string; count: number }>;
  top_groups: Array<{ id: string; name: string; members_count: number }>;
  top_subjects: Array<{ subject: string; count: number }>;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      const userStr = localStorage.getItem('auth_user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch('http://localhost:8000/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchAnalytics();
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
            <Loader2 size={48} className="text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-bold">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const maxUserCount = Math.max(...(analytics?.user_growth.map(d => d.count) || [1]));
  const maxGroupCount = Math.max(...(analytics?.group_growth.map(d => d.count) || [1]));
  const maxMessageCount = Math.max(...(analytics?.message_activity.map(d => d.count) || [1]));

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Analytics & Insights</h1>
            <p className="text-slate-500 font-medium">Platform performance metrics and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Clock size={16} />
              <span>Updated {getTimeAgo(lastUpdated)}</span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <h3 className="font-black text-slate-900">User Growth</h3>
              </div>
              <p className="text-sm text-slate-500">Last 30 days</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {analytics?.user_growth.slice(-10).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-black text-blue-600">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(item.count / maxUserCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Group Growth */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <UsersIcon size={20} className="text-emerald-600" />
                </div>
                <h3 className="font-black text-slate-900">Group Growth</h3>
              </div>
              <p className="text-sm text-slate-500">Last 30 days</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {analytics?.group_growth.slice(-10).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-black text-emerald-600">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(item.count / maxGroupCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Activity */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-orange-600" />
                </div>
                <h3 className="font-black text-slate-900">Message Activity</h3>
              </div>
              <p className="text-sm text-slate-500">Last 30 days</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {analytics?.message_activity.slice(-10).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-black text-orange-600">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(item.count / maxMessageCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-purple-600" size={24} />
                <div>
                  <h3 className="font-black text-slate-900">Top Groups by Members</h3>
                  <p className="text-sm text-slate-500">Most popular study groups</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics?.top_groups.map((group, idx) => (
                  <div key={group.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-black text-lg">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{group.name}</p>
                      <p className="text-sm text-slate-500">
                        <UsersIcon size={12} className="inline mr-1" />
                        {group.members_count} members
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Subjects */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-purple-600" size={24} />
                <div>
                  <h3 className="font-black text-slate-900">Top Subjects</h3>
                  <p className="text-sm text-slate-500">Most popular study subjects</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics?.top_subjects.map((subject, idx) => {
                  const maxCount = analytics.top_subjects[0]?.count || 1;
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{subject.subject}</span>
                        <span className="text-sm font-black text-purple-600">{subject.count} groups</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${(subject.count / maxCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
