'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl mr-3">
            {user.role === 'patient' ? '👤' : '👨‍⚕️'}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600">
              {user.role === 'patient' ? 'Patient Account' : 'Healthcare Provider'} • {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/profile"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Profile
          </Link>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}