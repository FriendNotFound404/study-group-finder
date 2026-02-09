import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, Shield, RefreshCw, Clock, User as UserIcon, AlertOctagon, Ban, Search, CheckCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface ReportData {
  id: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  group_name?: string; // Contains "Report: [username]"
  created_at: string;
}

interface PaginatedResponse {
  data: ReportData[];
  current_page: number;
  last_page: number;
  total: number;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchReports(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchReports = async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8001/api/admin/feedback?page=${currentPage}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch reports');

      const data: PaginatedResponse = await response.json();
      console.log("Admin reports data from backend:", data);
      if (data.data.length > 0) {
        console.log("First admin report structure:", data.data[0]);
      }
      setReports(data.data);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
      setTotalReports(data.total);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchReports();
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

  const handleDelete = async (id: number) => {
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8001/api/admin/feedback/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete report');

      alert('Report deleted successfully!');
      setDeleteConfirm(null);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const handleWarnUser = async (userId: string) => {
    if (!confirm('Are you sure you want to warn this user? They will be banned after 3 warnings.')) {
      return;
    }

    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8001/api/admin/users/${userId}/warn`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to warn user');

      const data = await response.json();
      if (data.auto_banned) {
        alert('User has been warned and automatically banned (3 warnings reached)');
      } else {
        alert(`User warned successfully! Warning count: ${data.user.warnings}/3`);
      }
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to warn user');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently ban this user?')) {
      return;
    }

    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8001/api/admin/users/${userId}/ban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to ban user');

      alert('User banned successfully!');
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user? Their warnings will be reset.')) {
      return;
    }

    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8001/api/admin/users/${userId}/unban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to unban user');

      alert('User unbanned successfully! Their warnings have been reset.');
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to unban user');
    }
  };

  const getSeverityBadge = (severity: number) => {
    const configs = [
      { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Minor' },
      { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Low' },
      { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Medium' },
      { bg: 'bg-orange-100', text: 'text-orange-600', label: 'High' },
      { bg: 'bg-red-100', text: 'text-red-600', label: 'Critical' },
    ];
    const config = configs[severity - 1] || configs[2];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const parseReportData = (report: ReportData) => {
    // Parse the stored feedback format
    const comment = report.comment || '';
    const textParts = comment.split('\n\n');

    // Extract reported user name from group_name field (format: "Report: John Doe")
    let reportedUser = 'Unknown User';
    if (report.group_name && report.group_name.startsWith('Report: ')) {
      reportedUser = report.group_name.replace('Report: ', '').trim();
    }

    // Extract reason (first part after "Reason: ")
    const reason = textParts[0]?.replace('Reason: ', '').trim() || 'Not specified';

    // Extract description (second part after "Details: ")
    const description = textParts[1]?.replace('Details: ', '').trim() || '';

    // Extract reported user info (remaining parts)
    const reportedUserInfo = textParts.slice(2).join('\n');
    const reportedUserId = reportedUserInfo.match(/Reported User ID: (\d+)/)?.[1] || '';
    const reportedUserEmail = reportedUserInfo.match(/Reported User Email: ([^\n]+)/)?.[1]?.trim() || '';

    return { reportedUser, reason, description, reportedUserId, reportedUserEmail };
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const { reportedUser, reason, description, reportedUserEmail } = parseReportData(report);
    return (
      reportedUser.toLowerCase().includes(search) ||
      reason.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      reportedUserEmail.toLowerCase().includes(search) ||
      report.user_name.toLowerCase().includes(search) ||
      report.user_email.toLowerCase().includes(search)
    );
  });

  const criticalReports = filteredReports.filter(r => r.rating >= 4).length;
  const averageSeverity = filteredReports.length > 0
    ? (filteredReports.reduce((sum, r) => sum + r.rating, 0) / filteredReports.length).toFixed(1)
    : '0.0';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">User Reports Management</h1>
              <p className="text-slate-500 font-medium">
                {totalReports} total user reports {searchTerm && `(${filteredReports.length} matching)`}
              </p>
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

          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by user, reason, description, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Severity</p>
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-400" />
                <span className="text-2xl font-black text-slate-900">{averageSeverity}</span>
                <span className="text-sm text-slate-500">/ 5.0</span>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Critical Reports</p>
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-red-400" />
                <span className="text-2xl font-black text-slate-900">{criticalReports}</span>
                <span className="text-sm text-slate-500">high priority</span>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Review</p>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-blue-400" />
                <span className="text-2xl font-black text-slate-900">{totalReports}</span>
                <span className="text-sm text-slate-500">awaiting action</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {loading ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
              <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
              <Shield size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">
                {reports.length === 0 ? 'No reports received yet' : 'No reports match your search'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredReports.map((item) => {
                console.log("Admin parsing report:", item);
                const { reportedUser, reason, description, reportedUserId, reportedUserEmail } = parseReportData(item);
                console.log("Admin parsed data:", { reportedUser, reason, description, reportedUserId, reportedUserEmail });
                return (
                  <div key={item.id} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                              <UserIcon size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-black text-slate-900 text-lg">{reportedUser}</p>
                                {getSeverityBadge(item.rating)}
                              </div>
                              {reportedUserEmail && (
                                <p className="text-sm text-slate-500">{reportedUserEmail}</p>
                              )}
                              <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full">
                                <p className="text-xs font-bold text-slate-600">{reason}</p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4 mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reporter Information</p>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                                {item.user_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.user_name}</p>
                                <p className="text-xs text-slate-500">{item.user_email}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete report"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm text-slate-400">
                          Reported on {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>

                      {description && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                          <p className="text-slate-700 leading-relaxed">{description}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {reportedUserId && (
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                          <button
                            onClick={() => handleWarnUser(reportedUserId)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all"
                          >
                            <AlertOctagon size={18} />
                            Warn
                          </button>
                          <button
                            onClick={() => handleBanUser(reportedUserId)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
                          >
                            <Ban size={18} />
                            Ban
                          </button>
                          <button
                            onClick={() => handleUnbanUser(reportedUserId)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
                          >
                            <CheckCircle size={18} />
                            Unban
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 px-6 py-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Delete Report?</h3>
              <p className="text-slate-600 text-center mb-6">
                This action cannot be undone. This report will be permanently removed from the system.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
