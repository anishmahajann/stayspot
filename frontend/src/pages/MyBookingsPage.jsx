import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format, isAfter, isBefore, startOfToday, parseISO } from 'date-fns';
import { fetchMyBookings, cancelBooking } from '../store/slices/bookingSlice';
import CancellationPolicy from '../components/booking/CancellationPolicy';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import {
  FiCalendar,
  FiMapPin,
  FiAlertCircle,
  FiXCircle,
  FiCheckCircle,
  FiChevronRight,
  FiInbox,
  FiCompass,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const dispatch = useDispatch();
  const { myBookings, loading } = useSelector((state) => state.booking);

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Pagination local state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const today = startOfToday();

  // Categorize bookings into tabs
  const upcomingBookings = (myBookings || []).filter((b) => {
    if (b.status === 'cancelled') return false;
    const checkOut = b.checkOut ? parseISO(b.checkOut) : null;
    return checkOut && isAfter(checkOut, today);
  });

  const pastBookings = (myBookings || []).filter((b) => {
    if (b.status === 'cancelled') return false;
    const checkOut = b.checkOut ? parseISO(b.checkOut) : null;
    return checkOut && isBefore(checkOut, today);
  });

  const cancelledBookings = (myBookings || []).filter((b) => b.status === 'cancelled');

  let currentTabBookings = [];
  if (activeTab === 'upcoming') currentTabBookings = upcomingBookings;
  else if (activeTab === 'past') currentTabBookings = pastBookings;
  else currentTabBookings = cancelledBookings;

  // Pagination slice
  const totalPages = Math.ceil(currentTabBookings.length / itemsPerPage) || 1;
  const paginatedBookings = currentTabBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancellationReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setIsCancelling(true);
      const res = await dispatch(
        cancelBooking({
          bookingId: selectedBookingForCancel._id,
          reason: cancellationReason,
        })
      );

      if (cancelBooking.fulfilled.match(res)) {
        toast.success('Booking successfully cancelled. Refund processed.');
        setCancelModalOpen(false);
        setSelectedBookingForCancel(null);
        dispatch(fetchMyBookings());
      } else {
        toast.error(res.payload || 'Failed to cancel booking');
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred while cancelling');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your upcoming stays, view booking history, or cancel reservations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upcoming');
            setCurrentPage(1);
          }}
          className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 -mb-px flex items-center space-x-2 ${
            activeTab === 'upcoming'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Upcoming</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'upcoming'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {upcomingBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('past');
            setCurrentPage(1);
          }}
          className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 -mb-px flex items-center space-x-2 ${
            activeTab === 'past'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Past Stays</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'past'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {pastBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('cancelled');
            setCurrentPage(1);
          }}
          className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 -mb-px flex items-center space-x-2 ${
            activeTab === 'cancelled'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Cancelled</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'cancelled'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cancelledBookings.length}
          </span>
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner text="Loading your reservations..." />
      ) : paginatedBookings.length > 0 ? (
        <div className="space-y-4">
          {paginatedBookings.map((b) => {
            const prop = b.propertyId || {};
            const unit = b.unitId || {};
            const firstImg =
              prop.images?.[0]?.url ||
              (typeof prop.images?.[0] === 'string' ? prop.images[0] : null) ||
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';

            const statusColors = {
              confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              held: 'bg-amber-50 text-amber-700 border-amber-200',
              cancelled: 'bg-red-50 text-red-700 border-red-200',
              completed: 'bg-gray-100 text-gray-700 border-gray-200',
            }[b.status] || 'bg-gray-50 text-gray-700 border-gray-200';

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left: Image & Info */}
                <div className="flex items-start space-x-4">
                  <img
                    src={firstImg}
                    alt={prop.title || 'Property'}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${statusColors}`}>
                        {b.status}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        #{b._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <Link to={`/property/${prop._id || prop}`}>
                      <h3 className="font-bold text-gray-900 text-lg hover:text-emerald-600 transition-colors line-clamp-1">
                        {prop.title || 'Property Stay'}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-500 flex items-center space-x-1">
                      <FiMapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{prop.location?.city || 'India'}</span>
                      {unit.name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-700 font-medium">{unit.name}</span>
                        </>
                      )}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-gray-600 pt-1">
                      <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {b.checkIn ? format(new Date(b.checkIn), 'MMM dd, yyyy') : 'N/A'} —{' '}
                        {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span>{b.nights} Nights</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-gray-400 block">Total Amount</span>
                    <span className="text-xl font-extrabold text-gray-900">
                      ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* View voucher for confirmed */}
                    {b.status === 'confirmed' && (
                      <Link
                        to={`/booking-confirmation/${b._id}`}
                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Voucher
                      </Link>
                    )}

                    {/* Cancel action only for upcoming non-cancelled bookings */}
                    {activeTab === 'upcoming' && b.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(b)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty States */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <FiInbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {activeTab === 'upcoming'
              ? 'No upcoming reservations'
              : activeTab === 'past'
              ? 'No completed stay records yet'
              : 'No cancelled bookings'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {activeTab === 'upcoming'
              ? 'Ready for your next vacation or celebration? Explore thousands of luxury stays and event spaces.'
              : 'When you take trips with StaySpot, your reservation history will appear here.'}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all"
          >
            <FiCompass className="w-4 h-4" />
            <span>Find a Stay</span>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-9 h-9 rounded-xl text-xs font-semibold ${
                currentPage === p
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
      >
        {selectedBookingForCancel && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel your stay at{' '}
              <strong className="text-gray-900">
                {selectedBookingForCancel.propertyId?.title || 'this property'}
              </strong>
              ?
            </p>

            {/* Refund Preview */}
            <CancellationPolicy
              policyType={selectedBookingForCancel.propertyId?.policies?.cancellation || 'moderate'}
              checkIn={selectedBookingForCancel.checkIn}
              totalAmount={selectedBookingForCancel.totalAmount}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Change of plans, date conflict, etc."
                className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
