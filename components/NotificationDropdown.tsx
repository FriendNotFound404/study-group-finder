
import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { MessageSquare, UserPlus, Calendar, Clock, Check, X, Loader2, XCircle, UserX, AlertTriangle, Shield, Ban, Key, Award, CheckCircle, RefreshCw, ShieldCheck, Archive } from 'lucide-react';
import { apiService } from '../services/apiService';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClose: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  onRefresh?: () => void;
}

const PROCESSED_NOTIFICATIONS_KEY = 'processed_notifications';

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkRead, onClose, onNotificationClick, onRefresh }) => {
  const [processing, setProcessing] = useState<number | null>(null);
  const [processedNotifications, setProcessedNotifications] = useState<{ [key: number]: 'approved' | 'rejected' }>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(PROCESSED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingNotification, setRejectingNotification] = useState<AppNotification | null>(null);

  // Save to localStorage whenever processedNotifications changes
  useEffect(() => {
    try {
      localStorage.setItem(PROCESSED_NOTIFICATIONS_KEY, JSON.stringify(processedNotifications));
    } catch (err) {
      console.error('Failed to save processed notifications:', err);
    }
  }, [processedNotifications]);

  // Clean up processed notifications that are no longer in the notifications list
  useEffect(() => {
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    const processed = { ...processedNotifications };
    let hasChanges = false;

    // Remove processed notifications that are no longer present
    Object.keys(processed).forEach(idStr => {
      const id = parseInt(idStr);
      if (!currentNotificationIds.has(id)) {
        delete processed[id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setProcessedNotifications(processed);
    }
  }, [notifications]);
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-orange-500" />;
      case 'group_join': return <UserPlus size={16} className="text-blue-500" />;
      case 'event': return <Calendar size={16} className="text-emerald-500" />;
      case 'join_request': return <UserPlus size={16} className="text-amber-500" />;
      case 'join_approved': return <Check size={16} className="text-emerald-500" />;
      case 'join_rejected': return <X size={16} className="text-red-500" />;
      case 'removed_from_group': return <UserX size={16} className="text-red-600" />;
      case 'report_submitted': return <Shield size={16} className="text-red-500" />;
      case 'user_warned': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'user_banned': return <Ban size={16} className="text-red-600" />;
      case 'user_suspended': return <Ban size={16} className="text-orange-600" />;
      case 'role_changed': return <Award size={16} className="text-purple-600" />;
      case 'group_approved': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'group_rejected': return <XCircle size={16} className="text-red-600" />;
      case 'ownership_transferred': return <RefreshCw size={16} className="text-blue-600" />;
      case 'ownership_received': return <Award size={16} className="text-blue-600" />;
      case 'group_leadership_changed': return <RefreshCw size={16} className="text-slate-600" />;
      case 'password_reset': return <Key size={16} className="text-teal-600" />;
      case 'report_resolved': return <ShieldCheck size={16} className="text-green-600" />;
      case 'new_report': return <Shield size={16} className="text-orange-600" />;
      case 'warning_received': return <AlertTriangle size={16} className="text-amber-600" />;
      case 'group_archived_admin': return <Archive size={16} className="text-slate-600" />;
      case 'suspension_lifted': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'ban_lifted': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'new_group_pending': return <AlertTriangle size={16} className="text-blue-600" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAccept = async (e: React.MouseEvent, notification: AppNotification) => {
    e.stopPropagation();
    const groupId = notification.data.group_id;
    const userId = notification.data.user_id;

    if (!groupId || !userId) {
      alert('Invalid notification data');
      return;
    }

    setProcessing(notification.id);
    try {
      await apiService.approveJoinRequest(groupId, userId.toString());
      setProcessedNotifications(prev => ({ ...prev, [notification.id]: 'approved' }));
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (e: React.MouseEvent, notification: AppNotification) => {
    e.stopPropagation();
    setRejectingNotification(notification);
    setShowRejectReasonModal(true);
  };

  const handleRejectWithReason = async (reason?: string) => {
    if (!rejectingNotification) return;

    const groupId = rejectingNotification.data.group_id;
    const userId = rejectingNotification.data.user_id;

    if (!groupId || !userId) {
      alert('Invalid notification data');
      return;
    }

    setProcessing(rejectingNotification.id);
    setShowRejectReasonModal(false);

    try {
      await apiService.rejectJoinRequest(groupId, userId.toString(), reason);
      setProcessedNotifications(prev => ({ ...prev, [rejectingNotification.id]: 'rejected' }));
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setProcessing(null);
      setRejectingNotification(null);
      setRejectionReason('');
    }
  };

  const handleCancelReject = () => {
    setShowRejectReasonModal(false);
    setRejectingNotification(null);
    setRejectionReason('');
  };

  return (
    <div className="absolute top-14 right-0 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
        <button 
          onClick={onMarkRead}
          className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 hover:text-orange-600 transition-colors"
        >
          <Check size={12} />
          Read All
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2 opacity-30">
            <Clock size={32} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest">Clear for now</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isWarning = n.type === 'user_warned' || n.type === 'warning_received';
            const isBan = n.type === 'user_banned';
            const isSuspended = n.type === 'user_suspended';
            const isReport = n.type === 'report_submitted' || n.type === 'new_report';
            const isRoleChanged = n.type === 'role_changed' || n.type === 'ownership_received';
            const isGroupApproved = n.type === 'group_approved';
            const isPasswordReset = n.type === 'password_reset';
            const isArchived = n.type === 'group_archived_admin';
            const bgColor = isBan
              ? 'bg-red-50/50 border-l-4 border-l-red-500'
              : isSuspended
              ? 'bg-orange-50/50 border-l-4 border-l-orange-500'
              : isWarning
              ? 'bg-amber-50/50 border-l-4 border-l-amber-500'
              : isReport
              ? 'bg-red-50/30 border-l-4 border-l-red-400'
              : isRoleChanged
              ? 'bg-purple-50/50 border-l-4 border-l-purple-500'
              : isGroupApproved
              ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500'
              : isPasswordReset
              ? 'bg-teal-50/50 border-l-4 border-l-teal-500'
              : isArchived
              ? 'bg-slate-50/50 border-l-4 border-l-slate-500'
              : !n.read_at
              ? 'bg-orange-50/30'
              : '';

            return (
              <div
                key={n.id}
                onClick={() => onNotificationClick?.(n)}
                className={`p-5 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${bgColor}`}
              >
                <div className="mt-1 shrink-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1 flex-1">
                  <p className={`text-xs font-bold leading-tight ${isBan ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-slate-800'}`}>
                    {n.data.message}
                  </p>
                  {/* Show reason for warning, ban, and suspend notifications */}
                  {(isWarning || isBan || isSuspended) && n.data.reason && (
                    <p className="text-[11px] font-semibold text-slate-600 leading-snug mt-1 italic">
                      Reason: {n.data.reason}
                    </p>
                  )}
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {getTimeAgo(n.created_at)}
                  </p>
                </div>
                {n.type === 'join_request' && (
                  processedNotifications[n.id] ? (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-center ${
                      processedNotifications[n.id] === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {processedNotifications[n.id] === 'approved' ? 'Approved!' : 'Rejected!'}
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => handleAccept(e, n)}
                        disabled={processing === n.id}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-black bg-emerald-500 text-white px-3 py-2 rounded-lg uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all"
                      >
                        {processing === n.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Check size={10} />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={(e) => handleReject(e, n)}
                        disabled={processing === n.id}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-black bg-red-500 text-white px-3 py-2 rounded-lg uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all"
                      >
                        {processing === n.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <XCircle size={10} />
                        )}
                        Reject
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          );
          })
        )}
      </div>
      
      <div className="p-4 bg-slate-50 text-center">
        <button
          onClick={onClose}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectReasonModal && rejectingNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-red-500 p-8 text-white">
              <h3 className="text-2xl font-black tracking-tight">Reject Request</h3>
              <p className="text-red-100 text-sm font-bold mt-1">{rejectingNotification.data.user_name || 'User'}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-700 font-semibold text-sm">
                Would you like to provide a reason for rejecting this request? This is optional.
              </p>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Group is full, Looking for members with specific background, etc."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-red-400 focus:outline-none font-semibold text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {rejectionReason.length}/500 characters
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleCancelReject}
                className="flex-1 px-6 py-3 bg-slate-300 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectWithReason()}
                className="flex-1 px-6 py-3 bg-slate-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-600 transition-all"
              >
                Skip & Reject
              </button>
              <button
                onClick={() => handleRejectWithReason(rejectionReason.trim() || undefined)}
                disabled={rejectionReason.trim().length === 0}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send & Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
