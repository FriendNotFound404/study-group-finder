import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Calendar as CalendarIcon, MessageSquare, Info, MoreHorizontal, Sparkles, Loader2, BookOpen, Mic, X, Users as UsersIcon, Clock, MapPin, Search, Archive, Unlock, Lock as LockIcon, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { StudyGroup, Message, User, GroupStatus } from '../types';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';
import LiveStudySession from './LiveStudySession';
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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', start_time: '', location: '' });
  const [scheduling, setScheduling] = useState(false);

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

  const activeGroup = myGroups.find(g => g.id === activeGroupId);
  const isLeader = activeGroup?.creator_id === currentUser?.id;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyGroups();
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

  useEffect(() => {
    if (activeGroupId) {
      const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
          const data = await apiService.getMessages(activeGroupId);
          setMessages(data);
        } catch (err) {
          console.error("Failed to fetch messages", err);
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
      setSummary(null);
      setStudyPlan(null);
      
      const q = searchParams.get('q');
      const newParams: any = { group: activeGroupId };
      if (q) newParams.q = q;
      setSearchParams(newParams);
    }
  }, [activeGroupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeGroupId || activeGroup?.status === GroupStatus.ARCHIVED) return;

    try {
      const sentMsg = await apiService.sendMessage(activeGroupId, inputText);
      setMessages(prev => [...prev, sentMsg]);
      setInputText('');
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
        ...newMeeting,
        type: 'Group Meeting',
        group_id: activeGroupId
      });
      setIsScheduleModalOpen(false);
      setNewMeeting({ title: '', start_time: '', location: '' });
      alert("Meeting scheduled! All members have been notified.");
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
              {filteredMyGroups.length === 0 && searchQuery && (
                <div className="p-8 text-center opacity-40">
                  <Search size={24} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No matching groups</p>
                </div>
              )}
              {filteredMyGroups.map(group => (
                <button 
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full text-left p-5 rounded-[2rem] border transition-all ${
                    activeGroupId === group.id 
                      ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-100 scale-[1.02]' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${group.status === GroupStatus.ARCHIVED ? 'grayscale opacity-80' : ''}`}
                >
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
              ))}
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
              {isLeader && (
                <button 
                  onClick={() => setIsScheduleModalOpen(true)}
                  disabled={activeGroup.status === GroupStatus.ARCHIVED}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all gap-2 col-span-2 disabled:opacity-50"
                >
                  <CalendarIcon size={18} />
                  <span className="text-[10px] font-black uppercase">Schedule Meeting</span>
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeGroup.members_count} members enrolled • Led by {activeGroup.creator_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Sparkles size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">AI Catch-up</span>
                      </div>
                      <p className="text-sm text-orange-800 leading-relaxed font-medium">{summary}</p>
                      <button onClick={() => setSummary(null)} className="text-[10px] font-black text-orange-400 uppercase mt-4 hover:text-orange-600 transition-colors">Dismiss</button>
                    </div>
                  )}

                  {studyPlan && (
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl shadow-sm mb-6">
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
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {msg.user_name}
                            {isGroupLeader && <span className="ml-1.5 text-[8px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded border border-orange-200">LEADER</span>}
                          </span>
                          <span className="text-[10px] font-medium text-slate-300">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                          isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={`p-6 bg-white border-t border-slate-100 ${activeGroup.status === GroupStatus.ARCHIVED ? 'pointer-events-none opacity-50 grayscale' : ''}`}>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:bg-white transition-all">
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
                  disabled={!inputText.trim() || activeGroup.status === GroupStatus.ARCHIVED}
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

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Schedule Meeting</h3>
                <p className="text-emerald-50 text-xs font-bold">A notification will be sent to all members</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Meeting Title</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    required placeholder="e.g. Chapter 4 Review" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                    value={newMeeting.title}
                    onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date & Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="datetime-local" required 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                    value={newMeeting.start_time}
                    onChange={e => setNewMeeting({...newMeeting, start_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Location/Link</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    placeholder="e.g. Library Room 2 or Zoom Link" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                    value={newMeeting.location}
                    onChange={e => setNewMeeting({...newMeeting, location: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={scheduling}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
              >
                {scheduling ? <Loader2 size={18} className="animate-spin" /> : "Broadcast to Members"}
              </button>
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
    </div>
  );
};

export default GroupsPage;
