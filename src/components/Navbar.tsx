import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { generateReminders, formatDisplayDate } from '../utils/drillCalculator';
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  FileBarChart2,
  Settings,
  Plus,
  Clock,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'calendar'
  | 'reminders'
  | 'reports'
  | 'reviews'
  | 'team'
  | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCreateCustomer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateCustomer,
}) => {
  const { customers, referenceDate, setReferenceDate, dueSoonDays, setSelectedCustomerId } =
    useCustomerContext();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const reminders = generateReminders(customers, referenceDate, dueSoonDays);
  const urgentCount = reminders.filter((r) => r.severity === 'high' || r.severity === 'medium').length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'calendar', label: 'Drill Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'reviews', label: 'Debrief Reviews', icon: <MessageSquare className="w-4 h-4" /> },
    {
      id: 'reminders',
      label: 'Upcoming & Alerts',
      icon: <Bell className="w-4 h-4" />,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    { id: 'reports', label: 'Reports & Digests', icon: <FileBarChart2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedCustomerId(null);
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-500 transition-colors">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                  Progist <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800 uppercase tracking-wider">Tracker</span>
                </div>
                <div className="text-[10px] text-slate-400 -mt-0.5">
                  Phishing Simulation & Awareness Progress
                </div>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => {
                    if (item.id === 'customers') {
                      setSelectedCustomerId(null);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge !== undefined && (
                    <span
                      id="badge-nav-alerts-count"
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions: Reference Date & New Customer */}
          <div className="flex items-center gap-2.5">
            {/* Simulation Date Badge / Selector */}
            <div className="relative">
              <button
                type="button"
                id="btn-toggle-sim-date"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                title="Change system reference date for testing simulation timing"
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline text-slate-400">Ref Date:</span>
                <span className="font-semibold text-white">{formatDisplayDate(referenceDate)}</span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 p-3 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-xs font-bold text-slate-700 mb-1">
                    System Reference Date
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Adjust date to test drill statuses (Upcoming, Due Soon, Overdue).
                  </p>
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setReferenceDate(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs mb-2"
                  />
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceDate('2026-08-17');
                        setShowDatePicker(false);
                      }}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-800 gap-1 text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'customers') setSelectedCustomerId(null);
                setActiveTab(item.id);
              }}
              className={`px-2.5 py-1.5 rounded text-xs whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === item.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
