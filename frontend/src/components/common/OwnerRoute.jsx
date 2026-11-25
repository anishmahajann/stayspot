import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { loadUser } from '../../store/slices/authSlice';
import LoadingSpinner from './LoadingSpinner';
import { FiLock, FiUser, FiKey, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * Protects all /owner/* routes (Host Dashboard, Property Manager, Calendar, Analytics & Reports).
 * Requires explicit Host ID & Password verification stored in sessionStorage.
 */
export default function OwnerRoute({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const [hostPortalToken, setHostPortalToken] = useState(() =>
    sessionStorage.getItem('hostPortalToken')
  );
  const [hostId, setHostId] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying host privileges..." />;
  }

  const isHostAuthorized =
    Boolean(hostPortalToken) &&
    isAuthenticated &&
    (user?.role === 'owner' || user?.role === 'admin');

  if (isHostAuthorized) {
    return children;
  }

  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setVerifying(true);
      const { data } = await api.post('/owner/verify-access', {
        hostId: hostId.trim(),
        password,
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      if (data.hostPortalToken) {
        sessionStorage.setItem('hostPortalToken', data.hostPortalToken);
        setHostPortalToken(data.hostPortalToken);
      }

      await dispatch(loadUser());
      toast.success('Host Portal unlocked!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid Host ID or Password';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <FiLock className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block">
            Restricted Access
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Host Portal Login
          </h2>
          <p className="text-sm text-gray-600">
            Enter your authorized Host ID and Password to access the Host Dashboard, Property Management, and Analytics &amp; Reports.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiUser className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={hostId}
                onChange={(e) => setHostId(e.target.value)}
                placeholder="Enter Host ID"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiKey className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {verifying ? <LoadingSpinner size="sm" text="" /> : 'Unlock Host Portal'}
          </button>
        </form>

        <div className="pt-3 border-t border-gray-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to StaySpot Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
