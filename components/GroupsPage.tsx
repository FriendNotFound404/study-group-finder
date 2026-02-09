import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Calendar as CalendarIcon, MessageSquare, Info, MoreHorizontal, Sparkles, Loader2, BookOpen, Mic, X, Users as UsersIcon, Clock, MapPin, Search, Archive, Unlock, Lock as LockIcon, CheckCircle2, Edit2, Trash2, Bell, UserX, Paperclip, File as FileIcon, LogOut, Repeat, Plus } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { StudyGroup, Message, User, GroupStatus, GroupMember } from '../types';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';
import LiveStudySession from './LiveStudySession';
import PendingRequestsModal from './PendingRequestsModal';
// FIX: Import API_CONFIG from constants to resolve reference error in handleDeleteGroup
import { API_CONFIG } from '../constants';

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(searchParams.get('group'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [kickingMemberId, setKickingMemberId] = useState<number | null>(null);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const [newMeeting, setNewMeeting] = useState({ title: '', start_time: '', location: '', recurrence: 'none' });
  const [scheduling, setScheduling] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Unread message counts per group (persisted in localStorage)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const getStoredCounts = (): Record<string, number> => {
    try {
      const stored = localStorage.getItem('lastSeenMessageCounts');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  };
  const saveStoredCounts = (counts: Record<string, number>) => {
    localStorage.setItem('lastSeenMessageCounts', JSON.stringify(counts));
  };

  // Track last activity time per group for sorting
  const [lastActivity, setLastActivity] = useState<Record<string, number>>({});
  const updateLastActivity = (groupId: string) => {
    setLastActivity(prev => ({ ...prev, [groupId]: Date.now() }));
  };

  // Meetings management state
  const [showMeetingsModal, setShowMeetingsModal] = useState(false);
  const [groupEvents, setGroupEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [rescheduleEvent, setRescheduleEvent] = useState<any | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Edit Group State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState({
    name: '',
    description: '',
    max_members: 5,
    location: '',
    subject: '',
    faculty: ''
  });

  const [currentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const searchQuery = (searchParams.get('q') || '').toLowerCase();

  const filteredMyGroups = useMemo(() => {
    if (!searchQuery) return myGroups;
    return myGroups.filter(g =>
      g.name.toLowerCase().includes(searchQuery) ||
      g.subject.toLowerCase().includes(searchQuery)
    );
  }, [myGroups, searchQuery]);

  // Sort groups: unread messages first, then by most recent activity
  const sortedFilteredGroups = useMemo(() => {
    return [...filteredMyGroups].sort((a, b) => {
      const aUnread = unreadCounts[a.id] || 0;
      const bUnread = unreadCounts[b.id] || 0;

      // Groups with unread messages always float to top
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;

      // Then sort by most recent activity
      const aActivity = lastActivity[a.id] || 0;
      const bActivity = lastActivity[b.id] || 0;
      return bActivity - aActivity; // Most recent first
    });
  }, [filteredMyGroups, unreadCounts, lastActivity]);

  const activeGroup = myGroups.find(g => g.id === activeGroupId);
  const isLeader = activeGroup?.creator_id === currentUser?.id;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const studyPlanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyGroups();
    // Request browser notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMyGroups = async () => {
    try {
      const allGroups = await apiService.getGroups();
      const joined = allGroups.filter(g => g.is_member);
      setMyGroups(joined);
      if (!activeGroupId && joined.length > 0) {
        setActiveGroupId(joined[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      setLoadingMembers(true);
      const members = await apiService.getGroupMembers(groupId);
      setGroupMembers(members);
    } catch (err: any) {
      console.error("Failed to fetch members", err);
      alert(err.message || 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeGroupId) {
      const activeGroupName = myGroups.find(g => g.id === activeGroupId)?.name;
      console.log(`[Group Switch] Switching to group: ${activeGroupName} (${activeGroupId})`);

      const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
          const data = await apiService.getMessages(activeGroupId);
          console.log(`[Group Switch] Fetched ${data.length} messages for ${activeGroupName}`);
          // Set messages directly when group changes (don't merge with other groups)
          setMessages(data);
          // Mark this group as seen with current message count
          const stored = getStoredCounts();
          stored[activeGroupId] = data.length;
          saveStoredCounts(stored);
          console.log(`[Group Switch] Updated stored count for ${activeGroupName}: ${data.length}`);
        } catch (err) {
          console.error("Failed to fetch messages", err);
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
      setSummary(null);
      setStudyPlan(null);

      // Clear unread badge for this group immediately
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[activeGroupId];
        console.log(`[Group Switch] Cleared badge for ${activeGroupName}`);
        return next;
      });

      const q = searchParams.get('q');
      const newParams: any = { group: activeGroupId };
      if (q) newParams.q = q;
      setSearchParams(newParams);
    }
  }, [activeGroupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll to summary when it's generated
  useEffect(() => {
    if (summary) {
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [summary]);

  // Auto-scroll to study plan when it's generated
  useEffect(() => {
    if (studyPlan) {
      setTimeout(() => {
        studyPlanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [studyPlan]);

  // Poll for new messages in the active group (real-time feel)
  useEffect(() => {
    if (!activeGroupId) return;
    const activeGroupName = myGroups.find(g => g.id === activeGroupId)?.name;
    const interval = setInterval(async () => {
      try {
        const data = await apiService.getMessages(activeGroupId);
        setMessages(data);
        // Update stored count to prevent badge from reappearing after switching groups
        const stored = getStoredCounts();
        stored[activeGroupId] = data.length;
        saveStoredCounts(stored);
        console.log(`[Active Poll] Updated ${activeGroupName}: ${data.length} messages, stored count: ${data.length}`);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [activeGroupId, myGroups]);

  // Poll all groups for unread message counts using localStorage
  useEffect(() => {
    if (myGroups.length === 0) return;

    const pollUnread = async () => {
      const storedAtStart = getStoredCounts();
      const newBaselines: Record<string, number> = {};
      const counts: Record<string, number> = {};
      console.log('[Polling] Starting unread poll. Active group:', activeGroupId);
      console.log('[Polling] Stored counts:', storedAtStart);

      await Promise.all(
        myGroups.map(async (group) => {
          if (group.id === activeGroupId) {
            console.log(`[Polling] Skipping active group: ${group.name} (${group.id})`);
            return;
          }
          try {
            const msgs = await apiService.getMessages(group.id);
            const currentCount = msgs.length;
            const lastSeen = storedAtStart[group.id];
            console.log(`[Polling] Group "${group.name}" (${group.id}): current=${currentCount}, lastSeen=${lastSeen}`);

            if (lastSeen === undefined) {
              // First time seeing this group - record baseline, no badge
              newBaselines[group.id] = currentCount;
              console.log(`[Polling] First time seeing "${group.name}", setting baseline to ${currentCount}`);
            } else if (currentCount > lastSeen) {
              const newCount = currentCount - lastSeen;
              counts[group.id] = newCount;
              console.log(`[Polling] NEW MESSAGES in "${group.name}": ${newCount} new (${lastSeen} → ${currentCount})`);

              // Update last activity for this group to float it to top
              updateLastActivity(group.id);

              // Send browser push notification for new messages
              if ('Notification' in window && Notification.permission === 'granted') {
                const lastMsg = msgs[msgs.length - 1];
                new Notification(`${group.name}`, {
                  body: `${lastMsg?.user_name || 'Someone'}: ${lastMsg?.content || 'sent a message'}`,
                  tag: `group-${group.id}`,
                });
              }
            } else {
              console.log(`[Polling] No new messages in "${group.name}"`);
            }
          } catch (err) {
            console.error(`[Polling] Error fetching messages for "${group.name}":`, err);
          }
        })
      );

      // Merge new baselines with current stored counts (don't overwrite existing values)
      if (Object.keys(newBaselines).length > 0) {
        const currentStored = getStoredCounts(); // Re-fetch to get latest
        const merged = { ...currentStored, ...newBaselines };
        saveStoredCounts(merged);
        console.log('[Polling] Saved new baselines:', newBaselines);
      }

      console.log('[Polling] Setting unread badges:', counts);
      console.log('[Polling] Groups with unread counts:', Object.keys(counts).map(id => `${myGroups.find(g => g.id === id)?.name}(${id}): ${counts[id]}`));
      setUnreadCounts(counts);
    };

    pollUnread();
    const interval = setInterval(pollUnread, 15000);
    return () => clearInterval(interval);
  }, [myGroups, activeGroupId]);

  useEffect(() => {
    if (showMembersModal && activeGroupId) {
      fetchGroupMembers(activeGroupId);
    }
  }, [showMembersModal, activeGroupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !activeGroupId || activeGroup?.status === GroupStatus.ARCHIVED) return;

    try {
      const sentMsg = await apiService.sendMessage(activeGroupId, inputText, selectedFile || undefined);
      setMessages(prev => {
        const updated = [...prev, sentMsg];
        // Update stored count immediately to prevent badge reappearing after switching groups
        const stored = getStoredCounts();
        stored[activeGroupId] = updated.length;
        saveStoredCounts(stored);
        console.log(`[Send Message] Sent message in ${activeGroup?.name}. Updated stored count to ${updated.length}`);
        return updated;
      });
      // Update last activity when sending a message
      updateLastActivity(activeGroupId);
      setInputText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setIsSummarizing(true);
    const content = messages.map(m => `${m.user_name}: ${m.content}`);
    const res = await geminiService.summarizeChat(content);
    setSummary(res || 'No summary available.');
    setIsSummarizing(false);
  };

  const handleGeneratePlan = async () => {
    if (!activeGroup) return;
    setIsGeneratingPlan(true);
    const plan = await geminiService.suggestStudyPlan(activeGroup.subject);
    setStudyPlan(plan);
    setIsGeneratingPlan(false);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    setScheduling(true);
    try {
      await apiService.createEvent({
        title: newMeeting.title,
        start_time: newMeeting.start_time,
        location: newMeeting.location,
        recurrence: newMeeting.recurrence,
        type: 'Group Meeting',
        group_id: activeGroupId
      });

      // Share meeting details to group chat
      const dateStr = new Date(newMeeting.start_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const recurrenceLabel = newMeeting.recurrence !== 'none' ? ` (Repeats ${newMeeting.recurrence})` : '';
      const locationStr = newMeeting.location ? `\nLocation: ${newMeeting.location}` : '';
      const chatMsg = `📅 New Meeting Scheduled!\n\n${newMeeting.title}\n${dateStr}${recurrenceLabel}${locationStr}\n\nAll members have been notified.`;
      try {
        const sentMsg = await apiService.sendMessage(activeGroupId, chatMsg);
        setMessages(prev => [...prev, sentMsg]);
      } catch {}

      setNewMeeting({ title: '', start_time: '', location: '', recurrence: 'none' });
      setShowScheduleForm(false);
      await fetchGroupEvents(activeGroupId);
    } catch (err) {
      alert("Scheduling failed.");
    } finally {
      setScheduling(false);
    }
  };

  const updateStatus = async (status: GroupStatus) => {
    if (!activeGroupId) return;
    setIsUpdatingStatus(true);
    try {
      await apiService.updateGroup(activeGroupId, { status });
      await fetchMyGroups();
      setIsStatusMenuOpen(false);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!activeGroup) return;
    setEditGroupData({
      name: activeGroup.name,
      description: activeGroup.description,
      max_members: activeGroup.max_members,
      location: activeGroup.location,
      subject: activeGroup.subject,
      faculty: activeGroup.faculty
    });
    setIsEditModalOpen(true);
    setIsStatusMenuOpen(false);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    setIsUpdatingStatus(true);
    try {
      await apiService.updateGroup(activeGroupId, editGroupData);
      await fetchMyGroups();
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update group");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroupId || !activeGroup) return;
    if (!confirm(`Are you absolutely sure you want to delete "${activeGroup.name}"? This action cannot be undone and all data will be lost.`)) return;

    try {
      // Assuming apiService.deleteGroup exists or we add it (it should call DELETE /api/groups/:id)
      const res = await fetch(`${API_CONFIG.BASE_URL}/groups/${activeGroupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete group");
      
      alert("Group dissolved successfully.");
      setActiveGroupId(null);
      fetchMyGroups();
    } catch (err) {
      alert("Failed to delete group.");
    }
  };

  const handleKickMember = async (userId: number, userName: string) => {
    if (!activeGroupId) return;
    if (!confirm(`Remove ${userName} from ${activeGroup?.name}? This member will lose access to all group resources.`)) return;

    setKickingMemberId(userId);
    try {
      await apiService.kickMember(activeGroupId, String(userId));
      alert(`${userName} has been removed from the group.`);
      await fetchGroupMembers(activeGroupId);
      await fetchMyGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    } finally {
      setKickingMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeGroupId || !activeGroup) return;
    if (!confirm(`Are you sure you want to leave "${activeGroup.name}"?`)) return;

    setLeavingGroup(true);
    try {
      await apiService.leaveGroup(activeGroupId);
      setShowMembersModal(false);
      setActiveGroupId(null);
      await fetchMyGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group.');
    } finally {
      setLeavingGroup(false);
    }
  };

  const fetchGroupEvents = async (groupId: string) => {
    setLoadingEvents(true);
    try {
      const allEvents = await apiService.getEvents();
      setGroupEvents(allEvents.filter((e: any) => e.group_id === groupId));
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDeleteMeeting = async (eventId: string) => {
    if (!confirm('Delete this meeting? This cannot be undone.')) return;
    setActionLoading(eventId);
    try {
      await apiService.deleteEvent(eventId);
      if (activeGroupId) await fetchGroupEvents(activeGroupId);
    } catch (err) {
      alert('Failed to delete meeting.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleMeeting = async () => {
    if (!rescheduleEvent || !rescheduleTime) return;
    setActionLoading(rescheduleEvent.id);
    try {
      // Delete old event then create a new one with updated time
      await apiService.deleteEvent(rescheduleEvent.id);
      await apiService.createEvent({
        title: rescheduleEvent.title,
        type: rescheduleEvent.type || 'Group Meeting',
        start_time: rescheduleTime,
        location: rescheduleEvent.location || '',
        recurrence: rescheduleEvent.recurrence || 'none',
        group_id: rescheduleEvent.group_id || activeGroupId,
      });
      setRescheduleEvent(null);
      setRescheduleTime('');
      if (activeGroupId) await fetchGroupEvents(activeGroupId);
    } catch (err) {
      alert('Failed to reschedule meeting.');
    } finally {
      setActionLoading(null);
    }
  };


  const getStatusBadge = (status: GroupStatus) => {
    switch (status) {
      case GroupStatus.OPEN:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider"><Unlock size={12}/> Open</span>;
      case GroupStatus.CLOSED:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider"><LockIcon size={12}/> Closed</span>;
      case GroupStatus.ARCHIVED:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider"><Archive size={12}/> Archived</span>;
      default:
        return null;
    }
  };

  if (loadingGroups) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Study Groups</h2>
        <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
          {myGroups.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center space-y-4">
              <UsersIcon size={32} className="mx-auto text-slate-200" />
              <p className="text-sm font-medium text-slate-400">You haven't joined any groups yet.</p>
              <Link to="/home" className="inline-block text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-600">Browse Feed</Link>
            </div>
          ) : (
            <>
              {sortedFilteredGroups.length === 0 && searchQuery && (
                <div className="p-8 text-center opacity-40">
                  <Search size={24} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No matching groups</p>
                </div>
              )}
              {sortedFilteredGroups.map(group => {
                const unread = unreadCounts[group.id] || 0;
                if (unread > 0) {
                  console.log(`[Badge] Group "${group.name}" (${group.id}) has ${unread} unread messages. Active: ${activeGroupId === group.id}`);
                }
                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`w-full text-left p-5 rounded-[2rem] border transition-all relative ${
                      activeGroupId === group.id
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-100 scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${group.status === GroupStatus.ARCHIVED ? 'grayscale opacity-80' : ''}`}
                  >
                    {unread > 0 && activeGroupId !== group.id && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-200 animate-in zoom-in duration-200">
                        {unread}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${activeGroupId === group.id ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>
                        {group.name[0]}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeGroupId === group.id ? 'text-orange-100' : 'text-slate-400'}`}>
                          {group.subject}
                        </span>
                        {group.status !== GroupStatus.OPEN && (
                           <span className={`${activeGroupId === group.id ? 'text-white/60' : 'text-slate-300'}`}>
                              {group.status === GroupStatus.ARCHIVED ? <Archive size={10} /> : <LockIcon size={10} />}
                           </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold truncate">{group.name}</h3>
                    <p className={`text-[10px] font-bold mt-1 ${activeGroupId === group.id ? 'text-orange-50' : 'text-slate-400'}`}>
                      {group.members_count} Members • {group.status}
                    </p>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {activeGroup && (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Tools</h4>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || activeGroup.status === GroupStatus.ARCHIVED}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all gap-2 disabled:opacity-50"
              >
                {isGeneratingPlan ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />}
                <span className="text-[10px] font-black uppercase">Study Plan</span>
              </button>
              <button
                onClick={() => setShowLiveSession(true)}
                disabled={activeGroup.status === GroupStatus.ARCHIVED}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-all gap-2 disabled:opacity-50"
              >
                <Mic size={18} />
                <span className="text-[10px] font-black uppercase">Live Room</span>
              </button>
              {(activeGroup.is_member || isLeader) && (
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-all gap-2"
                >
                  <UsersIcon size={18} />
                  <span className="text-[10px] font-black uppercase">Members</span>
                </button>
              )}
              {isLeader && (
                <button
                  onClick={() => { setShowMeetingsModal(true); setShowScheduleForm(false); if (activeGroupId) fetchGroupEvents(activeGroupId); }}
                  disabled={activeGroup.status === GroupStatus.ARCHIVED}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all gap-2 col-span-2 disabled:opacity-50"
                >
                  <CalendarIcon size={18} />
                  <span className="text-[10px] font-black uppercase">Meetings</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm relative ${activeGroup?.status === GroupStatus.ARCHIVED ? 'bg-slate-50/50' : ''}`}>
        {activeGroup ? (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${activeGroup.status === GroupStatus.ARCHIVED ? 'bg-slate-400 shadow-slate-100' : 'bg-orange-500 shadow-orange-100'}`}>
                  {activeGroup.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-none">{activeGroup.name}</h3>
                    {getStatusBadge(activeGroup.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activeGroup.status === GroupStatus.OPEN ? (
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    ) : (
                       <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeGroup.members_count} members enrolled • Led by{' '}
                      <Link
                        to={`/profile/${activeGroup.creator_id}`}
                        className="hover:text-orange-500 transition-colors cursor-pointer"
                      >
                        {activeGroup.creator_name}
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLeader && activeGroup.pending_requests_count > 0 && (
                  <button
                    onClick={() => setShowPendingRequestsModal(true)}
                    className="relative flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <Bell size={16} />
                    <span>{activeGroup.pending_requests_count} Request{activeGroup.pending_requests_count !== 1 ? 's' : ''}</span>
                  </button>
                )}
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing || activeGroup.status === GroupStatus.ARCHIVED}
                  className="p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all relative group disabled:opacity-30"
                >
                  {isSummarizing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>
                
                <div className="relative" ref={statusMenuRef}>
                   <button 
                     onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                     className={`p-2.5 rounded-xl transition-all ${isStatusMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
                   >
                     <MoreHorizontal size={20} />
                   </button>
                   {isStatusMenuOpen && isLeader && (
                      <div className="absolute top-12 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Manage Hub</p>
                        </div>
                        <button 
                          onClick={handleOpenEditModal}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors text-slate-600"
                        >
                          <Edit2 size={14} />
                          <span className="text-xs font-bold flex-1">Edit Hub Details</span>
                        </button>
                        <button 
                          onClick={() => updateStatus(GroupStatus.OPEN)}
                          disabled={isUpdatingStatus}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 transition-colors ${activeGroup.status === GroupStatus.OPEN ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                        >
                          <Unlock size={14} />
                          <span className="text-xs font-bold flex-1">Set Open</span>
                          {activeGroup.status === GroupStatus.OPEN && <CheckCircle2 size={12} />}
                        </button>
                        <button 
                          onClick={() => updateStatus(GroupStatus.CLOSED)}
                          disabled={isUpdatingStatus}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50 transition-colors ${activeGroup.status === GroupStatus.CLOSED ? 'text-amber-600 bg-amber-50' : 'text-slate-600'}`}
                        >
                          <LockIcon size={14} />
                          <span className="text-xs font-bold flex-1">Set Closed</span>
                          {activeGroup.status === GroupStatus.CLOSED && <CheckCircle2 size={12} />}
                        </button>
                        <button 
                          onClick={() => updateStatus(GroupStatus.ARCHIVED)}
                          disabled={isUpdatingStatus}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors ${activeGroup.status === GroupStatus.ARCHIVED ? 'text-slate-900 bg-slate-50' : 'text-slate-400'}`}
                        >
                          <Archive size={14} />
                          <span className="text-xs font-bold flex-1">Archive Hub</span>
                          {activeGroup.status === GroupStatus.ARCHIVED && <CheckCircle2 size={12} />}
                        </button>
                        <div className="border-t border-slate-50">
                          <button 
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-500"
                          >
                            <Trash2 size={14} />
                            <span className="text-xs font-bold flex-1">Dissolve Hub</span>
                          </button>
                        </div>
                      </div>
                   )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {activeGroup.status === GroupStatus.ARCHIVED && (
                 <div className="bg-slate-100 border border-slate-200 p-6 rounded-[2rem] text-center space-y-2 mb-4 animate-in slide-in-from-top-2">
                    <Archive size={32} className="mx-auto text-slate-400" />
                    <h4 className="font-bold text-slate-700">This hub is archived</h4>
                    <p className="text-xs text-slate-500 font-medium">Messages are read-only. Leaders can reactivate the hub at any time.</p>
                 </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-slate-300" />
                </div>
              ) : (
                <>
                  {summary && (
                    <div ref={summaryRef} className="bg-orange-50 border border-orange-100 p-5 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Sparkles size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">AI Catch-up</span>
                      </div>
                      <p className="text-sm text-orange-800 leading-relaxed font-medium">{summary}</p>
                      <button onClick={() => setSummary(null)} className="text-[10px] font-black text-orange-400 uppercase mt-4 hover:text-orange-600 transition-colors">Dismiss</button>
                    </div>
                  )}

                  {studyPlan && (
                    <div ref={studyPlanRef} className="bg-blue-50 border border-blue-100 p-6 rounded-3xl shadow-sm mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <BookOpen size={20} />
                          <span className="text-xs font-bold uppercase tracking-widest">Suggested Study Plan</span>
                        </div>
                        <button onClick={() => setStudyPlan(null)} className="text-blue-300 hover:text-blue-500">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="text-sm text-blue-800 leading-relaxed prose prose-blue max-w-none whitespace-pre-wrap font-medium">
                        {studyPlan}
                      </div>
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div className="text-center py-10 space-y-2 opacity-30">
                      <MessageSquare size={32} className="mx-auto" />
                      <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => {
                    const isMe = msg.user_id === currentUser?.id;
                    const isGroupLeader = msg.user_id === activeGroup.creator_id;
                    const isImage = msg.file_type?.startsWith('image/');
                    const fileUrl = msg.file_path ? `${API_CONFIG.BASE_URL.replace('/api', '')}/storage/${msg.file_path}` : null;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <Link
                            to={`/profile/${msg.user_id}`}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-orange-500 transition-colors cursor-pointer"
                          >
                            {msg.user_name}
                            {isGroupLeader && <span className="ml-1.5 text-[8px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded border border-orange-200">LEADER</span>}
                          </Link>
                          <span className="text-[10px] font-medium text-slate-300">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                          isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}>
                          {msg.content && <div className="mb-2">{msg.content}</div>}
                          {msg.file_path && (
                            <div className="space-y-2">
                              {isImage && fileUrl ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                  <img
                                    src={fileUrl}
                                    alt={msg.file_name || 'Uploaded image'}
                                    className="max-w-full max-h-64 rounded-xl border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer"
                                  />
                                  <div className={`flex items-center gap-2 mt-2 text-xs ${isMe ? 'text-orange-100' : 'text-slate-500'}`}>
                                    <FileIcon size={14} />
                                    <span className="truncate">{msg.file_name}</span>
                                  </div>
                                </a>
                              ) : (
                                <a
                                  href={fileUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                    isMe ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-100 hover:bg-slate-200'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg ${isMe ? 'bg-orange-700' : 'bg-white'}`}>
                                    <FileIcon size={20} className={isMe ? 'text-white' : 'text-slate-600'} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>
                                      {msg.file_name}
                                    </div>
                                    <div className={`text-xs ${isMe ? 'text-orange-100' : 'text-slate-500'}`}>
                                      {msg.file_size ? `${(msg.file_size / 1024).toFixed(1)} KB` : 'File'}
                                    </div>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={`p-6 bg-white border-t border-slate-100 ${activeGroup.status === GroupStatus.ARCHIVED ? 'pointer-events-none opacity-50 grayscale' : ''}`}>
              {selectedFile && (
                <div className="mb-3 flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl">
                  <FileIcon size={16} className="text-orange-600" />
                  <span className="text-sm font-semibold text-orange-900 flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-orange-600">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:bg-white transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={activeGroup.status === GroupStatus.ARCHIVED}
                  className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 border border-slate-200"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  disabled={activeGroup.status === GroupStatus.ARCHIVED}
                  placeholder={activeGroup.status === GroupStatus.ARCHIVED ? "Hub is archived" : "Share a thought or question..."}
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-slate-700"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedFile) || activeGroup.status === GroupStatus.ARCHIVED}
                  className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-orange-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <MessageSquare size={64} className="mb-6 opacity-20" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No group selected</h3>
            <p className="max-w-xs">Pick a study group from the left to start collaborating with your classmates.</p>
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-orange-500 p-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Edit Hub</h3>
                <p className="text-orange-100 text-sm font-bold mt-1">Update your session details</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateGroup} className="p-10 space-y-6">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hub Name</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={editGroupData.name}
                    onChange={e => setEditGroupData({...editGroupData, name: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject Area</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={editGroupData.subject}
                    onChange={e => setEditGroupData({...editGroupData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Faculty</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={editGroupData.faculty}
                    onChange={e => setEditGroupData({...editGroupData, faculty: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold resize-none"
                  value={editGroupData.description}
                  onChange={e => setEditGroupData({...editGroupData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Max Students</label>
                  <input 
                    type="number"
                    min={2}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={editGroupData.max_members}
                    onChange={e => setEditGroupData({...editGroupData, max_members: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={editGroupData.location}
                    onChange={e => setEditGroupData({...editGroupData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLiveSession && activeGroup && (
        <LiveStudySession
          subject={activeGroup.subject}
          onClose={() => setShowLiveSession(false)}
        />
      )}

      {showPendingRequestsModal && activeGroup && (
        <PendingRequestsModal
          groupId={activeGroup.id}
          groupName={activeGroup.name}
          onClose={() => setShowPendingRequestsModal(false)}
          onRequestProcessed={() => {
            fetchMyGroups();
          }}
        />
      )}

      {showMembersModal && activeGroup && (activeGroup.is_member || isLeader) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-purple-500 p-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Group Details</h3>
                <p className="text-purple-100 text-sm font-bold mt-1">{activeGroup.name}</p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[600px] overflow-y-auto space-y-6">
              {/* Group Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black text-2xl border border-purple-200 shrink-0">
                    {activeGroup.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xl mb-2">{activeGroup.name}</h4>
                    <p className="text-sm text-slate-600 mb-3">{activeGroup.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        {activeGroup.subject}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {activeGroup.faculty}
                      </span>
                      {getStatusBadge(activeGroup.status)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Leader</p>
                    <p className="text-sm font-bold text-slate-900">{activeGroup.creator_name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Members</p>
                    <p className="text-sm font-bold text-slate-900">{activeGroup.members_count} / {activeGroup.max_members}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</p>
                    <p className="text-sm font-bold text-slate-900">{activeGroup.location}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Created</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(activeGroup.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UsersIcon className="text-purple-600" size={24} />
                  <h4 className="text-lg font-bold text-slate-900">Members ({activeGroup.members_count})</h4>
                </div>

                {loadingMembers ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={32} className="animate-spin text-purple-600" />
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl text-center">
                    <p className="text-sm text-slate-600">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
                        <Link
                          to={`/profile/${member.id}`}
                          className={`w-12 h-12 ${member.is_leader ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer hover:scale-105 transition-transform`}
                        >
                          {member.name[0]}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              to={`/profile/${member.id}`}
                              className="font-bold text-slate-900 hover:text-orange-500 transition-colors cursor-pointer"
                            >
                              {member.name}
                            </Link>
                            {member.is_leader && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{member.email}</p>
                          {member.major && (
                            <p className="text-xs text-slate-600 mt-1">
                              <span className="font-bold">Major:</span> {member.major}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              Joined {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          {isLeader && !member.is_leader && (
                            <button
                              onClick={() => handleKickMember(member.id, member.name)}
                              disabled={kickingMemberId === member.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove member from group"
                            >
                              {kickingMemberId === member.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                              Kick
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Close
              </button>
              {!isLeader && (
                <button
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {leavingGroup ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Leave Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Meetings Management Modal */}
      {showMeetingsModal && activeGroup && isLeader && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-500 p-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Meetings</h3>
                <p className="text-emerald-100 text-sm font-bold mt-1">{activeGroup.name}</p>
              </div>
              <button
                onClick={() => { setShowMeetingsModal(false); setShowScheduleForm(false); }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[500px] overflow-y-auto space-y-4">
              {/* Inline Schedule Form */}
              {showScheduleForm && (
                <form onSubmit={handleScheduleMeeting} className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">New Meeting</p>
                    <button type="button" onClick={() => setShowScheduleForm(false)} className="text-emerald-400 hover:text-emerald-600"><X size={16} /></button>
                  </div>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      required placeholder="Meeting title"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                      value={newMeeting.title}
                      onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="datetime-local" required
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                        value={newMeeting.start_time}
                        onChange={e => setNewMeeting({...newMeeting, start_time: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 appearance-none"
                        value={newMeeting.recurrence}
                        onChange={e => setNewMeeting({...newMeeting, recurrence: e.target.value})}
                      >
                        <option value="none">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      placeholder="Location or link (optional)"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                      value={newMeeting.location}
                      onChange={e => setNewMeeting({...newMeeting, location: e.target.value})}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={scheduling}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    {scheduling ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Schedule & Share to Chat</>}
                  </button>
                </form>
              )}

              {/* Meetings List */}
              {loadingEvents ? (
                <div className="flex items-center justify-center p-10">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                </div>
              ) : groupEvents.length === 0 && !showScheduleForm ? (
                <div className="p-10 text-center space-y-3">
                  <CalendarIcon size={40} className="mx-auto text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">No meetings scheduled yet</p>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="text-xs font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600"
                  >
                    Schedule one now
                  </button>
                </div>
              ) : (
                groupEvents
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map((event) => {
                    const isPast = new Date(event.start_time) < new Date();
                    return (
                      <div key={event.id} className={`p-5 rounded-2xl border transition-all ${isPast ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-slate-900 truncate">{event.title}</h4>
                              {event.recurrence && event.recurrence !== 'none' && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase shrink-0">
                                  <Repeat size={10} />
                                  {event.recurrence}
                                </span>
                              )}
                              {isPast && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase shrink-0">Past</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span className="font-bold">
                                  {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} />
                                  <span className="font-medium truncate">{event.location}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Reschedule */}
                            <button
                              onClick={() => { setRescheduleEvent(event); setRescheduleTime(event.start_time?.slice(0, 16) || ''); }}
                              disabled={actionLoading === event.id}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              title="Reschedule"
                            >
                              <CalendarIcon size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteMeeting(event.id)}
                              disabled={actionLoading === event.id}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                              title="Delete"
                            >
                              {actionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => { setShowMeetingsModal(false); setShowScheduleForm(false); }}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Close
              </button>
              {!showScheduleForm && (
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  <Plus size={14} />
                  New Meeting
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleEvent && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-blue-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Reschedule Meeting</h3>
                <p className="text-blue-100 text-xs font-bold mt-1 truncate">{rescheduleEvent.title}</p>
              </div>
              <button onClick={() => setRescheduleEvent(null)}><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Date & Time</label>
                <p className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500">
                  {new Date(rescheduleEvent.start_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">New Date & Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="datetime-local"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setRescheduleEvent(null)}
                  className="flex-1 py-3 border-2 border-slate-100 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleMeeting}
                  disabled={!rescheduleTime || actionLoading === rescheduleEvent.id}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === rescheduleEvent.id ? <Loader2 size={14} className="animate-spin" /> : 'Reschedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
