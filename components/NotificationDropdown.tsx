
import React from 'react';
import { AppNotification } from '../types';
import { MessageSquare, UserPlus, Calendar, Clock, Check } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkRead, onClose }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-orange-500" />;
      case 'group_join': return <UserPlus size={16} className="text-blue-500" />;
      case 'event': return <Calendar size={16} className="text-emerald-500" />;
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
              className={`p-5 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read_at ? 'bg-orange-50/30' : ''}`}
            >
              <div className="mt-1 shrink-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                {getIcon(n.type)}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {n.data.message}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {getTimeAgo(n.created_at)}
                </p>
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
