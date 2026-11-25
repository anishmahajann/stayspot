import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';
import { FiShield } from 'react-icons/fi';

export default function OwnerRoute({ children }) {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying host privileges..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto my-20 px-6 py-10 bg-white rounded-3xl border border-gray-100 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <FiShield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Host Account Required</h2>
        <p className="text-sm text-gray-600">
          You are currently signed in as a Guest (<span className="font-semibold">{user?.email}</span>).
          Sign in or register with a Property Host / Owner account to access the Host Dashboard, property listings, and analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/register?role=owner&redirect=/owner/dashboard"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            Register as Host
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
