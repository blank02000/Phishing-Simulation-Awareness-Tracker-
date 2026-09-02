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
  loginWithEmail: (email: string) => { success: boolean; user?: UserAccount; error?: string };
  logout: () => void;
  setCurrentUserId: (id: string) => void;
  addCsmUser: (data: { name: string; email: string; title: string }) => Promise<UserAccount>;
  updateCsmUser: (id: string, partial: Partial<UserAccount>) => void;
  toggleCsmStatus: (id: string) => void;
  assignCustomerCsm: (customerId: string, csmId: string | undefined, csmName?: string) => void;
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
const AUTH_STATE_KEY = 'cyberdrill_auth_state_v4';
const DATE_STORAGE_KEY = 'cyberdrill_ref_date_v4';

// Clear legacy cached demo customers & users from older versions (including Sarah Jenkins)
try {
  if (typeof window !== 'undefined' && window.localStorage) {
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
          if (cleaned.length > 0) {
            // Ensure Vinisha Mendonca is present
            if (!cleaned.some((u) => u.email?.toLowerCase() === 'vinisha.mendonca@progist.net')) {
              cleaned.unshift(INITIAL_USERS[0]);
            }
            return cleaned;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read saved users data, defaulting to initial users', e);
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved && saved !== 'user-admin-1') return saved;
    } catch {
      // ignore
    }
    return INITIAL_USERS[0].id; // Default to Admin Vinisha Mendonca
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STATE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    return true; // Default logged in for existing session
  });

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

  // Derive currentUser object
  const currentUser: UserAccount = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    return found || users[0] || INITIAL_USERS[0];
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
            remoteUsers.push(data);
          });

          // Check if Vinisha Mendonca is present in remoteUsers
          const hasVinisha = remoteUsers.some(
            (u) => u.email?.toLowerCase() === 'vinisha.mendonca@progist.net'
          );

          if (!hasVinisha) {
            const vinishaAdmin = INITIAL_USERS[0];
            remoteUsers.unshift(vinishaAdmin);
            setDoc(doc(db, 'users', vinishaAdmin.id), sanitizeForFirestore(vinishaAdmin)).catch(
              (err) => handleFirestoreError(err, OperationType.WRITE, `users/${vinishaAdmin.id}`)
            );
          }

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
      localStorage.setItem(CURRENT_USER_KEY, currentUserId);
      localStorage.setItem(AUTH_STATE_KEY, String(isAuthenticated));
    } catch (e) {
      console.warn('Could not save users to local storage', e);
    }
  }, [users, currentUserId, isAuthenticated]);

  // Auto-persist customers to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
      console.warn('Could not save customers to local storage', e);
    }
  }, [allCustomers]);

  // Login via Email ID
  const loginWithEmail = (
    email: string
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
        error: `No account found with email "${email}". Please verify your email or contact the Admin (vinisha.mendonca@progist.net).`,
      };
    }

    if (matchedUser.status === 'Inactive') {
      return {
        success: false,
        error: `The account for "${email}" is currently inactive. Please contact the administrator.`,
      };
    }

    setCurrentUserIdState(matchedUser.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(CURRENT_USER_KEY, matchedUser.id);
      localStorage.setItem(AUTH_STATE_KEY, 'true');
    } catch {}

    return { success: true, user: matchedUser };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(AUTH_STATE_KEY, 'false');
    } catch {}
  };

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(CURRENT_USER_KEY, id);
      localStorage.setItem(AUTH_STATE_KEY, 'true');
    } catch {}

    // If switching to a CSM and the currently selected customer is not assigned to them, clear selection
    const targetUser = users.find((u) => u.id === id);
    if (targetUser && targetUser.role === 'CSM' && selectedCustomerId) {
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
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    return customer.csmId === user.id;
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

  // CSM User Management Actions (Admin only)
  const addCsmUser = async (data: {
    name: string;
    email: string;
    title: string;
  }): Promise<UserAccount> => {
    const colors = [
      'bg-emerald-600',
      'bg-violet-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-indigo-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCsm: UserAccount = {
      id: `user-csm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'CSM',
      title: data.title.trim() || 'Customer Success Manager',
      avatarColor: randomColor,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newCsm]);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'users', newCsm.id), sanitizeForFirestore(newCsm));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newCsm.id}`);
    }

    // Dispatch welcome email via Nodemailer SMTP (or record locally)
    const emailSubject = `Welcome to CyberDrill - Your CSM Account & Login Credentials`;
    const emailText = `Hello ${newCsm.name},\n\nYour Customer Success Manager account has been activated on the CyberDrill Security Operations platform.\n\nYou can now log in using your email ID: ${newCsm.email}\n\nAssigned Title: ${newCsm.title}\nRole: CSM\n\nBest regards,\nVinisha Mendonca (Director of SecOps)`;
    
    sendEmail({
      to: newCsm.email,
      subject: emailSubject,
      text: emailText,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 540px;">
          <h2 style="color: #0284c7;">Welcome to CyberDrill Security Operations</h2>
          <p>Hello <strong>${newCsm.name}</strong>,</p>
          <p>Your Customer Success Manager account has been activated.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Your Login Email:</strong> ${newCsm.email}</p>
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> Customer Success Manager (CSM)</p>
            <p style="margin: 0;"><strong>Title:</strong> ${newCsm.title}</p>
          </div>
          <p>You can now log into the portal anytime using your email ID to monitor simulations and manage client reviews.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Administrator: Vinisha Mendonca (vinisha.mendonca@progist.net)</p>
        </div>
      `,
    }).catch((err) => {
      console.warn('Welcome email dispatch info:', err);
    });

    setLastSentEmail({
      to: newCsm.email,
      subject: emailSubject,
      body: emailText,
      timestamp: new Date().toLocaleTimeString(),
    });

    return newCsm;
  };

  const updateCsmUser = (id: string, partial: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...partial };
          // Persist to Firestore
          setDoc(doc(db, 'users', id), sanitizeForFirestore(updated)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${id}`)
          );
          // If name changed, update csmName in customers
          if (partial.name && partial.name !== u.name) {
            setAllCustomers((custPrev) =>
              custPrev.map((c) => {
                if (c.csmId === id) {
                  const updatedCust = { ...c, csmName: partial.name };
                  setDoc(doc(db, 'customers', c.id), sanitizeForFirestore(updatedCust)).catch(
                    (err) => handleFirestoreError(err, OperationType.WRITE, `customers/${c.id}`)
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

  const toggleCsmStatus = (id: string) => {
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
      customerData.defaultDrillType
    );

    const assignedCsm = customerData.csmId
      ? users.find((u) => u.id === customerData.csmId)
      : undefined;

    const newCustomer: Customer = {
      id: newId,
      companyName: customerData.companyName.trim(),
      customerContact: customerData.customerContact.trim(),
      contactEmail: customerData.contactEmail?.trim(),
      contactPhone: customerData.contactPhone?.trim(),
      accountOwner: customerData.accountOwner.trim(),
      csmId: customerData.csmId || undefined,
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
    let targetYear: number;
    let meetingData: ReviewMeeting;

    if (typeof yearOrDrillId === 'number') {
      targetYear = yearOrDrillId;
      meetingData = maybeMeeting || drillIdOrMeeting;
    } else {
      const cust = allCustomers.find((c) => c.id === customerId);
      targetYear = cust?.currentYear || 2026;
      meetingData = drillIdOrMeeting;
    }

    let updatedSuccess = false;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedCust: Customer = {
          ...c,
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              reviewMeeting: meetingData,
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
          defaultDrillType || 'Phishing Email Simulation'
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
      localStorage.setItem(AUTH_STATE_KEY, 'true');
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
        loginWithEmail,
        logout,
        setCurrentUserId,
        addCsmUser,
        updateCsmUser,
        toggleCsmStatus,
        assignCustomerCsm,
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
