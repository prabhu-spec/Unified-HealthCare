'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="bg-purple-700 text-white px-4 py-2 rounded mb-4 hover:bg-purple-800 transition-colors inline-block">
            ← Back to Hospitals
          </Link>
          
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">
                {user.role === 'patient' ? '👤' : '👨‍⚕️'}
              </span>
              <h1 className="text-2xl font-bold">User Profile</h1>
            </div>
            <p className="text-purple-100">Manage your account and security settings</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-2xl mx-auto">
          {/* User Information Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {user.firstName}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {user.lastName}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {user.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {user.role === 'patient' ? '👤 Patient' : '👨‍⚕️ Healthcare Provider'}
                </div>
              </div>
              
              {user.dateOfBirth && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {new Date(user.dateOfBirth).toLocaleDateString()}
                  </div>
                </div>
              )}
              
              {user.patientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {user.patientId}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 text-xl mr-3">✅</span>
                  <div>
                    <p className="font-medium text-green-800">Account Verified</p>
                    <p className="text-sm text-green-600">Your account is active and verified</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-600 text-xl mr-3">🔒</span>
                  <div>
                    <p className="font-medium text-blue-800">HIPAA Compliant</p>
                    <p className="text-sm text-blue-600">Your data is protected by HIPAA regulations</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Account Created:</span>
                  <br />
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Login:</span>
                  <br />
                  {new Date(user.lastLogin).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/records"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-gray-900">View Medical Records</p>
                  <p className="text-sm text-gray-600">Access your patient records</p>
                </div>
              </Link>
              
              <Link
                href="/"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🏥</span>
                <div>
                  <p className="font-medium text-gray-900">Find Hospitals</p>
                  <p className="text-sm text-gray-600">Search for healthcare providers</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Security</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Secure Logout</p>
                <p className="text-sm text-gray-600">End your session securely</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}