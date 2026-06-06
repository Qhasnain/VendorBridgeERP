import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  ShoppingCart,
  Receipt,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  User,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'] },
  { title: 'Vendors', path: '/vendors', icon: Users, roles: ['ADMIN', 'PROCUREMENT_OFFICER'] },
  { title: 'RFQs & Tenders', path: '/rfqs', icon: FileText, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'] },
  { title: 'AI Comparison', path: '/comparison', icon: FileSpreadsheet, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
  { title: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
  { title: 'Purchase Orders', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'] },
  { title: 'Invoices', path: '/invoices', icon: Receipt, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER'] },
  { title: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['ADMIN'] },
  { title: 'Reports & KPI', path: '/reports', icon: ClipboardList, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
];

export const EnterpriseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, clearItem } = useNotifications();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/rfqs?search=${encodeURIComponent(globalSearch)}`);
      setGlobalSearch('');
    }
  };

  const filteredItems = sidebarItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100 transition-colors duration-200">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-accent-dark text-white flex flex-col transform lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* LOGO */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/40">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-extrabold text-white text-xl">
              V
            </div>
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-primary-light to-primary bg-clip-text text-transparent">
              VENDORBRIDGE
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* ROLE BADGE */}
        <div className="px-6 py-4 bg-slate-900/20 border-b border-slate-700/25">
          <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Enterprise Account</p>
          <p className="text-sm font-bold text-primary truncate">{user?.name}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-primary/20 text-primary border border-primary/30 rounded">
            {user?.role.replace('_', ' ')}
          </span>
        </div>

        {/* NAV ITEMS */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-premium'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="h-16 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              <Menu size={24} />
            </button>
            
            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearchSubmit} className="hidden md:flex items-center gap-2 relative">
              <Search className="absolute left-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search RFQs or ID..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="w-64 bg-gray-100 dark:bg-slate-800 pl-10 pr-4 py-1.5 rounded-full text-xs outline-none focus:ring-2 focus:ring-primary border border-transparent focus:bg-white dark:focus:bg-slate-900"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-[9px] font-extrabold text-white flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-premium overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 dark:text-slate-500">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs relative hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors ${
                            !notif.isRead ? 'bg-amber-500/5 dark:bg-primary/5 font-medium' : ''
                          }`}
                        >
                          <p className="pr-4 text-gray-700 dark:text-gray-300">{notif.message}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[10px] text-gray-400">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="space-x-2">
                              {!notif.isRead && (
                                <button onClick={() => markRead(notif.id)} className="text-[10px] text-primary font-semibold hover:underline">
                                  Mark read
                                </button>
                              )}
                              <button onClick={() => clearItem(notif.id)} className="text-[10px] text-red-500 font-semibold hover:underline">
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-accent text-xs">
                  {user?.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user?.role.toLowerCase().replace('_', ' ')}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-premium overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/dashboard');
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <User size={14} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50/60 dark:hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
