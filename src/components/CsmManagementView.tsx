import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  UserAccount,
  UserRole,
  UserPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CSM_PERMISSIONS,
} from '../types';
import { calculateCustomerCompliance } from '../utils/drillCalculator';
import {
  UserCheck,
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Edit2,
  Power,
  Search,
  Filter,
  Eye,
  LogIn,
  Trash2,
  Lock,
  Key,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface CsmManagementViewProps {
  onSelectCustomer: (customerId: string) => void;
  onFilterCustomersByCsm?: (csmId: string) => void;
}

export const CsmManagementView: React.FC<CsmManagementViewProps> = ({
  onSelectCustomer,
}) => {
  const {
    users,
    currentUser,
    allCustomers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    logout,
    referenceDate,
    dueSoonDays,
  } = useCustomerContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CSM' | 'Admin'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states for user CRUD
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    title: string;
    role: UserRole;
    password?: string;
    permissions: UserPermissions;
  }>({
    name: '',
    email: '',
    title: '',
    role: 'CSM',
    password: '',
    permissions: { ...DEFAULT_CSM_PERMISSIONS },
  });

  const csmUsers = users.filter((u) => u.role === 'CSM');
  const activeCsms = csmUsers.filter((u) => u.status === 'Active');

  // Compute unassigned customers
  const unassignedCustomers = allCustomers.filter((c) => !c.csmId);

  // Filtered users for table
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate metrics per user
  const getUserStats = (userId: string) => {
    const assigned = allCustomers.filter((c) => c.csmId === userId);
    let totalCompleted = 0;
    let totalOverdue = 0;
    let totalDueSoon = 0;
    let onTrackCount = 0;

    assigned.forEach((c) => {
      const compliance = calculateCustomerCompliance(
        c,
        c.currentYear || 2026,
        referenceDate,
        dueSoonDays
      );
      totalCompleted += compliance.completedCount;
      totalOverdue += compliance.overdueCount;
      totalDueSoon += compliance.dueSoonCount;
      if (compliance.overallStatus === 'On Track' || compliance.overallStatus === 'Completed') {
        onTrackCount++;
      }
    });

    const healthRate = assigned.length > 0 ? Math.round((onTrackCount / assigned.length) * 100) : 100;

    return {
      assignedCount: assigned.length,
      assignedCustomers: assigned,
      totalCompleted,
      totalOverdue,
      totalDueSoon,
      healthRate,
    };
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      title: '',
      role: 'CSM',
      password: '',
      permissions: { ...DEFAULT_CSM_PERMISSIONS },
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      title: user.title,
      role: user.role,
      password: '',
      permissions: {
        ...(user.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS),
        ...(user.permissions || {}),
      },
    });
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: newRole === 'Admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_CSM_PERMISSIONS },
    }));
  };

  const handlePermissionToggle = (permKey: keyof UserPermissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        title: formData.title.trim(),
        role: formData.role,
        permissions: formData.permissions,
        ...(formData.password?.trim() ? { password: formData.password.trim() } : {}),
      });
      setEditingUser(null);
    } else {
      addUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        title: formData.title.trim(),
        role: formData.role,
        password: formData.password?.trim() || undefined,
        permissions: formData.permissions,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleteError(null);
    const res = await deleteUser(userToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete user.');
    } else {
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="user-management-view-root">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              SecOps RBAC Control
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              User & Permission Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure Admin & CSM team roles, customize granular CRUD permissions, and assign customer account portfolios.
          </p>
        </div>

        <button
          type="button"
          id="btn-add-user-account"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-center cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Team
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{users.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {users.filter((u) => u.role === 'Admin').length} Admin · {csmUsers.length} CSMs
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active CSMs
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{activeCsms.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5 font-medium">Ready for customer drills</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {allCustomers.filter((c) => !!c.csmId).length}
            <span className="text-sm font-normal text-slate-400"> / {allCustomers.length}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {allCustomers.length > 0
              ? `${Math.round((allCustomers.filter((c) => !!c.csmId).length / allCustomers.length) * 100)}% coverage`
              : '0% coverage'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unassigned Accounts
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                unassignedCustomers.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {unassignedCustomers.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {unassignedCustomers.length > 0 ? 'Requires CSM allocation' : 'All accounts assigned'}
          </div>
        </div>
      </div>

      {/* Unassigned Customers Notice (if any) */}
      {unassignedCustomers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {unassignedCustomers.length} customer {unassignedCustomers.length === 1 ? 'account is' : 'accounts are'} unassigned
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Unassigned accounts will only be visible to Admins until allocated to an active CSM owner.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unassignedCustomers.slice(0, 2).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCustomer(c.id)}
                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-medium cursor-pointer"
              >
                {c.companyName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-users"
            type="text"
            placeholder="Search by name, email or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500">Filter Role:</span>
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('CSM')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                roleFilter === 'CSM' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CSMs ({csmUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Admin')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                roleFilter === 'Admin' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({users.filter((u) => u.role === 'Admin').length})
            </button>
          </div>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const stats = getUserStats(user.id);
          const isCurrentUser = user.id === currentUser.id;
          const userPerms = user.permissions || (user.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS);

          return (
            <div
              key={user.id}
              id={`card-user-${user.id}`}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                isCurrentUser ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl text-white font-bold text-base flex items-center justify-center shadow-xs ${
                        user.avatarColor || 'bg-blue-600'
                      }`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {user.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        user.role === 'Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        user.status === 'Active'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>

                {/* Permissions Breakdown Badges */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Role Permissions</span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">
                      {user.role === 'Admin' ? 'full override' : 'custom rbac'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {userPerms.canCreateCustomers && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                        + Create Customers
                      </span>
                    )}
                    {userPerms.canEditCustomers && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        Edit Accounts
                      </span>
                    )}
                    {userPerms.canDeleteCustomers && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                        Delete Accounts
                      </span>
                    )}
                    {userPerms.canManageDrills && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                        Execute Drills
                      </span>
                    )}
                    {userPerms.canManageUsers && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                        Manage Users
                      </span>
                    )}
                  </div>
                </div>

                {/* Portfolio Performance Metrics (for CSMs) */}
                {user.role === 'CSM' ? (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Portfolio Performance
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{stats.assignedCount}</div>
                        <div className="text-[10px] text-slate-500">Accounts</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600">{stats.totalCompleted}</div>
                        <div className="text-[10px] text-slate-500">Completed</div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${stats.totalOverdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {stats.totalOverdue}
                        </div>
                        <div className="text-[10px] text-slate-500">Overdue</div>
                      </div>
                    </div>

                    {/* Assigned Accounts list preview */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="font-semibold text-slate-700">Assigned Companies:</span>
                        <span className="text-[11px] font-medium">{stats.healthRate}% On Track</span>
                      </div>
                      {stats.assignedCustomers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                          {stats.assignedCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => onSelectCustomer(c.id)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                            >
                              {c.companyName}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No customer accounts assigned yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="bg-purple-50 text-purple-800 p-3 rounded-xl text-xs font-medium">
                      Full administrative access across all {allCustomers.length} customer accounts, audit reports, and team configuration.
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id={`btn-edit-user-${user.id}`}
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                    title="Edit account details and permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    id={`btn-toggle-status-${user.id}`}
                    onClick={() => toggleUserStatus(user.id)}
                    className={`p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 text-xs flex items-center gap-1 cursor-pointer ${
                      user.status === 'Active' ? 'text-slate-600 hover:text-amber-600' : 'text-rose-600 hover:text-emerald-600'
                    }`}
                    title={user.status === 'Active' ? 'Deactivate account' : 'Activate account'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{user.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  {!isCurrentUser && (
                    <button
                      type="button"
                      id={`btn-delete-user-${user.id}`}
                      onClick={() => {
                        setDeleteError(null);
                        setUserToDelete(user);
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  )}
                </div>

                {/* Switch to this account / Login page */}
                {!isCurrentUser ? (
                  <button
                    type="button"
                    id={`btn-switch-account-${user.id}`}
                    onClick={() => logout(user.email)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title={`Log out and switch to ${user.name}'s account via login screen`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Switch Account</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded-lg">
                    Active Session
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal with Permission Configuration */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Edit User Account & Permissions' : 'Add New Team User Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign administrative or customer success roles and granular access rights.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('CSM')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      formData.role === 'CSM'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${formData.role === 'CSM' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Customer Success Manager</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Manages assigned clients & drills</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('Admin')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      formData.role === 'Admin'
                        ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${formData.role === 'Admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">SecOps Administrator</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Full master access & user control</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Email Address (Sign-In ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.chen@progist.net"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This work email address will be used to log in and receive drill review notifications.
                </p>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Title / Specialization
                </label>
                <input
                  type="text"
                  placeholder={formData.role === 'Admin' ? 'Director of SecOps' : 'Senior Customer Success Manager'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Custom Initial Password (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Initial Password <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? 'Leave blank to keep existing password' : 'Enter initial password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Protected with token-based authentication. If left blank, standard secure default credentials apply.
                </p>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Granular Access Permissions
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {formData.role === 'Admin' ? 'All active by default' : 'Custom CSM policy'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canCreateCustomers}
                      onChange={() => handlePermissionToggle('canCreateCustomers')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Create Customer Accounts</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canEditCustomers}
                      onChange={() => handlePermissionToggle('canEditCustomers')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Edit Customers & Dates</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canDeleteCustomers}
                      onChange={() => handlePermissionToggle('canDeleteCustomers')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Delete Customer Accounts</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageDrills}
                      onChange={() => handlePermissionToggle('canManageDrills')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Execute Drills & Reviews</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageUsers}
                      onChange={() => handlePermissionToggle('canManageUsers')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Manage Team Accounts</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAssignCsm}
                      onChange={() => handlePermissionToggle('canAssignCsm')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Reassign Customer CSMs</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canExportReports}
                      onChange={() => handlePermissionToggle('canExportReports')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Export Audit Reports</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-user-account"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingUser ? 'Save Account Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{userToDelete.name}</strong> ({userToDelete.email})?
                </p>
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  Any customer accounts assigned to this user will be safely unassigned and returned to the Admin triage pool.
                </p>
                {deleteError && (
                  <p className="text-xs text-rose-600 font-semibold mt-2">{deleteError}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-user"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
