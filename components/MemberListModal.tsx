import React, { useState, useEffect } from 'react';
import { X, Users, Mail, BookOpen, Clock, UserX, Loader2, Crown } from 'lucide-react';
import { GroupMember } from '../types';
import { apiService } from '../services/apiService';

interface MemberListModalProps {
  groupId: string;
  groupName: string;
  isLeader: boolean;
  onClose: () => void;
  onMemberKicked: () => void;
}

const MemberListModal: React.FC<MemberListModalProps> = ({
  groupId,
  groupName,
  isLeader,
  onClose,
  onMemberKicked
}) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getGroupMembers(groupId);
      console.log('Members loaded:', data);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members', err);
      alert('Could not load members.');
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from ${groupName}?`)) return;

    setProcessingId(userId);
    try {
      await apiService.kickMember(groupId, String(userId));
      alert(`${userName} has been removed from the group.`);
      await loadMembers();
      onMemberKicked();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-orange-500 p-10 flex justify-between items-center text-white">
          <div>
            <h3 className="text-3xl font-black tracking-tight">Group Members</h3>
            <p className="text-orange-100 text-sm font-bold mt-1">{groupName}</p>
            <p className="text-xs text-orange-200 mt-2">Status: {loading ? 'Loading...' : `${members.length} members`}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 size={48} className="animate-spin text-orange-500" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Users size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-bold">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 space-y-4"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-lg border border-orange-200 shrink-0">
                      {member.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-lg">{member.name}</h4>
                        {member.is_leader && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                            <Crown size={12} />
                            <span>Leader</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Mail size={12} />
                        <span className="font-semibold truncate">{member.email}</span>
                      </div>
                      {member.major && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <BookOpen size={12} />
                          <span className="font-semibold">{member.major}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Clock size={12} />
                        <span className="font-bold uppercase tracking-widest">
                          Joined {formatTimeAgo(member.joined_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Only show kick button for leaders and only for non-leader members */}
                  {isLeader && !member.is_leader && (
                    <div className="flex gap-3 pt-4 border-t border-slate-300">
                      <button
                        onClick={() => {
                          console.log('Kick clicked for:', member.id, member.name);
                          handleKick(member.id, member.name);
                        }}
                        disabled={processingId === member.id}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 shadow-lg"
                      >
                        {processingId === member.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <UserX size={16} />
                        )}
                        Remove Member
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberListModal;
