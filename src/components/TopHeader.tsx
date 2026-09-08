import React, { useState } from 'react';
import { NavTab } from './Navbar';
import { useCustomerContext } from '../context/CustomerContext';
import { formatDisplayDate, calculateCustomerCompliance } from '../utils/drillCalculator';
import { ComplianceStatusBadge } from './common/StatusBadges';
import {
  Clock,
  RotateCcw,
  Plus,
  ChevronRight,
  Shield,
  UserCheck,
  ChevronDown,
  User,
  Check,
  Building2,
  LogOut,
  Mail,
} from 'lucide-react';

interface TopHeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    referenceDate,
    setReferenceDate,
    dueSoonDays,
    users,
    currentUser,
    setCurrentUserId,
    authSession,
    getActiveSessionRemainingTime,
    logout,
  } = useCustomerContext();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sessionRemaining, setSessionRemaining] = useState(() => getActiveSessionRemainingTime());

  // Update session remaining display every 15s
  React.useEffect(() => {
    const update = () => setSessionRemaining(getActiveSessionRemainingTime());
    update();
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, [authSession]);

  const isAdmin = currentUser.role === 'Admin';

  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : null;

  const compliance = selectedCustomer
    ? calculateCustomerCompliance(
        selectedCustomer,
        selectedCustomer.currentYear || 2026,
        referenceDate,
        dueSoonDays
      )
    : null;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
      {/* Left: Breadcrumbs navigation */}
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <button
          type="button"
          onClick={() => {
            setSelectedCustomerId(null);
            setActiveTab('dashboard');
          }}
          className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Progist</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

        {activeTab === 'dashboard' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-900 font-bold">
              {isAdmin ? 'Global Operations Dashboard' : 'CSM Portfolio Dashboard'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAdmin ? 'Admin' : 'CSM'}
            </span>
          </div>
        )}

        {activeTab === 'customers' && !selectedCustomer && (
          <div className="flex items-center gap-2">
            <span className="text-slate-900 font-bold">
              {isAdmin ? 'All Customer Accounts' : 'My Customer Accounts'}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              ({customers.length} {customers.length === 1 ? 'account' : 'accounts'})
            </span>
          </div>
        )}

        {activeTab === 'customers' && selectedCustomer && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="text-slate-500 hover:text-blue-600 transition-colors"
            >
              Customers
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-900 font-bold">{selectedCustomer.companyName}</span>
            {compliance && <ComplianceStatusBadge status={compliance.overallStatus} />}
          </div>
        )}

        {activeTab === 'calendar' && (
          <span className="text-slate-900 font-bold">Drill & Debrief Calendar</span>
        )}

        {activeTab === 'reviews' && (
          <span className="text-slate-900 font-bold">Executive & SecOps Review Meetings</span>
        )}

        {activeTab === 'reminders' && (
          <span className="text-slate-900 font-bold">Upcoming & Overdue Alerts</span>
        )}

        {activeTab === 'reports' && (
          <span className="text-slate-900 font-bold">Monthly Progress & Audit Reports</span>
        )}

        {activeTab === 'team' && (
          <span className="text-slate-900 font-bold">CSM Team & Portfolio Allocation</span>
        )}
      </div>

      {/* Right: Role Switcher, Reference Date & Actions */}
      <div className="flex items-center gap-3">
        {/* Active Session Duration Badge */}
        {authSession && (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 shadow-2xs"
            title={`Active Session Token: ${authSession.token}\nValid for 7 hours from login`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              {sessionRemaining?.formatted || '7h Active'}
            </span>
          </div>
        )}

        {/* Interactive User Role Switcher */}
        <div className="relative">
          <button
            type="button"
            id="btn-user-role-switcher"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isAdmin
                ? 'bg-purple-50 hover:bg-purple-100/80 text-purple-900 border-purple-200'
                : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200'
            }`}
            title="Switch user account / role to test Admin vs CSM behavior"
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold ${
                currentUser.avatarColor || 'bg-blue-600'
              }`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block leading-tight">{currentUser.name}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider font-extrabold ${
                isAdmin ? 'bg-purple-200/80 text-purple-800' : 'bg-emerald-200/80 text-emerald-800'
              }`}
            >
              {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 p-2 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 w-80 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">Signed In Account</div>
                <div className="text-xs text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.email}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Logged in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role}).
                </p>

                {/* Session Token Detail Box */}
                {authSession && (
                  <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        7-Hour Active Token
                      </span>
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-extrabold">
                        {sessionRemaining?.formatted || 'Active'}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono truncate">
                      ID: {authSession.token.slice(0, 22)}...
                    </div>
                  </div>
                )}
              </div>

              <div className="py-2">
                <div className="px-3 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Account
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Via Login Page</span>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {users.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout(user.email);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-slate-100 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        title={`Log out and switch to ${user.name}'s account via login screen`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              user.avatarColor || 'bg-blue-600'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-slate-900 font-bold flex items-center gap-1.5 truncate">
                              <span className="truncate">{user.name}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                  user.role === 'Admin'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-bold text-blue-600 shrink-0 ml-2 bg-blue-50 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-medium">
                            Switch →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 px-1 space-y-1">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('team');
                      setShowUserMenu(false);
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Manage CSM Team Accounts →</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-sign-out"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full py-1.5 text-center text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out to Login Screen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reference Date simulation popover */}
        <div className="relative">
          <button
            type="button"
            id="btn-top-sim-date"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
            title="Change system simulation date to test upcoming / overdue statuses"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline text-slate-500">Ref:</span>
            <span className="font-bold text-slate-900">{formatDisplayDate(referenceDate)}</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 p-3.5 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in zoom-in-95">
              <div className="text-xs font-bold text-slate-800 mb-1">
                System Reference Date
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Change simulation date to test drill statuses (Upcoming, Due Soon, Overdue).
              </p>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setReferenceDate(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs mb-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setReferenceDate('2026-08-17');
                    setShowDatePicker(false);
                  }}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Today
                </button>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
