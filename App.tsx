
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  Users,
  AlertTriangle,
  Calendar as CalendarIcon,
  User as UserIcon,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  Plus
} from 'lucide-react';

import HomePage from './components/HomePage';
import GroupsPage from './components/GroupsPage';
import ReportPage from './components/ReportPage';
import CalendarPage from './components/CalendarPage';
import ProfilePage from './components/ProfilePage';
import UserProfilePage from './components/UserProfilePage';
import SettingsPage from './components/SettingsPage';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import NotificationDropdown from './components/NotificationDropdown';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminGroups from './components/admin/AdminGroups';
import AdminReports from './components/admin/AdminReports';
import AdminAnalytics from './components/admin/AdminAnalytics';

import { User, AppNotification } from './types';
import { apiService } from './services/apiService';

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isActive = location.pathname === to;
  
  // Preserve search query across sidebar navigation
  const q = searchParams.get('q');
  const destination = q ? `${to}?q=${encodeURIComponent(q)}` : to;

  return (
    <Link
      to={destination}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode; user: User; onLogout: () => void; showSearch?: boolean; pageTitle?: string; pageSubtitle?: string }> = ({ children, user, onLogout, showSearch = false, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const handleNotificationClick = (notification: AppNotification) => {
    // Navigate to the relevant group chat for message/group-related notifications
    if (notification.data.group_id) {
      setNotifOpen(false);
      navigate(`/groups?group=${notification.data.group_id}`);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [list, countData] = await Promise.all([
        apiService.getNotifications(),
        apiService.getUnreadCount()
      ]);

      // Merge new notifications with existing read ones to persist read messages
      setNotifications(prev => {
        const newIds = new Set(list.map(n => n.id));
        const existingRead = prev.filter(n => n.read_at && !newIds.has(n.id));
        return [...list, ...existingRead].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setUnreadCount(countData.count);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiService.markNotificationsAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentParams = Object.fromEntries(searchParams.entries());
    
    if (val) {
      setSearchParams({ ...currentParams, q: val });
    } else {
      const { q, ...rest } = currentParams;
      setSearchParams(rest);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">AU</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-none">StudyHub</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Study Group</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink to="/home" icon={<Home size={20} />} label="Home" />
          <SidebarLink to="/groups" icon={<Users size={20} />} label="My Groups" />
          <SidebarLink to="/report" icon={<AlertTriangle size={20} />} label="Report" />
          <SidebarLink to="/calendar" icon={<CalendarIcon size={20} />} label="Calendar" />
          <SidebarLink to="/profile" icon={<UserIcon size={20} />} label="Profile" />
          <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-semibold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            {showSearch && (
              <div className="hidden sm:flex items-center bg-slate-100 px-4 py-2 rounded-xl w-full max-w-md border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Search className={`w-5 h-5 transition-colors ${searchQuery ? 'text-orange-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search groups, subjects, faculty..."
                  className="bg-transparent border-none outline-none ml-3 w-full text-slate-600 placeholder:text-slate-400 font-medium"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            )}
            {pageTitle && (
              <div className="ml-4">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
                {pageSubtitle && <p className="text-xs text-slate-500 font-medium">{pageSubtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!isNotifOpen)}
                className={`p-2 hover:bg-slate-100 rounded-xl relative transition-all ${isNotifOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-400'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  onMarkRead={markAllRead}
                  onClose={() => setNotifOpen(false)}
                  onNotificationClick={handleNotificationClick}
                  onRefresh={fetchNotifications}
                />
              )}
            </div>
            <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
            <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-all">
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-sm border border-orange-200">
                {user.avatar || user.name[0]}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-bold text-slate-900 leading-none">{user.name}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">{user.major || 'Student'}</span>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const isAdminAuth = (): boolean => {
  try {
    const saved = localStorage.getItem('admin_auth');
    if (!saved) return false;
    const u = JSON.parse(saved);
    return u?.email === 'admin@au.edu';
  } catch { return false; }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Force re-render when admin logs in (without changing main site user)
  const [, setAdminTrigger] = useState(0);
  useEffect(() => {
    const handleAdminAuth = () => setAdminTrigger(c => c + 1);
    window.addEventListener('admin_auth_change', handleAdminAuth);
    return () => window.removeEventListener('admin_auth_change', handleAdminAuth);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const handleUserUpdate = (updatedUser: User) => {
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/home" /> : <SignupPage onSignup={handleLogin} />} />
        
        <Route path="/home" element={
          user ? <Layout user={user} onLogout={handleLogout} showSearch={true}><HomePage /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/groups" element={
          user ? <Layout user={user} onLogout={handleLogout} showSearch={true}><GroupsPage /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/report" element={
          user ? <Layout user={user} onLogout={handleLogout} pageTitle="Report User" pageSubtitle="Help us maintain a safe community"><ReportPage /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/calendar" element={
          user ? <Layout user={user} onLogout={handleLogout} pageTitle="Calendar" pageSubtitle="Manage your study schedule"><CalendarPage /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          user ? <Layout user={user} onLogout={handleLogout} pageTitle="Profile" pageSubtitle="View and edit your information"><ProfilePage user={user} onUserUpdate={handleUserUpdate} /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/profile/:userId" element={
          user ? <Layout user={user} onLogout={handleLogout}><UserProfilePage /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/settings" element={
          user ? <Layout user={user} onLogout={handleLogout} pageTitle="Settings" pageSubtitle="Manage your experience and data"><SettingsPage /></Layout> : <Navigate to="/login" />
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          isAdminAuth() ? <AdminDashboard /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin/users" element={
          isAdminAuth() ? <AdminUsers /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin/groups" element={
          isAdminAuth() ? <AdminGroups /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin/reports" element={
          isAdminAuth() ? <AdminReports /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin/analytics" element={
          isAdminAuth() ? <AdminAnalytics /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
