import React, { useState, useEffect } from 'react';
import { X, Users, Mail, BookOpen, Clock, Check, XCircle, Loader2 } from 'lucide-react';
import { PendingJoinRequest } from '../types';
import { apiService } from '../services/apiService';

interface PendingRequestsModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onRequestProcessed: () => void;
}

const PendingRequestsModal: React.FC<PendingRequestsModalProps> = ({
  groupId,
  groupName,
  onClose,
  onRequestProcessed
}) => {
  const [requests, setRequests] = useState<PendingJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUser, setRejectingUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, [groupId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPendingRequests(groupId);
      console.log('Pending requests loaded:', data);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests', err);
      alert('Could not load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    if (!confirm(`Approve ${userName} to join ${groupName}?`)) return;

    setProcessingId(userId);
    try {
      await apiService.approveJoinRequest(groupId, userId);
      alert(`${userName} has been approved!`);
      await loadRequests();
      onRequestProcessed();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (userId: string, userName: string) => {
    setRejectingUser({ id: userId, name: userName });
    setShowRejectReasonModal(true);
  };

  const handleRejectWithReason = async (reason?: string) => {
    if (!rejectingUser) return;

    setProcessingId(rejectingUser.id);
    setShowRejectReasonModal(false);

    try {
      await apiService.rejectJoinRequest(groupId, rejectingUser.id, reason);
      alert(`${rejectingUser.name}'s request has been declined.`);
      await loadRequests();
      onRequestProcessed();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request.');
    } finally {
      setProcessingId(null);
      setRejectingUser(null);
      setRejectionReason('');
    }
  };

  const handleCancelReject = () => {
    setShowRejectReasonModal(false);
    setRejectingUser(null);
    setRejectionReason('');
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
            <h3 className="text-3xl font-black tracking-tight">Join Requests</h3>
            <p className="text-orange-100 text-sm font-bold mt-1">{groupName}</p>
            <p className="text-xs text-orange-200 mt-2">Status: {loading ? 'Loading...' : `${requests.length} requests`}</p>
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
          {/* TEST BUTTONS - These should ALWAYS show */}
          <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-xl">
            <p className="text-xs font-bold mb-2">TEST: Can you see these buttons?</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-emerald-500 text-white rounded font-bold">
                TEST APPROVE
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded font-bold">
                TEST REJECT
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 size={48} className="animate-spin text-orange-500" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Users size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-bold">No pending requests</p>
              <p className="text-xs text-slate-400">When users request to join, they'll appear here.</p>
              <p className="text-xs text-slate-600 mt-4 font-mono">Debug: requests.length = {requests.length}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 mb-4 font-mono">Debug: Found {requests.length} pending request(s)</p>
              {requests.map((request, index) => (
                <div
                  key={request.id}
                  className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 space-y-4"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-lg border border-orange-200 shrink-0">
                      {request.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-lg">{request.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Mail size={12} />
                        <span className="font-semibold truncate">{request.email}</span>
                      </div>
                      {request.major && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <BookOpen size={12} />
                          <span className="font-semibold">{request.major}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Clock size={12} />
                        <span className="font-bold uppercase tracking-widest">
                          Requested {formatTimeAgo(request.requested_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-mono">User ID: {request.id}</p>
                    </div>
                  </div>

                  {/* Actions - Always visible at bottom */}
                  <div className="flex gap-3 pt-4 border-t border-slate-300">
                    <button
                      onClick={() => {
                        console.log('Approve clicked for:', request.id, request.name);
                        handleApprove(request.id, request.name);
                      }}
                      disabled={processingId === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg"
                    >
                      {processingId === request.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        console.log('Reject clicked for:', request.id, request.name);
                        handleReject(request.id, request.name);
                      }}
                      disabled={processingId === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 shadow-lg"
                    >
                      {processingId === request.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </div>
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

      {/* Rejection Reason Modal */}
      {showRejectReasonModal && rejectingUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-red-500 p-8 text-white">
              <h3 className="text-2xl font-black tracking-tight">Reject Request</h3>
              <p className="text-red-100 text-sm font-bold mt-1">{rejectingUser.name}</p>
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

export default PendingRequestsModal;
