import { Customer, UserAccount } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-vinisha',
    name: 'Vinisha Mendonca',
    email: 'vinisha.mendonca@progist.net',
    role: 'Admin',
    title: 'Director of SecOps (Admin)',
    avatarColor: 'bg-purple-600',
    status: 'Active',
    createdAt: '2026-01-01T08:00:00Z',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];
