
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Flame, Users, Trophy, BookOpen, Loader2, Search, User as UserIcon, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { StudyGroup } from '../types';
import StarRating from './StarRating';

const DiscoverPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'subjects' | 'users'>('trending');
  const [trending, setTrending] = useState<StudyGroup[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') || '').trim();

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trending') {
        const data = await apiService.getTrendingGroups();
        setTrending(data);
      } else if (activeTab === 'subjects') {
        const data = await apiService.getSubjects();
        setSubjects(data);
      } else if (activeTab === 'users') {
        // If there's a search query, use the search endpoint, otherwise the standard leaders ranking
        if (searchQuery) {
          const data = await apiService.searchUsers(searchQuery);
          setLeaders(data);
        } else {
          const data = await apiService.getLeaders();
          setLeaders(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch discovery data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrending = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return trending;
    return trending.filter(g => 
      g.name.toLowerCase().includes(q) || 
      g.subject.toLowerCase().includes(q) ||
      g.faculty.toLowerCase().includes(q)
    );
  }, [trending, searchQuery]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s => 
      s.subject.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  // Leaders are now partially filtered by the backend if a search query is present
  // but we can still apply local refinement if necessary.
  const filteredLeaders = useMemo(() => {
    return leaders;
  }, [leaders]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Discover</h1>
          <p className="text-slate-500 font-medium">
            {searchQuery 
              ? `Searching for "${searchQuery}" in ${activeTab}` 
              : "Find what's trending across campus"}
          </p>
        </div>
      </div>

      <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-sm">
        <button 
          onClick={() => setActiveTab('trending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'trending' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Flame size={16} />
          Trending
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'subjects' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <BookOpen size={16} />
          Subjects
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Trophy size={16} />
          {searchQuery ? 'Users' : 'Leaders'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-200" />
        </div>
      ) : (
        <>
          {activeTab === 'trending' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrending.length === 0 && searchQuery && (
                <div className="col-span-full py-20 text-center opacity-40">
                  <Search size={48} className="mx-auto mb-4" />
                  <p className="font-bold">No trending groups matching your search.</p>
                </div>
              )}
              {filteredTrending.map((group, idx) => (
                <div key={group.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-orange-500/10"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                      #{idx + 1}
                    </div>
                    <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Active</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{group.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{group.subject}</p>
                  <p className="text-xs font-semibold text-slate-500 mb-3">Led by {group.creator_name}</p>
                  {group.total_ratings && group.total_ratings > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating value={group.avg_group_rating || 0} readonly size="sm" />
                      <span className="text-[10px] text-slate-400 font-bold">({group.total_ratings})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-500">{group.members_count} students enrolled</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {filteredSubjects.length === 0 && searchQuery && (
                <div className="col-span-full py-20 text-center opacity-40">
                  <Search size={48} className="mx-auto mb-4" />
                  <p className="font-bold">No subjects matching your search.</p>
                </div>
              )}
              {filteredSubjects.map((subj, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-200 text-center hover:border-orange-500 transition-all cursor-pointer group shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-50 group-hover:scale-110 transition-all">
                    <BookOpen className="text-orange-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{subj.subject}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subj.count} Active Sessions</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Major</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Karma Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center opacity-40">
                        {searchQuery ? <Search size={48} className="mx-auto mb-4" /> : <Trophy size={48} className="mx-auto mb-4" />}
                        <p className="font-bold">{searchQuery ? `No users matching "${searchQuery}"` : "No leaders found yet."}</p>
                      </td>
                    </tr>
                  )}
                  {filteredLeaders.map((user, idx) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${idx === 0 && !searchQuery ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-500'}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center font-bold text-orange-600 border border-orange-100">
                            {user.name[0]}
                          </div>
                          <span className="font-bold text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-slate-500">{user.major || 'Student'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${user.role === 'leader' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-black text-slate-900">{user.karma_points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverPage;