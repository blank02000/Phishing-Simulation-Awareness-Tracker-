import React from 'react';
import { NavTab } from './Navbar';
import { useCustomerContext } from '../context/CustomerContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  FileBarChart2,
  UserCheck,
  Sparkles,
  MessageSquare,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  urgentAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  urgentAlertsCount = 0,
}) => {
  const { currentUser, logout } = useCustomerContext();
  const isAdmin = currentUser.role === 'Admin';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'reminders',
      label: 'Alerts',
      icon: <Bell className="w-5 h-5" />,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : undefined,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileBarChart2 className="w-5 h-5" />,
    },
    ...(isAdmin
      ? [
          {
            id: 'team' as NavTab,
            label: 'CSM Team',
            icon: <UserCheck className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  return (
    <aside
      id="app-sidebar-nav"
      className="w-16 md:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-5 shrink-0 z-30 select-none justify-between h-screen sticky top-0"
    >
      {/* Top Section: Logo & Nav Items */}
      <div className="flex flex-col items-center w-full gap-6">
        {/* Brand Logo */}
        <button
          type="button"
          id="sidebar-brand-logo"
          onClick={() => setActiveTab('dashboard')}
          className="w-11 h-11 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-all group"
          title="CyberDrill Security Ops Dashboard"
        >
          <Shield className="w-6 h-6 group-hover:scale-105 transition-transform" />
        </button>

        {/* Navigation Menu Icons */}
        <nav className="flex flex-col gap-2.5 w-full px-2.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center text-[11px] font-medium transition-all relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="text-[10px] mt-1 tracking-tight leading-none">
                  {item.label}
                </span>

                {/* Notification Badge */}
                {item.badge !== undefined && (
                  <span
                    id="sidebar-alert-badge"
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Avatar & Logout */}
      <div className="w-full px-2.5 space-y-2 flex flex-col items-center">
        {/* User Role Indicator Avatar */}
        <button
          type="button"
          onClick={() => (isAdmin ? setActiveTab('team') : setActiveTab('dashboard'))}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs transition-transform hover:scale-105 ${
            currentUser.avatarColor || 'bg-blue-600'
          }`}
          title={`Logged in as ${currentUser.name} (${currentUser.role})`}
        >
          {currentUser.name.charAt(0)}
        </button>

        <button
          id="sidebar-btn-logout"
          type="button"
          onClick={() => logout()}
          className="w-full py-2 rounded-xl flex flex-col items-center justify-center text-[11px] font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[9px] mt-1 tracking-tight leading-none">Log Out</span>
        </button>
      </div>
    </aside>
  );
};
