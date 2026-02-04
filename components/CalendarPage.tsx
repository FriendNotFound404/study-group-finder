
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Share2, Plus, Calendar as CalendarIcon, MapPin, Clock, Loader2, X } from 'lucide-react';
import { apiService } from '../services/apiService';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'General', start_time: '', location: '' });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createEvent(newEvent);
      setIsModalOpen(false);
      loadEvents();
      setNewEvent({ title: '', type: 'General', start_time: '', location: '' });
    } catch (err) {
      alert("Failed to create event");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this event?")) return;
    try {
      await apiService.deleteEvent(id);
      loadEvents();
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personal Schedule</h1>
              <p className="text-slate-500 font-semibold text-xs uppercase tracking-widest mt-1">{events.length} sessions listed</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"><ChevronLeft size={20} className="text-slate-400" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"><ChevronRight size={20} className="text-slate-400" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden">
            {weekDays.map(day => (
              <div key={day} className="bg-slate-50 p-4 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white h-24 md:h-32 p-2"></div>
            ))}
            {days.map(day => {
              const dayEvents = events.filter(e => new Date(e.start_time).getDate() === day);
              return (
                <div key={day} className={`bg-white h-24 md:h-32 p-3 transition-colors hover:bg-slate-50/50 group relative`}>
                  <span className="text-sm font-bold text-slate-400">{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(e => (
                      <div key={e.id} className="p-1 bg-orange-500 text-white text-[8px] font-black uppercase rounded truncate shadow-sm">
                        {e.title}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute bottom-2 right-2 p-1 bg-slate-50 text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-orange-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Upcoming</h2>
            <Share2 size={18} className="text-slate-400 hover:text-orange-500 cursor-pointer transition-colors" />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : (
              <>
                {events.length === 0 && (
                  <p className="text-center text-xs font-bold text-slate-400 uppercase py-10">No events found</p>
                )}
                {events.map((event) => (
                  <div key={event.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group relative">
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${event.type === 'Exam' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {event.type}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-3 group-hover:text-orange-500 transition-colors">{event.title}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{new Date(event.start_time).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={14} />
                          <span className="text-xs font-bold">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-black uppercase tracking-widest hover:border-orange-200 hover:text-orange-500 transition-all mt-4 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-8 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">New Event</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-8 space-y-4">
              <input 
                required placeholder="Event Title" 
                className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
              <select 
                className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm"
                value={newEvent.type}
                onChange={e => setNewEvent({...newEvent, type: e.target.value})}
              >
                <option>General</option>
                <option>Exam</option>
                <option>Project</option>
              </select>
              <input 
                type="datetime-local" required 
                className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm"
                value={newEvent.start_time}
                onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
              />
              <input 
                placeholder="Location (Optional)" 
                className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm"
                value={newEvent.location}
                onChange={e => setNewEvent({...newEvent, location: e.target.value})}
              />
              <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest">Create Event</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
