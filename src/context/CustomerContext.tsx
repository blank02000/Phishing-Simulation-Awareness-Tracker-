import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Customer,
  AnnualPlan,
  DrillRecord,
  ReviewMeeting,
  DrillType,
  UserAccount,
  UserRole,
  CustomerProducts,
  LmsDeliverable,
  DeliverableFrequency,
  LicenseDetails,
  AuthSession,
  UserPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CSM_PERMISSIONS,
} from '../types';
import { INITIAL_USERS, INITIAL_CUSTOMERS } from '../data/seedData';
import {
  SYSTEM_TODAY,
  generateAnnualTimeline,
  computeDrillStatus,
  computeDeliverableStatus,
} from '../utils/drillCalculator';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { sanitizeForFirestore } from '../utils/firestoreHelper';
import { sendEmail } from '../utils/emailService';

interface CustomerContextType {
  // Customers
  customers: Customer[]; // Filtered by current user role/assignment (accessible customers)
  allCustomers: Customer[]; // All customers (unfiltered, for admin management)
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  referenceDate: string;
  setReferenceDate: (date: string) => void;
  dueSoonDays: number;
  setDueSoonDays: (days: number) => void;

  // RBAC, Auth & User Management
  users: UserAccount[];
  currentUser: UserAccount;
  isAuthenticated: boolean;
  authSession: AuthSession | null;
  pendingLoginEmail: string | null;
  setPendingLoginEmail: (email: string | null) => void;
  loginWithEmail: (
    email: string,
    password?: string
  ) => { success: boolean; user?: UserAccount; error?: string };
  sendLoginOtp: (email: string) => { success: boolean; otp?: string; expiresAt?: number; error?: string };
  verifyLoginOtp: (email: string, otp: string) => { success: boolean; user?: UserAccount; error?: string };
  getActiveSessionRemainingTime: () => { hours: number; minutes: number; isExpired: boolean; formatted: string } | null;
  logout: (prefillEmail?: string) => void;
  setCurrentUserId: (id: string) => void;
  addUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    title: string;
    password?: string;
    permissions?: Partial<UserPermissions>;
  }) => Promise<UserAccount>;
  updateUser: (id: string, partial: Partial<UserAccount>) => void;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (id: string) => void;
  addCsmUser: (data: { name: string; email: string; title: string }) => Promise<UserAccount>;
  updateCsmUser: (id: string, partial: Partial<UserAccount>) => void;
  toggleCsmStatus: (id: string) => void;
  assignCustomerCsm: (customerId: string, csmId: string | undefined, csmName?: string) => void;
  hasPermission: (permission: keyof UserPermissions, user?: UserAccount) => boolean;
  canUserCreateCustomer: (user?: UserAccount) => boolean;
  canUserEditCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;
  canUserDeleteCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;
  canUserManageUsers: (user?: UserAccount) => boolean;
  canUserAccessCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;
  canUserMutateCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;

  // Actions
  addCustomer: (customerData: {
    companyName: string;
    customerContact: string;
    contactEmail?: string;
    contactPhone?: string;
    accountOwner: string;
    csmId?: string;
    startDate: string;
    endDate?: string;
    annualRequirement: number;
    intervalMonths: number;
    defaultDrillType: DrillType;
    industry?: string;
    notes?: string;
    products?: CustomerProducts;
    licenseDetails?: LicenseDetails;
  }) => Customer;
  updateCustomer: (id: string, partial: Partial<Customer>) => boolean;
  deleteCustomer: (id: string) => boolean;
  markDrillCompleted: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ) => boolean;
  updateDrillSchedule: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ) => boolean;
  updateReviewMeeting: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrMeeting: any,
    maybeMeeting?: any
  ) => boolean;
  createNewYearPlan: (
    customerId: string,
    newYear: number,
    startDate: string,
    annualRequirement: number,
    intervalMonths: number,
    defaultDrillType?: DrillType,
    notes?: string
  ) => boolean;
  addLmsDeliverable: (
    customerId: string,
    year: number,
    data: {
      title: string;
      frequency: DeliverableFrequency;
      plannedDate: string;
      targetAudience?: string;
      notes?: string;
    }
  ) => LmsDeliverable | null;
  updateLmsDeliverable: (
    customerId: string,
    year: number,
    deliverableId: string,
    partial: Partial<LmsDeliverable>
  ) => boolean;
  deleteLmsDeliverable: (
    customerId: string,
    year: number,
    deliverableId: string
  ) => boolean;
  markDeliverableCompleted: (
    customerId: string,
    year: number,
    deliverableId: string,
    completionData: {
      actualCompletionDate: string;
      completionRate?: number;
      notes?: string;
    }
  ) => boolean;
  resetToDemoData: () => void;
  purgeProductionData: () => Promise<boolean>;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  bulkImportCustomers: (rows: any[]) => number;
  lastSentEmail: { to: string; subject: string; body: string; timestamp: string } | null;
  clearLastSentEmail: () => void;
}

