
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, MapPin, Sparkles, Loader2, X, AlertCircle, Search, Eraser, Filter, ChevronDown, Lock, Archive, Unlock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { StudyGroup, User, GroupStatus } from '../types';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';

const HomePage: React.FC = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [facultyFilter, setFacultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [currentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [newGroup, setNewGroup] = useState({
    subject: '',
    goal: '',
    description: '',
    max_members: 5,
    location: '',
    faculty: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (err: any) {
      console.error("Failed to load groups:", err);
      setError("Could not connect to the campus server. Make sure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const faculties = useMemo(() => Array.from(new Set(groups.map(g => g.faculty))).sort(), [groups]);
  const subjects = useMemo(() => Array.from(new Set(groups.map(g => g.subject))).sort(), [groups]);
  const locations = useMemo(() => Array.from(new Set(groups.map(g => g.location))).sort(), [groups]);

  const filteredGroups = useMemo(() => {
    const results = groups.filter(g => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (
        g.name.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.faculty.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.creator_name.toLowerCase().includes(q) ||
        g.location.toLowerCase().includes(q)
      );

      const matchesFaculty = !facultyFilter || g.faculty === facultyFilter;
      const matchesSubject = !subjectFilter || g.subject === subjectFilter;
      const matchesLocation = !locationFilter || g.location === locationFilter;
      const matchesStatus = !statusFilter || g.status === statusFilter;

      return matchesSearch && matchesFaculty && matchesSubject && matchesLocation && matchesStatus;
    });

    return results.sort((a, b) => {
      if (b.members_count !== a.members_count) {
        return b.members_count - a.members_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [groups, searchQuery, facultyFilter, subjectFilter, locationFilter, statusFilter]);

  const handleJoinLeave = async (id: string, currentlyMember: boolean) => {
    try {
      if (currentlyMember) {
        await apiService.leaveGroup(id);
      } else {
        await apiService.joinGroup(id);
      }
      await loadGroups(); 
    } catch (err: any) {
      alert(err.message || "Action failed.");
    }
  };

  const getStatusBadge = (status: GroupStatus) => {
    switch (status) {
      case GroupStatus.OPEN:
        return <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg"><Unlock size={10}/> Open</span>;
      case GroupStatus.CLOSED:
        return <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg"><Lock size={10}/> Closed</span>;
      case GroupStatus.ARCHIVED:
        return <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg"><Archive size={10}/> Archived</span>;
      default: return null;
    }
  };

  const handleAIDescription = async () => {
    if (!newGroup.subject || !newGroup.goal) {
      alert("Please fill in the Subject and Goal first!");
      return;
    }
    setIsGenerating(true);
    const desc = await geminiService.generateGroupDescription(newGroup.subject, newGroup.goal);
    setNewGroup(prev => ({ ...prev, description: desc || '' }));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createGroup({
        name: `${newGroup.subject} Study Session`,
        ...newGroup
      });
      setIsModalOpen(false);
      loadGroups();
      setNewGroup({ subject: '', goal: '', description: '', max_members: 5, location: '', faculty: '' });
    } catch (err: any) {
      alert("Failed to create group: " + err.message);
    }
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setFacultyFilter('');
    setSubjectFilter('');
    setLocationFilter('');
    setStatusFilter('');
  };

  const activeFilterCount = [facultyFilter, subjectFilter, locationFilter, statusFilter, searchQuery].filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Feed</h1>
          <p className="text-slate-500 font-medium">
            {searchQuery 
              ? `Showing results for "${searchQuery}"` 
              : "Find your next study session"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border ${
              activeFilterCount > 0 || showFilters
                ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Faculty</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-all cursor-pointer pr-10"
                  value={facultyFilter}
                  onChange={e => setFacultyFilter(e.target.value)}
                >
                  <option value="">All Faculties</option>
                  {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-all cursor-pointer pr-10"
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-all cursor-pointer pr-10"
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                >
                  <option value="">Any Location</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-all cursor-pointer pr-10"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value={GroupStatus.OPEN}>Open</option>
                  <option value={GroupStatus.CLOSED}>Closed</option>
                  <option value={GroupStatus.ARCHIVED}>Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              onClick={clearAllFilters}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-1.5"
            >
              <Eraser size={14} />
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4 text-amber-800">
          <AlertCircle className="shrink-0 mt-1" size={20} />
          <div>
            <p className="font-bold">Connection Issue</p>
            <p className="text-sm opacity-80">{error}</p>
            <button onClick={loadGroups} className="mt-3 text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Retry Connection</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 size={48} className="animate-spin text-orange-500" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing with AU Servers...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredGroups.length === 0 && !error && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
              {activeFilterCount > 0 ? (
                <>
                  <Search size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-bold text-slate-400 mb-4">No groups match your current criteria.</p>
                  <button 
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 mx-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    <Eraser size={18} />
                    Reset Search & Filters
                  </button>
                </>
              ) : (
                <>
                  <Users size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-bold text-slate-400">No active sessions right now.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 text-orange-500 font-black text-xs uppercase tracking-widest">Start the first one</button>
                </>
              )}
            </div>
          )}
          
          {filteredGroups.map(group => {
            const isFull = group.members_count >= group.max_members;
            const isClosed = group.status === GroupStatus.CLOSED;
            const isArchived = group.status === GroupStatus.ARCHIVED;
            const canJoin = !group.is_member && !isFull && !isClosed && !isArchived;

            return (
              <div key={group.id} className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden ${isArchived ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl border border-orange-200/50">
                      {group.creator_name ? group.creator_name[0] : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{group.creator_name}</h3>
                        {getStatusBadge(group.status)}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{new Date(group.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {group.subject}
                  </div>
                </div>

                <div className="mb-8">
                  <Link to={`/groups?group=${group.id}`} className="block group/title inline-block">
                    <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover/title:text-orange-500 transition-colors">{group.name}</h2>
                  </Link>
                  <p className="text-slate-500 leading-relaxed font-medium line-clamp-2">{group.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 mb-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12}/> Capacity</p>
                    <p className={`text-sm font-bold ${isFull ? 'text-amber-600' : 'text-slate-700'}`}>{group.members_count} / {group.max_members}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Primary Hub</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{group.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Faculty</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{group.faculty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleJoinLeave(group.id, !!group.is_member)}
                    disabled={!canJoin && !group.is_member}
                    className={`flex-1 md:flex-none px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      group.is_member 
                        ? 'bg-white border-2 border-red-100 text-red-500 hover:bg-red-50' 
                        : isArchived ? 'bg-slate-200 text-slate-400' : isClosed ? 'bg-amber-100 text-amber-500' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-100'
                    } disabled:opacity-80`}
                  >
                    {group.is_member ? 'Leave Group' : isArchived ? 'Hub Archived' : isClosed ? 'Closed Hub' : isFull ? 'Hub Full' : 'Join Session'}
                  </button>
                  <Link to={`/groups?group=${group.id}`} className="px-6 py-4 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors">
                    Workspace
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-orange-500 p-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-3xl font-black tracking-tight">New Hub</h3>
                <p className="text-orange-100 text-sm font-bold mt-1">Setup your persistent study group</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject Area</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    placeholder="e.g. Physics"
                    value={newGroup.subject}
                    onChange={e => setNewGroup({...newGroup, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Faculty</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    placeholder="e.g. Science"
                    value={newGroup.faculty}
                    onChange={e => setNewGroup({...newGroup, faculty: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Main Goal</label>
                <div className="relative">
                  <input 
                    className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    placeholder="What are you studying for?"
                    value={newGroup.goal}
                    onChange={e => setNewGroup({...newGroup, goal: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={handleAIDescription}
                    disabled={isGenerating}
                    className="absolute right-3 top-2 w-10 h-10 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">About the group</label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold resize-none"
                  placeholder="Share details about materials..."
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Max Students</label>
                  <input 
                    type="number"
                    min={2}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    value={newGroup.max_members}
                    onChange={e => setNewGroup({...newGroup, max_members: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Default Meeting Location</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                    placeholder="e.g. Library"
                    value={newGroup.location}
                    onChange={e => setNewGroup({...newGroup, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all active:scale-95"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
