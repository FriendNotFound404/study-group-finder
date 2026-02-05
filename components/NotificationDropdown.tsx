
import React, { useState } from 'react';
import { AppNotification } from '../types';
import { MessageSquare, UserPlus, Calendar, Clock, Check, X, Loader2, XCircle } from 'lucide-react';
import { apiService } from '../services/apiService';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClose: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  onRefresh?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkRead, onClose, onNotificationClick, onRefresh }) => {
  const [processing, setProcessing] = useState<number | null>(null);
  const [processedNotifications, setProcessedNotifications] = useState<{ [key: number]: 'approved' | 'rejected' }>({});
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-orange-500" />;
      case 'group_join': return <UserPlus size={16} className="text-blue-500" />;
      case 'event': return <Calendar size={16} className="text-emerald-500" />;
      case 'join_request': return <UserPlus size={16} className="text-amber-500" />;
      case 'join_approved': return <Check size={16} className="text-emerald-500" />;
      case 'join_rejected': return <X size={16} className="text-red-500" />;
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

  const handleReject = async (e: React.MouseEvent, notification: AppNotification) => {
    e.stopPropagation();
    const groupId = notification.data.group_id;
    const userId = notification.data.user_id;

    if (!groupId || !userId) {
      alert('Invalid notification data');
      return;
    }

    setProcessing(notification.id);
    try {
      await apiService.rejectJoinRequest(groupId, userId.toString());
      setProcessedNotifications(prev => ({ ...prev, [notification.id]: 'rejected' }));
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
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
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onNotificationClick?.(n)}
              className={`p-5 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read_at ? 'bg-orange-50/30' : ''}`}
            >
              <div className="mt-1 shrink-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                {getIcon(n.type)}
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {n.data.message}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {getTimeAgo(n.created_at)}
                </p>
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
          ))
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
    </div>
  );
};

export default NotificationDropdown;
