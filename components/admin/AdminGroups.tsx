import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Users, MapPin, BookOpen, Loader2, UsersIcon, AlertCircle, Unlock, Lock, Archive, RefreshCw, Clock, CheckCircle, XCircle, HelpCircle, UserCheck, MessageSquare } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface GroupData {
  id: string;
  name: string;
  subject: string;
  faculty: string;
  description: string;
  max_members: number;
  location: string;
  status: string;
  approval_status: string;
  members_count: number;
  created_at: string;
  creator: {
    name: string;
    email: string;
  };
}

interface PaginatedResponse {
  data: GroupData[];
  current_page: number;
  last_page: number;
  total: number;
}

const AdminGroups: React.FC = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);

  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    faculty: '',
    description: '',
    max_members: 5,
    location: '',
    status: 'open'
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Approval modals
  const [approvingGroup, setApprovingGroup] = useState<GroupData | null>(null);
  const [rejectingGroup, setRejectingGroup] = useState<GroupData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Transfer ownership modal
  const [transferringGroup, setTransferringGroup] = useState<GroupData | null>(null);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // Chat logs viewer modal
  const [viewingChatLogs, setViewingChatLogs] = useState<GroupData | null>(null);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchGroups();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGroups(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, searchQuery, statusFilter, approvalFilter]);

  const fetchGroups = async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups?page=${currentPage}&search=${searchQuery}&status=${statusFilter}&approval_status=${approvalFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch groups');

      const data: PaginatedResponse = await response.json();
      setGroups(data.data);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
      setTotalGroups(data.total);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchGroups();
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

  const handleEdit = (group: GroupData) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      subject: group.subject,
      faculty: group.faculty,
      description: group.description,
      max_members: group.max_members,
      location: group.location,
      status: group.status
    });
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;

    setSaving(true);
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${editingGroup.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm)
        }
      );

      if (!response.ok) throw new Error('Failed to update group');

      alert('Group updated successfully!');
      setEditingGroup(null);
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete group');

      alert('Group deleted successfully!');
      setDeleteConfirm(null);
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete group');
    }
  };

  const handleApproveGroup = async () => {
    if (!approvingGroup) return;

    setSaving(true);
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${approvingGroup.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to approve group');

      alert('Group approved successfully!');
      setApprovingGroup(null);
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to approve group');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectGroup = async () => {
    if (!rejectingGroup) return;

    setSaving(true);
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${rejectingGroup.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      if (!response.ok) throw new Error('Failed to reject group');

      alert('Group rejected successfully!');
      setRejectingGroup(null);
      setRejectionReason('');
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to reject group');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTransferModal = async (group: GroupData) => {
    setTransferringGroup(group);

    // Fetch group members
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/groups/${group.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch group members');

      const data = await response.json();
      setGroupMembers(data.members || []);
    } catch (err) {
      console.error('Failed to load group members:', err);
      alert('Failed to load group members');
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferringGroup || !newOwnerId) return;

    setSaving(true);
    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${transferringGroup.id}/transfer-ownership`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_owner_id: newOwnerId })
        }
      );

      if (!response.ok) throw new Error('Failed to transfer ownership');

      alert('Ownership transferred successfully!');
      setTransferringGroup(null);
      setNewOwnerId('');
      setGroupMembers([]);
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer ownership');
    } finally {
      setSaving(false);
    }
  };

  const handleViewChatLogs = async (group: GroupData) => {
    setViewingChatLogs(group);
    setLoadingLogs(true);

    try {
      const userStr = localStorage.getItem('admin_auth');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const token = user.token;

      const response = await fetch(
        `http://localhost:8000/api/admin/groups/${group.id}/chat-logs`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch chat logs');

      const data = await response.json();
      setChatLogs(data.messages || []);
    } catch (err) {
      console.error('Failed to load chat logs:', err);
      alert('Failed to load chat logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg"><Unlock size={12}/> Open</span>;
      case 'closed':
        return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg"><Lock size={12}/> Closed</span>;
      case 'archived':
        return <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg"><Archive size={12}/> Archived</span>;
      default:
        return null;
    }
  };

  const getApprovalBadge = (approval_status: string) => {
    switch (approval_status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg"><CheckCircle size={12}/> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg"><XCircle size={12}/> Rejected</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg"><HelpCircle size={12}/> Pending</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Group Management</h1>
              <p className="text-slate-500 font-medium">
                {totalGroups} total study groups
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

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold text-slate-900"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Approval Filter */}
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold text-slate-900"
            >
              <option value="">All Approvals</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">No groups found</p>
              <p className="text-sm text-slate-400 mt-1">Groups will appear here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Group</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Leader</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Faculty</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Members</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Approval</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groups.map((group) => (
                      <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">{group.name}</p>
                            <p className="text-sm text-slate-500">{group.subject}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-700">{group.creator.name}</p>
                            <p className="text-xs text-slate-500">{group.creator.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-700">{group.faculty}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-purple-600" />
                            <span className="text-sm font-bold text-slate-700">
                              {group.members_count}/{group.max_members}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(group.status)}
                        </td>
                        <td className="px-6 py-4">
                          {getApprovalBadge(group.approval_status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 font-medium">
                            {new Date(group.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {group.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setApprovingGroup(group)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Approve group"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => setRejectingGroup(group)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Reject group"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleViewChatLogs(group)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                              title="View chat logs"
                            >
                              <MessageSquare size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenTransferModal(group)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Transfer ownership"
                            >
                              <UserCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(group)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit group"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(group.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete group"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-purple-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Edit Group</h3>
                <p className="text-purple-100 text-sm font-bold mt-1">Update group information</p>
              </div>
              <button
                onClick={() => setEditingGroup(null)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Group Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Faculty</label>
                  <input
                    type="text"
                    value={editForm.faculty}
                    onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Max Members</label>
                  <input
                    type="number"
                    min="2"
                    value={editForm.max_members}
                    onChange={(e) => setEditForm({ ...editForm, max_members: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 py-4 bg-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Delete Group?</h3>
              <p className="text-slate-600 text-center mb-6">
                This action cannot be undone. All messages and group data will be permanently deleted.
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

      {/* Approve Group Modal */}
      {approvingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Approve Group?</h3>
              <p className="text-slate-600 text-center mb-2">
                You are about to approve the following group:
              </p>
              <div className="bg-emerald-50 p-4 rounded-xl mb-6">
                <p className="font-bold text-slate-900">{approvingGroup.name}</p>
                <p className="text-sm text-slate-600">{approvingGroup.subject}</p>
                <p className="text-xs text-slate-500 mt-1">Created by: {approvingGroup.creator.name}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApproveGroup}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </button>
                <button
                  onClick={() => setApprovingGroup(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Group Modal */}
      {rejectingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Reject Group</h3>
                <p className="text-red-100 text-sm font-bold mt-1">Provide a reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setRejectingGroup(null);
                  setRejectionReason('');
                }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                <p className="font-bold text-slate-900">{rejectingGroup.name}</p>
                <p className="text-sm text-slate-600">{rejectingGroup.subject}</p>
                <p className="text-xs text-slate-500 mt-1">Created by: {rejectingGroup.creator.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why this group is being rejected..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none font-bold resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRejectGroup}
                  disabled={saving || !rejectionReason.trim()}
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Reject Group
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setRejectingGroup(null);
                    setRejectionReason('');
                  }}
                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferringGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-purple-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Transfer Ownership</h3>
                <p className="text-purple-100 text-sm font-bold mt-1">Assign a new group leader</p>
              </div>
              <button
                onClick={() => {
                  setTransferringGroup(null);
                  setNewOwnerId('');
                  setGroupMembers([]);
                }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <p className="font-bold text-slate-900">{transferringGroup.name}</p>
                <p className="text-sm text-slate-600">{transferringGroup.subject}</p>
                <p className="text-xs text-slate-500 mt-1">Current leader: {transferringGroup.creator.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">New Owner</label>
                {groupMembers.length > 0 ? (
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                  >
                    <option value="">Select a member</option>
                    {groupMembers.map((member: any) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <Loader2 size={16} className="animate-spin text-purple-600" />
                    <span className="text-sm text-slate-600 font-medium">Loading members...</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">⚠️ Important</p>
                <ul className="text-sm text-slate-700 space-y-1 font-medium">
                  <li>• The current leader will become a regular member</li>
                  <li>• The new owner will have full group management rights</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTransferOwnership}
                  disabled={saving || !newOwnerId}
                  className="flex-1 py-4 bg-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Transfer Ownership
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setTransferringGroup(null);
                    setNewOwnerId('');
                    setGroupMembers([]);
                  }}
                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Logs Viewer Modal */}
      {viewingChatLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Chat Logs</h3>
                <p className="text-teal-100 text-sm font-bold mt-1">{viewingChatLogs.name}</p>
              </div>
              <button
                onClick={() => {
                  setViewingChatLogs(null);
                  setChatLogs([]);
                }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-6 max-h-[600px] overflow-y-auto">
                {loadingLogs ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-teal-600 mb-4" />
                    <p className="text-slate-600 font-bold">Loading chat logs...</p>
                  </div>
                ) : !Array.isArray(chatLogs) || chatLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-bold">No messages yet</p>
                    <p className="text-sm text-slate-400 mt-1">Chat messages will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatLogs.map((message: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                              {message.user?.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{message.user?.name || 'Unknown User'}</p>
                              <p className="text-xs text-slate-500">{message.user?.email || 'No email'}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        {message.content && (
                          <p className="text-slate-700 font-medium ml-13 mb-2">{message.content}</p>
                        )}
                        {message.file_path && (
                          <div className="ml-13 mt-2 bg-slate-50 p-3 rounded-xl border-2 border-slate-200 inline-block">
                            <div className="flex items-center gap-3">
                              <div className="bg-teal-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <a
                                  href={`http://localhost:8000/storage/${message.file_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline"
                                >
                                  {message.file_name}
                                </a>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-xs text-slate-500">{message.file_type}</p>
                                  {message.file_size && (
                                    <p className="text-xs text-slate-500">
                                      {(message.file_size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setViewingChatLogs(null);
                  setChatLogs([]);
                }}
                className="w-full mt-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGroups;
