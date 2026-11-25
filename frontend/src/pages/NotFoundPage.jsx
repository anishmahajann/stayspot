import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiCompass } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl font-extrabold mb-6">
        404
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-600 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved to another location.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all"
        >
          <FiHome className="w-5 h-5" />
          <span>Go to Homepage</span>
        </Link>
        <Link
          to="/search"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
        >
          <FiCompass className="w-5 h-5" />
          <span>Explore Stays</span>
        </Link>
      </div>
    </div>
  );
}