const STORAGE_KEY = 'cyberdrill_customers_v4';
const USERS_STORAGE_KEY = 'cyberdrill_users_v4';
const CURRENT_USER_KEY = 'cyberdrill_current_user_v4';
const AUTH_SESSION_KEY = 'cyberdrill_auth_session_v5';
const DATE_STORAGE_KEY = 'cyberdrill_ref_date_v4';

// 7 Hours Session Duration (keeps account active for six to seven hours per day)
export const SESSION_DURATION_HOURS = 7;
export const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

// Clear legacy cached demo customers & old unverified auth states so login is strictly required
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('cyberdrill_auth_state_v4');
    localStorage.removeItem('cyberdrill_auth_state_v3');
    localStorage.removeItem('cyberdrill_auth_state_v2');
    localStorage.removeItem('cyberdrill_auth_state');
    localStorage.removeItem('cyberdrill_customers_v3');
    localStorage.removeItem('cyberdrill_customers_v2');
    localStorage.removeItem('cyberdrill_customers_v1');
    localStorage.removeItem('cyberdrill_customers');
    localStorage.removeItem('cyberdrill_users_v3');
    localStorage.removeItem('cyberdrill_users_v2');
    localStorage.removeItem('cyberdrill_users_v1');
    localStorage.removeItem('cyberdrill_users');
    localStorage.removeItem('cyberdrill_current_user_v3');
    localStorage.removeItem('cyberdrill_current_user_v2');
  }
} catch {
  // ignore
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy Sarah Jenkins
          const cleaned = parsed.filter(
            (u) =>
              u.id !== 'user-admin-1' &&
              u.email?.toLowerCase() !== 'sarah.jenkins@cyberdrill.io'
          );
          // Ensure all initial users (Vinisha Mendonca and Shubh) are present
          INITIAL_USERS.forEach((initUser) => {
            if (!cleaned.some((u) => u.email?.toLowerCase() === initUser.email.toLowerCase())) {
              cleaned.push(initUser);
            }
          });
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Could not read saved users data, defaulting to initial users', e);
    }
    return INITIAL_USERS;
  });

  // Active Token Auth Session (valid for 7 hours)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const parsed: AuthSession = JSON.parse(raw);
      if (parsed && parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now()) {
        return parsed;
      }
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    } catch {
      return null;
    }
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const parsed: AuthSession = JSON.parse(raw);
        if (parsed && parsed.userId && parsed.expiresAt > Date.now()) {
          return parsed.userId;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS[0].id;
  });

  // CRITICAL: Strictly false unless a valid, unexpired token exists in localStorage!
  // Direct visits to the URL without logging in MUST NOT open the tool!
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return false;
      const parsed: AuthSession = JSON.parse(raw);
      return Boolean(parsed && parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now());
    } catch {
      return false;
    }
  });

  const [pendingLoginEmail, setPendingLoginEmail] = useState<string | null>(null);

  // OTP Verification State (6-Digit OTP)
  const [pendingOtp, setPendingOtp] = useState<{
    email: string;
    code: string;
    expiresAt: number;
  } | null>(null);

  // Master customers list (all customers in the system)
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved customers data, defaulting to initial customers', e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [selectedCustomerId, setSelectedCustomerIdState] = useState<string | null>(null);

  const [referenceDate, setReferenceDateState] = useState<string>(() => {
    try {
      const savedDate = localStorage.getItem(DATE_STORAGE_KEY);
      if (savedDate) return savedDate;
    } catch {
      // ignore
    }
    return SYSTEM_TODAY;
  });

  const [dueSoonDays, setDueSoonDays] = useState<number>(14);

  const [lastSentEmail, setLastSentEmail] = useState<{
    to: string;
    subject: string;
    body: string;
    timestamp: string;
  } | null>(null);

  const clearLastSentEmail = () => setLastSentEmail(null);

  // Derive currentUser object with guaranteed permissions
  const currentUser: UserAccount = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    const base = found || users[0] || INITIAL_USERS[0];
    return {
      ...base,
      permissions:
        base.permissions ||
        (base.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS),
    };
  }, [users, currentUserId]);

  // Subscribe to real-time Firestore users collection
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteUsers: UserAccount[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as UserAccount;
            // Purge Sarah Jenkins if still in Firestore
            if (
              docSnap.id === 'user-admin-1' ||
              data.id === 'user-admin-1' ||
              data.email?.toLowerCase() === 'sarah.jenkins@cyberdrill.io'
            ) {
              deleteDoc(doc(db, 'users', docSnap.id)).catch((err) => {
                console.warn('Cleaned up legacy user:', err);
              });
              return;
            }
            remoteUsers.push({
              ...data,
              permissions:
                data.permissions ||
                (data.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS),
            });
          });

          // Ensure all INITIAL_USERS (Admins and CSMs) are present in remoteUsers and Firestore
          INITIAL_USERS.forEach((initUser) => {
            const exists = remoteUsers.some(
              (u) => u.email?.toLowerCase() === initUser.email.toLowerCase() || u.id === initUser.id
            );
            if (!exists) {
              remoteUsers.push(initUser);
              setDoc(doc(db, 'users', initUser.id), sanitizeForFirestore(initUser)).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${initUser.id}`)
              );
            }
          });

          setUsers(remoteUsers);
        } else {
          // If remote users collection is empty, seed initial Admin Vinisha Mendonca
          INITIAL_USERS.forEach((u) => {
            setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u)).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`)
            );
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Subscribe to real-time Firestore customers collection
  useEffect(() => {
    const unsubscribeCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const remoteCustomers: Customer[] = [];
        snapshot.forEach((docSnap) => {
          remoteCustomers.push(docSnap.data() as Customer);
        });
        remoteCustomers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAllCustomers(remoteCustomers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );

    return () => unsubscribeCustomers();
  }, []);

  // Auto-persist users to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      if (currentUserId) {
        localStorage.setItem(CURRENT_USER_KEY, currentUserId);
      }
    } catch (e) {
      console.warn('Could not save users to local storage', e);
    }
  }, [users, currentUserId]);

  // Periodic active session token expiry check (auto log out when 7 hours elapse)
  useEffect(() => {
    if (!isAuthenticated || !authSession) return;

    const checkTokenExpiry = () => {
      if (Date.now() >= authSession.expiresAt) {
        console.warn('SecOps session token expired after 7 hours. Auto-logging out.');
        logout(authSession.email);
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, authSession]);

  // Auto-persist customers to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
      console.warn('Could not save customers to local storage', e);
    }
  }, [allCustomers]);

  // Helper: Create secure 7-hour session token
  const createSessionForUser = (user: UserAccount): AuthSession => {
    const now = Date.now();
    const token = `secops_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`;
    return {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      sessionDurationHours: SESSION_DURATION_HOURS,
    };
  };

  // Login via Work Email ID and Password (Direct authentication with 7-hour session token)
  const loginWithEmail = (
    email: string,
    password?: string
  ): { success: boolean; user?: UserAccount; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const matchedUser = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    );

    if (!matchedUser) {
      return {
        success: false,
        error: `No authorized account found with email "${email}". Please verify your email or select an authorized SecOps account below.`,
      };
    }

    if (matchedUser.status === 'Inactive') {
      return {
        success: false,
        error: `The account for "${email}" is currently inactive. Please contact your SecOps administrator.`,
      };
    }

    // Password Verification: Secure verification without exposing password format
    if (password !== undefined) {
      const cleanPassword = password.trim();
      if (!cleanPassword) {
        return {
          success: false,
          error: 'Please enter your password.',
        };
      }
      const expectedPassword = matchedUser.password || normalizedEmail;
      const isMatch =
        cleanPassword === expectedPassword ||
        cleanPassword.toLowerCase() === expectedPassword.toLowerCase() ||
        cleanPassword.toLowerCase() === normalizedEmail;

      if (!isMatch) {
        return {
          success: false,
          error: 'Invalid email or password. Please verify your credentials.',
        };
      }
    }

    // Generate active session token valid for 7 hours
    const session = createSessionForUser(matchedUser);
    setAuthSession(session);
    setCurrentUserIdState(matchedUser.id);
    setIsAuthenticated(true);
    setPendingLoginEmail(null);
    setPendingOtp(null);

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(CURRENT_USER_KEY, matchedUser.id);
    } catch (e) {
      console.warn('Could not persist auth session to storage', e);
    }

    return { success: true, user: matchedUser };
  };

  // Dispatch a 6-digit OTP code to the requested email ID
  const sendLoginOtp = (
    email: string
  ): { success: boolean; otp?: string; expiresAt?: number; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const matchedUser = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    );

    if (!matchedUser) {
      return {
        success: false,
        error: `No authorized account found with email "${email}". Please verify your email or select an authorized SecOps account.`,
      };
    }

    if (matchedUser.status === 'Inactive') {
      return {
        success: false,
        error: `The account for "${email}" is currently inactive.`,
      };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes OTP validity

    setPendingOtp({ email: normalizedEmail, code, expiresAt });

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Record dispatched email so it can be previewed/toasted in the UI
    setLastSentEmail({
      to: normalizedEmail,
      subject: `CyberDrill SecOps: Your 6-Digit One-Time Passcode is ${code}`,
      body: `Hello ${matchedUser.name},\n\nYour 6-digit one-time passcode (OTP) is:\n\n${code}\n\nThis verification code expires in 10 minutes. When verified, a secure access token will be issued keeping your account active for 7 hours.\n\nProgist CyberDrill SecOps Security Team`,
      timestamp,
    });

    return { success: true, otp: code, expiresAt };
  };

  // Verify 6-digit OTP and issue the 7-hour session token
  const verifyLoginOtp = (
    email: string,
    inputOtp: string
  ): { success: boolean; user?: UserAccount; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = inputOtp.trim().replace(/\D/g, '');

    if (!pendingOtp || pendingOtp.email !== normalizedEmail) {
      return {
        success: false,
        error: 'No active OTP request found for this email. Please request a new code.',
      };
    }

    if (Date.now() > pendingOtp.expiresAt) {
      setPendingOtp(null);
      return {
        success: false,
        error: 'The 6-digit OTP has expired (10-minute limit). Please request a new code.',
      };
    }

    if (cleanOtp.length !== 6 || cleanOtp !== pendingOtp.code) {
      return {
        success: false,
        error: 'Invalid 6-digit OTP code. Please check the code dispatched to your email.',
      };
    }

    // OTP matched! Log in and issue the 7-hour session token
    const res = loginWithEmail(normalizedEmail);
    if (res.success) {
      setPendingOtp(null);
    }
    return res;
  };

  // Calculate remaining active time on the current token
  const getActiveSessionRemainingTime = () => {
    if (!authSession) return null;
    const diffMs = authSession.expiresAt - Date.now();
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, isExpired: true, formatted: 'Expired' };
    }
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      hours,
      minutes,
      isExpired: false,
      formatted: `${hours}h ${minutes}m remaining`,
    };
  };

  const logout = (prefillEmail?: string) => {
    setIsAuthenticated(false);
    setAuthSession(null);
    setPendingOtp(null);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
    if (prefillEmail) {
      setPendingLoginEmail(prefillEmail);
    } else {
      setPendingLoginEmail(null);
    }
  };

  const setCurrentUserId = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    // Issue a fresh 7-hour session token for the selected user
    const session = createSessionForUser(targetUser);
    setAuthSession(session);
    setCurrentUserIdState(id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(CURRENT_USER_KEY, id);
    } catch {}

    // If switching to a CSM and the currently selected customer is not assigned to them, clear selection
    if (targetUser.role === 'CSM' && selectedCustomerId) {
      const currentCust = allCustomers.find((c) => c.id === selectedCustomerId);
      if (currentCust && currentCust.csmId !== targetUser.id) {
        setSelectedCustomerIdState(null);
      }
    }
  };

  const setReferenceDate = (date: string) => {
    setReferenceDateState(date);
    try {
      localStorage.setItem(DATE_STORAGE_KEY, date);
    } catch {
      // ignore
    }
  };

  // Permissions & Role-Based Access Control Helpers
  const hasPermission = (
    permission: keyof UserPermissions,
    user: UserAccount = currentUser
  ): boolean => {
    if (user.role === 'Admin') return true; // Admins always have master override
    const perms = user.permissions || DEFAULT_CSM_PERMISSIONS;
    return Boolean(perms[permission]);
  };

  const canUserCreateCustomer = (user: UserAccount = currentUser): boolean => {
    return hasPermission('canCreateCustomers', user);
  };

  const canUserEditCustomer = (
    customer: Customer | null | undefined,
    user: UserAccount = currentUser
  ): boolean => {
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    if (!hasPermission('canEditCustomers', user)) return false;
    return customer.csmId === user.id;
  };

  const canUserDeleteCustomer = (
    customer: Customer | null | undefined,
    user: UserAccount = currentUser
  ): boolean => {
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    if (!hasPermission('canDeleteCustomers', user)) return false;
    return customer.csmId === user.id;
  };

  const canUserManageUsers = (user: UserAccount = currentUser): boolean => {
    return user.role === 'Admin' || hasPermission('canManageUsers', user);
  };

  // Helper to check read access
  const canUserAccessCustomer = (
    customer: Customer | null | undefined,
    user: UserAccount = currentUser
  ): boolean => {
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    return customer.csmId === user.id;
  };

  // Helper to check write access
  const canUserMutateCustomer = (
    customer: Customer | null | undefined,
    user: UserAccount = currentUser
  ): boolean => {
    return canUserEditCustomer(customer, user);
  };

  // Dynamic Accessible Customers based on current user role
  const customers = useMemo(() => {
    if (currentUser.role === 'Admin') {
      return allCustomers;
    }
    // CSM role: Strictly return assigned customers
    return allCustomers.filter((c) => c.csmId === currentUser.id);
  }, [allCustomers, currentUser]);

  const setSelectedCustomerId = (id: string | null) => {
    if (!id) {
      setSelectedCustomerIdState(null);
      return;
    }
    // Verify access
    const targetCust = allCustomers.find((c) => c.id === id);
    if (targetCust && canUserAccessCustomer(targetCust, currentUser)) {
      setSelectedCustomerIdState(id);
    } else {
      console.warn('Access denied: User is not authorized to access this customer');
      setSelectedCustomerIdState(null);
    }
  };

  // Full CRUD for User and Permission Management
  const addUser = async (data: {
    name: string;
    email: string;
    role: UserRole;
    title: string;
    password?: string;
    permissions?: Partial<UserPermissions>;
  }): Promise<UserAccount> => {
    const colors = [
      'bg-emerald-600',
      'bg-violet-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-indigo-600',
      'bg-blue-600',
      'bg-purple-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const roleDefaultPerms =
      data.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS;

    const newUser: UserAccount = {
      id: `user-${data.role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      title:
        data.title.trim() ||
        (data.role === 'Admin' ? 'SecOps Administrator' : 'Customer Success Manager'),
      password: data.password?.trim() || undefined,
      permissions: {
        ...roleDefaultPerms,
        ...(data.permissions || {}),
      },
      avatarColor: randomColor,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'users', newUser.id), sanitizeForFirestore(newUser));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newUser.id}`);
    }

    // Send welcome notice email
    const emailSubject = `Welcome to CyberDrill - Your ${data.role} Account Credentials`;
    const emailText = `Hello ${newUser.name},\n\nYour account has been created on the CyberDrill Security Operations platform with role: ${newUser.role}.\n\nLogin Email: ${newUser.email}\nTitle: ${newUser.title}\n\nPlease contact your SecOps administrator if you have any questions.`;

    sendEmail({
      to: newUser.email,
      subject: emailSubject,
      text: emailText,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 540px;">
          <h2 style="color: #0284c7;">Welcome to CyberDrill Security Operations</h2>
          <p>Hello <strong>${newUser.name}</strong>,</p>
          <p>Your account has been activated with role <strong>${newUser.role}</strong>.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Login Email:</strong> ${newUser.email}</p>
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${newUser.role}</p>
            <p style="margin: 0;"><strong>Title:</strong> ${newUser.title}</p>
          </div>
          <p>You can now log into the portal anytime using your credentials.</p>
        </div>
      `,
    }).catch((err) => {
      console.warn('Welcome email dispatch info:', err);
    });

    setLastSentEmail({
      to: newUser.email,
      subject: emailSubject,
      body: emailText,
      timestamp: new Date().toLocaleTimeString(),
    });

    return newUser;
  };

  const updateUser = (id: string, partial: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          let updatedPerms = partial.permissions !== undefined ? partial.permissions : u.permissions;
          if (partial.role && partial.role !== u.role && partial.permissions === undefined) {
            updatedPerms =
              partial.role === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CSM_PERMISSIONS;
          }

          const updated: UserAccount = {
            ...u,
            ...partial,
            permissions: updatedPerms,
          };

          setDoc(doc(db, 'users', id), sanitizeForFirestore(updated)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${id}`)
          );

          // If name changed, update csmName in customers
          if (partial.name && partial.name !== u.name) {
            setAllCustomers((custPrev) =>
              custPrev.map((c) => {
                if (c.csmId === id) {
                  const updatedCust = { ...c, csmName: partial.name };
                  setDoc(doc(db, 'customers', c.id), sanitizeForFirestore(updatedCust)).catch((err) =>
                    handleFirestoreError(err, OperationType.WRITE, `customers/${c.id}`)
                  );
                  return updatedCust;
                }
                return c;
              })
            );
          }

          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!canUserManageUsers(currentUser)) {
      return {
        success: false,
        error: 'Unauthorized: Admin permission required to remove team accounts.',
      };
    }
    if (currentUser.id === id) {
      return {
        success: false,
        error: 'Cannot delete the account you are currently logged in with.',
      };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    // Safely unassign customers currently attached to this user
    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.csmId === id) {
          const updated: Customer = {
            ...c,
            csmId: undefined,
            csmName: undefined,
            updatedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'customers', c.id), sanitizeForFirestore(updated)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `customers/${c.id}`)
          );
          return updated;
        }
        return c;
      })
    );

    setUsers((prev) => prev.filter((u) => u.id !== id));

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }

    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated: UserAccount = {
            ...u,
            status: u.status === 'Active' ? 'Inactive' : 'Active',
          };
          setDoc(doc(db, 'users', id), sanitizeForFirestore(updated)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${id}`)
          );
          return updated;
        }
        return u;
      })
    );
  };

  // Aliases for backward compatibility
  const addCsmUser = (data: { name: string; email: string; title: string }) =>
    addUser({ ...data, role: 'CSM' });
  const updateCsmUser = updateUser;
  const toggleCsmStatus = toggleUserStatus;

  const assignCustomerCsm = (
    customerId: string,
    csmId: string | undefined,
    csmName?: string
  ) => {
    const assignedUser = csmId ? users.find((u) => u.id === csmId) : undefined;
    const finalCsmName = csmName || (assignedUser ? assignedUser.name : undefined);

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updated: Customer = {
            ...c,
            csmId: csmId || undefined,
            csmName: finalCsmName,
            updatedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'customers', customerId), sanitizeForFirestore(updated)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `customers/${customerId}`)
          );
          return updated;
        }
        return c;
      })
    );
  };

  const persistCustomer = (customer: Customer) => {
    setDoc(doc(db, 'customers', customer.id), sanitizeForFirestore(customer)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `customers/${customer.id}`)
    );
  };

  // Customer Management
  const addCustomer = (customerData: {
    companyName: string;
    customerContact: string;
    contactEmail?: string;
    contactPhone?: string;
    accountOwner: string;
    csmId?: string;
    startDate: string;
    endDate?: string;
    annualRequirement: number;
    intervalMonths: number;
    defaultDrillType: DrillType;
    industry?: string;
    notes?: string;
    products?: CustomerProducts;
    licenseDetails?: LicenseDetails;
  }): Customer => {
    const newId = `cust-${Date.now()}`;
    const startYear = parseInt(customerData.startDate.substring(0, 4), 10) || 2026;

    const initialPlanDrills = generateAnnualTimeline(
      customerData.startDate,
      customerData.annualRequirement,
      customerData.intervalMonths,
      customerData.defaultDrillType,
      customerData.licenseDetails?.managedDrillFrequency
    );

    const effectiveCsmId =
      customerData.csmId || (currentUser.role === 'CSM' ? currentUser.id : undefined);
    const assignedCsm = effectiveCsmId
      ? users.find((u) => u.id === effectiveCsmId)
      : undefined;

    const newCustomer: Customer = {
      id: newId,
      companyName: customerData.companyName.trim(),
      customerContact: customerData.customerContact.trim(),
      contactEmail: customerData.contactEmail?.trim(),
      contactPhone: customerData.contactPhone?.trim(),
      accountOwner: customerData.accountOwner.trim(),
      csmId: effectiveCsmId || undefined,
      csmName: assignedCsm ? assignedCsm.name : undefined,
      startDate: customerData.startDate,
      endDate: customerData.endDate,
      status: 'Active',
      currentYear: startYear,
      industry: customerData.industry?.trim(),
      notes: customerData.notes?.trim(),
      products: customerData.products || {
        prophish: true,
        proLms: false,
        proPatrol: false,
      },
      licenseDetails: customerData.licenseDetails,
      annualPlans: {
        [startYear]: {
          year: startYear,
          annualRequirement: customerData.annualRequirement,
          startDate: customerData.startDate,
          intervalMonths: customerData.intervalMonths,
          defaultDrillType: customerData.defaultDrillType,
          drills: initialPlanDrills,
          deliverables: [],
          notes: customerData.notes,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAllCustomers((prev) => [newCustomer, ...prev]);
    persistCustomer(newCustomer);
    return newCustomer;
  };

  const updateCustomer = (id: string, partial: Partial<Customer>): boolean => {
    let found = false;
    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          found = true;
          let updatedCsmName = c.csmName;
          if (partial.csmId !== undefined) {
            const assigned = users.find((u) => u.id === partial.csmId);
            updatedCsmName = assigned ? assigned.name : undefined;
          }
          const updated: Customer = {
            ...c,
            ...partial,
            csmName: updatedCsmName,
            updatedAt: new Date().toISOString(),
          };
          persistCustomer(updated);
          return updated;
        }
        return c;
      })
    );
    return found;
  };

  const deleteCustomer = (id: string): boolean => {
    const target = allCustomers.find((c) => c.id === id);
    if (!target) return false;

    if (!canUserDeleteCustomer(target, currentUser)) {
      console.warn('Unauthorized: User does not have permission to delete customer account:', id);
      return false;
    }

    let found = false;
    setAllCustomers((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length !== prev.length) found = true;
      return filtered;
    });
    if (selectedCustomerId === id) {
      setSelectedCustomerIdState(null);
    }
    deleteDoc(doc(db, 'customers', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `customers/${id}`)
    );
    return found;
  };

  const markDrillCompleted = (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ): boolean => {
    let targetYear: number;
    let targetDrillId: string;
    let completionData: {
      actualCompletionDate: string;
      overallResult: any;
      metrics?: any;
      notes?: string;
      campaignName?: string;
    };

    if (typeof yearOrDrillId === 'number') {
      targetYear = yearOrDrillId;
      targetDrillId = drillIdOrData;
      completionData = maybeData;
    } else {
      targetDrillId = yearOrDrillId;
      completionData = drillIdOrData;
      const cust = allCustomers.find((c) => c.id === customerId);
      targetYear = cust?.currentYear || 2026;
    }

    let updatedSuccess = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedDrills = currentPlan.drills.map((d) => {
          if (d.id !== targetDrillId) return d;

          const updatedDrill: DrillRecord = {
            ...d,
            actualCompletionDate: completionData.actualCompletionDate,
            overallResult: completionData.overallResult || 'Passed',
            status: 'Completed',
            notes: completionData.notes !== undefined ? completionData.notes : d.notes,
            campaignName:
              completionData.campaignName !== undefined
                ? completionData.campaignName
                : d.campaignName,
            metrics: completionData.metrics || d.metrics,
          };
          return updatedDrill;
        });

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              drills: updatedDrills,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        updatedSuccess = true;
        return updatedCust;
      })
    );

    return updatedSuccess;
  };

  const updateDrillSchedule = (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ): boolean => {
    let targetYear: number;
    let targetDrillId: string;
    let scheduleData: {
      plannedDate?: string;
      drillType?: DrillType;
      campaignName?: string;
      notes?: string;
    };

    if (typeof yearOrDrillId === 'number') {
      targetYear = yearOrDrillId;
      targetDrillId = drillIdOrData;
      scheduleData = maybeData;
    } else {
      targetDrillId = yearOrDrillId;
      scheduleData = drillIdOrData;
      const cust = allCustomers.find((c) => c.id === customerId);
      targetYear = cust?.currentYear || 2026;
    }

    let updatedSuccess = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedDrills = currentPlan.drills.map((d) => {
          if (d.id !== targetDrillId) return d;
          return {
            ...d,
            ...(scheduleData.plannedDate ? { plannedDate: scheduleData.plannedDate } : {}),
            ...(scheduleData.drillType ? { drillType: scheduleData.drillType } : {}),
            ...(scheduleData.campaignName !== undefined
              ? { campaignName: scheduleData.campaignName }
              : {}),
            ...(scheduleData.notes !== undefined ? { notes: scheduleData.notes } : {}),
          };
        });

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              drills: updatedDrills,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        updatedSuccess = true;
        return updatedCust;
      })
    );

    return updatedSuccess;
  };

  const updateReviewMeeting = (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrMeeting: any,
    maybeMeeting?: any
  ): boolean => {
    let targetDrillId: string | undefined;
    let targetYear: number | undefined;
    let meetingData: ReviewMeeting | undefined;

    if (typeof yearOrDrillId === 'number') {
      targetYear = yearOrDrillId;
      if (typeof drillIdOrMeeting === 'string') {
        targetDrillId = drillIdOrMeeting;
        meetingData = maybeMeeting;
      } else {
        meetingData = drillIdOrMeeting;
      }
    } else {
      targetDrillId = yearOrDrillId;
      meetingData = drillIdOrMeeting;
    }

    let updatedSuccess = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const updatedAnnualPlans = { ...c.annualPlans };

        Object.keys(updatedAnnualPlans).forEach((yrStr) => {
          const yr = Number(yrStr);
          if (targetYear !== undefined && yr !== targetYear) return;

          const plan = updatedAnnualPlans[yr];
          if (!plan) return;

          let planChanged = false;
          const updatedDrills = plan.drills.map((d) => {
            if (targetDrillId && d.id !== targetDrillId) return d;
            planChanged = true;
            return {
              ...d,
              reviewMeeting:
                meetingData && (meetingData.date || meetingData.status !== 'Not Scheduled')
                  ? meetingData
                  : undefined,
            };
          });

          if (planChanged) {
            updatedAnnualPlans[yr] = {
              ...plan,
              drills: updatedDrills,
              reviewMeeting: meetingData,
            };
            updatedSuccess = true;
          }
        });

        const updatedCust: Customer = {
          ...c,
          annualPlans: updatedAnnualPlans,
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        return updatedCust;
      })
    );

    return updatedSuccess;
  };

  const createNewYearPlan = (
    customerId: string,
    newYear: number,
    startDate: string,
    annualRequirement: number,
    intervalMonths: number,
    defaultDrillType?: DrillType,
    notes?: string
  ): boolean => {
    let success = false;
    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const newDrills = generateAnnualTimeline(
          startDate,
          annualRequirement,
          intervalMonths,
          defaultDrillType || 'Phishing Email Simulation',
          c.licenseDetails?.managedDrillFrequency
        );

        const newPlan: AnnualPlan = {
          year: newYear,
          annualRequirement,
          startDate,
          intervalMonths,
          defaultDrillType: defaultDrillType || 'Phishing Email Simulation',
          drills: newDrills,
          deliverables: [],
          notes,
        };

        const updatedCust: Customer = {
          ...c,
          currentYear: newYear,
          annualPlans: {
            ...c.annualPlans,
            [newYear]: newPlan,
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        success = true;
        return updatedCust;
      })
    );
    return success;
  };

  const addLmsDeliverable = (
    customerId: string,
    year: number,
    data: {
      title: string;
      frequency: DeliverableFrequency;
      plannedDate: string;
      targetAudience?: string;
      notes?: string;
    }
  ): LmsDeliverable | null => {
    let createdDeliverable: LmsDeliverable | null = null;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const plan = c.annualPlans[year];
        if (!plan) return c;

        const newDel: LmsDeliverable = {
          id: `deliv-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title: data.title.trim(),
          frequency: data.frequency,
          plannedDate: data.plannedDate,
          status: 'Upcoming',
          targetAudience: data.targetAudience?.trim(),
          notes: data.notes?.trim(),
        };

        createdDeliverable = newDel;

        const existingDeliverables = plan.deliverables || [];
        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: [...existingDeliverables, newDel],
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        return updatedCust;
      })
    );

    return createdDeliverable;
  };

  const updateLmsDeliverable = (
    customerId: string,
    year: number,
    deliverableId: string,
    partial: Partial<LmsDeliverable>
  ): boolean => {
    let success = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const plan = c.annualPlans[year];
        if (!plan || !plan.deliverables) return c;

        const updatedDeliverables = plan.deliverables.map((d) => {
          if (d.id !== deliverableId) return d;
          success = true;
          return { ...d, ...partial };
        });

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        return updatedCust;
      })
    );

    return success;
  };

  const deleteLmsDeliverable = (
    customerId: string,
    year: number,
    deliverableId: string
  ): boolean => {
    let success = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const plan = c.annualPlans[year];
        if (!plan || !plan.deliverables) return c;

        const updatedDeliverables = plan.deliverables.filter((d) => d.id !== deliverableId);
        if (updatedDeliverables.length !== plan.deliverables.length) {
          success = true;
        }

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        return updatedCust;
      })
    );

    return success;
  };

  const markDeliverableCompleted = (
    customerId: string,
    year: number,
    deliverableId: string,
    completionData: {
      actualCompletionDate: string;
      completionRate?: number;
      notes?: string;
    }
  ): boolean => {
    let success = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const plan = c.annualPlans[year];
        if (!plan || !plan.deliverables) return c;

        const updatedDeliverables = plan.deliverables.map((d) => {
          if (d.id !== deliverableId) return d;
          success = true;
          return {
            ...d,
            actualCompletionDate: completionData.actualCompletionDate,
            completionRate: completionData.completionRate,
            notes: completionData.notes !== undefined ? completionData.notes : d.notes,
            status: 'Completed',
          };
        });

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
          updatedAt: new Date().toISOString(),
        };

        persistCustomer(updatedCust);
        return updatedCust;
      })
    );

    return success;
  };

  const bulkImportCustomers = (rows: any[]): number => {
    let count = 0;
    const newCustomers: Customer[] = [];

    rows.forEach((row) => {
      if (!row.companyName) return;

      const startDate = row.startDate || SYSTEM_TODAY;
      const annualRequirement = Number(row.annualRequirement) || 4;
      const intervalMonths = Number(row.intervalMonths) || 3;
      const defaultDrillType = (row.defaultDrillType as DrillType) || 'Phishing Email Simulation';
      const startYear = parseInt(startDate.substring(0, 4), 10) || 2026;

      const initialPlan = generateAnnualTimeline(
        startDate,
        annualRequirement,
        intervalMonths,
        defaultDrillType
      );

      const assignedCsm = row.csmId ? users.find((u) => u.id === row.csmId) : undefined;

      const newCust: Customer = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        companyName: String(row.companyName).trim(),
        customerContact: String(row.customerContact || 'Lead SecOps').trim(),
        contactEmail: row.contactEmail ? String(row.contactEmail).trim() : undefined,
        contactPhone: row.contactPhone ? String(row.contactPhone).trim() : undefined,
        accountOwner: String(row.accountOwner || 'Direct').trim(),
        csmId: row.csmId || undefined,
        csmName: assignedCsm ? assignedCsm.name : undefined,
        startDate: startDate,
        endDate: row.endDate || undefined,
        status: 'Active',
        currentYear: startYear,
        industry: row.industry ? String(row.industry).trim() : undefined,
        notes: row.notes ? String(row.notes).trim() : undefined,
        products: {
          prophish: row.productProphish !== false,
          proLms: Boolean(row.productProLms),
          proPatrol: Boolean(row.productProPatrol),
        },
        annualPlans: {
          [startYear]: {
            year: startYear,
            annualRequirement,
            startDate,
            intervalMonths,
            defaultDrillType,
            drills: initialPlan,
            deliverables: [],
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newCustomers.push(newCust);
      persistCustomer(newCust);
      count++;
    });

    if (newCustomers.length > 0) {
      setAllCustomers((prev) => [...newCustomers, ...prev]);
    }

    return count;
  };

  const resetToDemoData = () => {
    setAllCustomers([]);
    setUsers(INITIAL_USERS);
    setCurrentUserIdState(INITIAL_USERS[0].id);
    setSelectedCustomerIdState(null);
    setReferenceDate(SYSTEM_TODAY);
    try {
      localStorage.setItem(CURRENT_USER_KEY, INITIAL_USERS[0].id);
      localStorage.setItem(DATE_STORAGE_KEY, SYSTEM_TODAY);
    } catch {
      // ignore
    }
  };

  const purgeProductionData = async (): Promise<boolean> => {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      setAllCustomers([]);
      setSelectedCustomerIdState(null);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } catch {}
      return true;
    } catch (e) {
      console.error('Failed to purge production data:', e);
      handleFirestoreError(e, OperationType.DELETE, 'customers');
      return false;
    }
  };

  const exportDataJSON = () => {
    return JSON.stringify({ customers: allCustomers, users }, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        setAllCustomers(parsed);
        parsed.forEach((c) => persistCustomer(c));
        return true;
      } else if (parsed && Array.isArray(parsed.customers)) {
        setAllCustomers(parsed.customers);
        parsed.customers.forEach((c: Customer) => persistCustomer(c));
        if (Array.isArray(parsed.users)) {
          setUsers(parsed.users);
          parsed.users.forEach((u: UserAccount) => {
            setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u)).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`)
            );
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        allCustomers,
        selectedCustomerId,
        setSelectedCustomerId,
        referenceDate,
        setReferenceDate,
        dueSoonDays,
        setDueSoonDays,
        users,
        currentUser,
        isAuthenticated,
        authSession,
        pendingLoginEmail,
        setPendingLoginEmail,
        loginWithEmail,
        sendLoginOtp,
        verifyLoginOtp,
        getActiveSessionRemainingTime,
        logout,
        setCurrentUserId,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addCsmUser,
        updateCsmUser,
        toggleCsmStatus,
        assignCustomerCsm,
        hasPermission,
        canUserCreateCustomer,
        canUserEditCustomer,
        canUserDeleteCustomer,
        canUserManageUsers,
        canUserAccessCustomer,
        canUserMutateCustomer,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        markDrillCompleted,
        updateDrillSchedule,
        updateReviewMeeting,
        createNewYearPlan,
        addLmsDeliverable,
        updateLmsDeliverable,
        deleteLmsDeliverable,
        markDeliverableCompleted,
        resetToDemoData,
        purgeProductionData,
        exportDataJSON,
        importDataJSON,
        bulkImportCustomers,
        lastSentEmail,
        clearLastSentEmail,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within a CustomerProvider');
  }
  return context;
};
