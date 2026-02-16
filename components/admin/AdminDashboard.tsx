import React, { useState, useEffect } from 'react';
import { Users, UsersIcon, MessageSquare, Star, TrendingUp, TrendingDown, Activity, Clock, RefreshCw, AlertTriangle, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface DashboardStats {
  total_users: number;
  total_groups: number;
  total_messages: number;
  total_feedback: number;
  total_ratings: number;
  total_events: number;
  active_groups: number;
  leaders_count: number;
  members_count: number;
  admin_count: number;
  moderator_count: number;
  avg_rating: number;
  upcoming_events: number;
  new_groups_today: number;
  reports_count: number;
  violations_count: number;
  meetings_this_week: number;
  group_with_most_meetings: {
    id: number;
    name: string;
    subject: string;
    events_count: number;
    creator: {
      name: string;
    };
  } | null;
  most_reported_users: Array<{ user_id: number; name: string; email: string; report_count: number }>;
  recent_activity_feed: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  recent_users: any[];
  recent_groups: any[];
  recent_feedback: any[];
  recent_ratings: any[];
  recent_events: any[];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Users</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_users || 0}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="font-bold text-slate-500">Leaders: {stats?.leaders_count || 0}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-500">Members: {stats?.members_count || 0}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-500">Admins: {stats?.admin_count || 0}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-500">Mods: {stats?.moderator_count || 0}</span>
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
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ratings</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_ratings || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-slate-500">Avg: {stats?.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Events</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_events || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar size={14} className="text-purple-500" />
              <span className="text-sm font-bold text-slate-500">{stats?.upcoming_events || 0} Upcoming</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Reports</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.reports_count || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-sm font-bold text-slate-500">Pending reports</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <UsersIcon size={24} className="text-teal-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">New Today</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.new_groups_today || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={14} className="text-teal-500" />
              <span className="text-sm font-bold text-slate-500">Groups created today</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-indigo-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">This Week</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.meetings_this_week || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <Calendar size={14} className="text-indigo-500" />
              <span className="text-sm font-bold text-slate-500">Meetings scheduled</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Violations</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.violations_count || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown size={14} className="text-rose-500" />
              <span className="text-sm font-bold text-slate-500">Banned/Suspended users</span>
            </div>
          </div>
        </div>

        {/* Popular Subjects & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group with Most Meetings This Week */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Group with Most Meetings</h3>
              <p className="text-sm text-slate-500 font-medium">Most active group this week</p>
            </div>
            <div className="p-6">
              {stats?.group_with_most_meetings ? (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-lg">
                      {stats.group_with_most_meetings.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-black text-slate-900 mb-1">{stats.group_with_most_meetings.name}</h4>
                      <p className="text-sm text-slate-600 font-medium mb-3">{stats.group_with_most_meetings.subject}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-700">
                            {stats.group_with_most_meetings.events_count} meeting{stats.group_with_most_meetings.events_count !== 1 ? 's' : ''} this week
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <p className="text-xs text-slate-500 font-medium">
                          Led by <span className="font-bold text-slate-700">{stats.group_with_most_meetings.creator.name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No meetings scheduled this week</p>
                </div>
              )}
            </div>
          </div>

          {/* Most Reported Users */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Most Reported Users</h3>
              <p className="text-sm text-slate-500 font-medium">Users with highest report count</p>
            </div>
            <div className="p-6">
              {stats?.most_reported_users && stats.most_reported_users.length > 0 ? (
                <div className="space-y-4">
                  {stats.most_reported_users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="w-10 h-10 bg-red-200 text-red-700 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span className="text-sm font-black text-red-700">{user.report_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No reports yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Recent Activity Feed</h3>
            <p className="text-sm text-slate-500 font-medium">Latest platform activities</p>
          </div>
          <div className="p-6">
            {stats?.recent_activity_feed && stats.recent_activity_feed.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_activity_feed.map((activity, index) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'user_joined':
                        return <Users size={16} className="text-blue-600" />;
                      case 'group_created':
                        return <UsersIcon size={16} className="text-emerald-600" />;
                      case 'report_submitted':
                        return <AlertTriangle size={16} className="text-red-600" />;
                      default:
                        return <Activity size={16} className="text-slate-600" />;
                    }
                  };

                  const getActivityBg = (type: string) => {
                    switch (type) {
                      case 'user_joined':
                        return 'bg-blue-100';
                      case 'group_created':
                        return 'bg-emerald-100';
                      case 'report_submitted':
                        return 'bg-red-100';
                      default:
                        return 'bg-slate-100';
                    }
                  };

                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-8 h-8 ${getActivityBg(activity.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{getTimeAgo(new Date(activity.timestamp))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            )}
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
              {stats?.recent_users.slice(0, 5).map((user: any) => (
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
              {stats?.recent_groups.slice(0, 5).map((group: any) => (
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

        {/* Recent Ratings and Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Ratings */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Recent Ratings</h3>
              <p className="text-sm text-slate-500 font-medium">Latest group ratings submitted</p>
            </div>
            <div className="p-6 space-y-4">
              {stats?.recent_ratings && stats.recent_ratings.length > 0 ? (
                stats.recent_ratings.slice(0, 5).map((rating: any) => (
                  <div key={rating.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                      <Star size={20} className="fill-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{rating.group_name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">by {rating.user_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-slate-700">{rating.group_rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-slate-400">Group</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No ratings yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Recent Events</h3>
              <p className="text-sm text-slate-500 font-medium">Latest scheduled events</p>
            </div>
            <div className="p-6 space-y-4">
              {stats?.recent_events && stats.recent_events.length > 0 ? (
                stats.recent_events.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                      <Calendar size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{event.title}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{event.type}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No events yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
