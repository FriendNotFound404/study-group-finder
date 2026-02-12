
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/apiService';

const SignupPage: React.FC<{ onSignup: (u: User) => void }> = ({ onSignup }) => {
  const [formData, setFormData] = useState({ name: '', email: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pass !== formData.confirm) {
      alert("Passwords don't match!");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await apiService.register({
        name: formData.name,
        email: formData.email,
        password: formData.pass,
        password_confirmation: formData.confirm
      });
      const authData = { ...response.user, token: response.token };
      onSignup(authData);

      // Show verification message if included in response
      if (response.message) {
        setSuccessMessage(response.message);
      }

      // Navigate after a brief delay to show the message
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl shadow-orange-100 mb-4">AU</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join StudyHub</h1>
          <p className="text-slate-500 font-medium">Create your account to start studying</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-bold border border-green-100 flex items-center gap-2">
            <Mail size={16} />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" required 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-sm transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" required 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-sm transition-all"
                placeholder="john.doe@au.edu"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
              <input 
                type="password" required 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-sm transition-all"
                placeholder="••••••••"
                value={formData.pass}
                onChange={e => setFormData({...formData, pass: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm</label>
              <input 
                type="password" required 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-sm transition-all"
                placeholder="••••••••"
                value={formData.confirm}
                onChange={e => setFormData({...formData, confirm: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 font-bold text-sm">
          Already have an account? <Link to="/login" className="text-orange-500 hover:text-orange-600 underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;