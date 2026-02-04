
import React, { useState, useEffect } from 'react';
import { Star, Send, Trash2, Search, Quote, Loader2 } from 'lucide-react';
import { Feedback } from '../types';
import { apiService } from '../services/apiService';

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ group: '', rating: 5, text: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) setCurrentUser(JSON.parse(saved));
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeedback();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.group || !newFeedback.text) return;

    setSubmitting(true);
    try {
      await apiService.submitFeedback({
        group_name: newFeedback.group,
        rating: newFeedback.rating,
        text: newFeedback.text
      });
      setNewFeedback({ group: '', rating: 5, text: '' });
      await loadFeedback();
    } catch (err: any) {
      alert("Error posting feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Community Voice</h1>
        <p className="text-slate-500 font-medium">Rate your study experiences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-8">Share Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Which Group?</label>
                <input 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold"
                  placeholder="e.g. Calc III Prep"
                  value={newFeedback.group}
                  onChange={e => setNewFeedback({...newFeedback, group: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setNewFeedback({...newFeedback, rating: star})}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${newFeedback.rating >= star ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <Star size={20} fill={newFeedback.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Your Review</label>
                <textarea 
                  required 
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-bold resize-none"
                  placeholder="How was the session? Be helpful..."
                  value={newFeedback.text}
                  onChange={e => setNewFeedback({...newFeedback, text: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Post Review</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm min-h-[600px]">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Recent Reviews</h2>
              <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-48 focus-within:w-64 transition-all group">
                <Search size={18} className="text-slate-300 group-focus-within:text-orange-500" />
                <input placeholder="Search..." className="bg-transparent border-none outline-none text-xs ml-3 w-full font-bold" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-orange-200" />
              </div>
            ) : (
              <div className="space-y-8">
                {feedbacks.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                    <Quote size={48} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No feedback yet</p>
                  </div>
                )}
                {feedbacks.map(f => (
                  <div key={f.id} className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-slate-100 transition-all relative overflow-hidden group">
                    <Quote className="absolute top-6 right-6 text-slate-50 w-20 h-20 pointer-events-none group-hover:text-orange-50/50 transition-colors" />
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <h4 className="font-black text-slate-900 text-xl mb-1 tracking-tight">{f.group_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">By {f.user_name} • {new Date(f.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={16} fill={f.rating >= s ? '#F97316' : 'none'} className={f.rating >= s ? 'text-orange-500' : 'text-slate-100'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium italic leading-relaxed text-base">"{f.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
