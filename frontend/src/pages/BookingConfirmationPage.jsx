import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FiCheck,
  FiPrinter,
  FiCalendar,
  FiHome,
  FiMapPin,
  FiUsers,
  FiArrowRight,
  FiDownload,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data.booking || data);
      } catch (err) {
        toast.error('Could not load confirmed booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Confirming booking records..." />;
  }

  const property = booking?.propertyId || {};
  const unit = booking?.unitId || {};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 print:p-0 print:m-0">
      {/* 1. Animated Success Checkmark Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50 animate-bounce">
          <FiCheck className="w-10 h-10 stroke-[3]" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Booking Confirmed!
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Thank you for your reservation
        </h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          A confirmation voucher and receipt have been dispatched to your email address.
        </p>
      </div>

      {/* 2. Booking Voucher / Details Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider block">
              Reservation Reference
            </span>
            <span className="text-lg font-mono font-bold tracking-wider">
              #{bookingId?.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-white text-xs font-semibold uppercase tracking-wider">
            {booking?.status || 'Confirmed'}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Property Info */}
          <div className="pb-6 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {property.type || 'Stay'}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
              {property.title || 'Property Reservation'}
            </h2>
            <p className="text-xs text-gray-500 flex items-center space-x-1.5 mt-1">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>
                {property.location?.address ? `${property.location.address}, ` : ''}
                {property.location?.city}, {property.location?.state || property.location?.country}
              </span>
            </p>
            {unit.name && (
              <p className="text-xs font-semibold text-gray-700 mt-2">
                Room Type: <span className="text-emerald-700">{unit.name}</span>
              </p>
            )}
          </div>

          {/* Dates & Guests Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] font-medium">Check-in</span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {booking?.checkIn ? format(new Date(booking.checkIn), 'EEE, MMM dd, yyyy') : 'N/A'}
              </span>
              <span className="text-gray-400 text-[10px]">From 2:00 PM</span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] font-medium">Check-out</span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {booking?.checkOut ? format(new Date(booking.checkOut), 'EEE, MMM dd, yyyy') : 'N/A'}
              </span>
              <span className="text-gray-400 text-[10px]">Until 11:00 AM</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[11px] font-medium">Guests</span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {booking?.guests || 1} Guests
              </span>
              <span className="text-gray-400 text-[10px]">
                {booking?.nights || 1} {(booking?.nights || 1) === 1 ? 'Night' : 'Nights'}
              </span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-semibold block">Payment Status</span>
              <span className="text-xs text-gray-500">
                Transaction ID: {booking?.razorpayPaymentId || 'Verified Online'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Total Paid</span>
              <span className="text-2xl font-extrabold text-emerald-700">
                ₹{Number(booking?.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all shadow-xs"
          >
            <FiPrinter className="w-4 h-4 text-emerald-600" />
            <span>Download Voucher / Receipt</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link
              to="/bookings"
              className="w-full sm:w-auto text-center inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold text-sm transition-colors"
            >
              <FiCalendar className="w-4 h-4" />
              <span>View All Bookings</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto text-center inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <FiHome className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
