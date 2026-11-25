import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { confirmBooking } from '../store/slices/bookingSlice';
import api from '../services/api';
import BookingTimer from '../components/booking/BookingTimer';
import PriceBreakdown from '../components/booking/PriceBreakdown';
import CancellationPolicy from '../components/booking/CancellationPolicy';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import {
  FiLock,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [holdExpiredModalOpen, setHoldExpiredModalOpen] = useState(false);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch current booking hold details
  const fetchBookingHold = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/bookings/${bookingId}`);
      const bookingData = data.booking || data;
      setBooking(bookingData);

      // Check if already expired
      if (bookingData.holdExpiresAt) {
        const expiry = new Date(bookingData.holdExpiresAt).getTime();
        if (expiry <= Date.now()) {
          setHoldExpiredModalOpen(true);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load booking';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingHold();
    }
  }, [bookingId, fetchBookingHold]);

  const handleHoldExpire = () => {
    setHoldExpiredModalOpen(true);
  };

  const handleExpiredModalClose = () => {
    setHoldExpiredModalOpen(false);
    const propId = booking?.propertyId?._id || booking?.propertyId;
    if (propId) {
      navigate(`/property/${propId}`);
    } else {
      navigate('/search');
    }
  };

  // Payment Execution Handler
  const handlePayment = async () => {
    if (!booking) return;

    try {
      setIsProcessingPayment(true);

      // 1. Create or fetch Razorpay Order ID from backend
      let orderId = booking.razorpayOrderId;
      let razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

      try {
        const orderRes = await api.post(`/payments/create-order`, {
          bookingId: booking._id,
        });
        if (orderRes.data?.orderId) {
          orderId = orderRes.data.orderId;
        }
        if (orderRes.data?.keyId) {
          razorpayKey = orderRes.data.keyId;
        }
      } catch (orderErr) {
        // Dev fallback if payments endpoint is in mock mode
        console.warn('Backend order generation using fallback/mock order:', orderErr.message);
      }

      // 2. Open Razorpay Checkout modal if Razorpay is loaded in window
      if (window.Razorpay && razorpayKey !== 'rzp_test_placeholder') {
        const options = {
          key: razorpayKey,
          amount: Math.round(booking.totalAmount * 100), // in paise
          currency: 'INR',
          name: 'StaySpot Bookings',
          description: `Booking for ${booking.propertyId?.title || 'Luxury Stay'}`,
          order_id: orderId || undefined,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#059669',
          },
          handler: async (response) => {
            await handleConfirmPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || orderId,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
              toast('Payment cancelled.', { icon: 'ℹ️' });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated Direct Payment for environments where live Razorpay key is not configured
        toast.loading('Processing test payment transaction...', { duration: 1500 });
        setTimeout(async () => {
          await handleConfirmPayment({
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpayOrderId: orderId || `order_mock_${Date.now()}`,
            razorpaySignature: 'sig_mock_verified',
          });
        }, 1500);
      }
    } catch (err) {
      setIsProcessingPayment(false);
      const msg = err.response?.data?.message || err.message || 'Payment initiation failed';
      toast.error(msg);
    }
  };

  const handleConfirmPayment = async (paymentDetails) => {
    try {
      const result = await dispatch(
        confirmBooking({
          bookingId: booking._id,
          paymentDetails,
        })
      );

      if (confirmBooking.fulfilled.match(result)) {
        toast.success('Payment successful! Booking confirmed.');
        navigate(`/booking-confirmation/${booking._id}`);
      } else {
        const msg = result.payload || 'Payment verification failed';
        toast.error(msg);
        setIsProcessingPayment(false);
      }
    } catch (err) {
      toast.error(err.message || 'Error confirming booking');
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Preparing secure checkout..." />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <FiAlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
        <p className="text-sm text-gray-600 mb-6">{error || 'This reservation hold has expired or is invalid.'}</p>
        <button
          onClick={() => navigate('/search')}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
        >
          Explore Properties
        </button>
      </div>
    );
  }

  const property = booking.propertyId || {};
  const unit = booking.unitId || {};
  const propertyImage =
    property.images?.[0]?.url ||
    (typeof property.images?.[0] === 'string' ? property.images[0] : null) ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner with Booking Timer */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
            Step 3 of 3: Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Confirm and Pay
          </h1>
        </div>

        {/* Countdown Timer */}
        {booking.holdExpiresAt && (
          <BookingTimer
            expiresAt={booking.holdExpiresAt}
            onExpire={handleHoldExpire}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Summary, Policy, Payment Trigger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reservation Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Reservation Details</h2>

            {/* Property Item Summary */}
            <div className="flex items-start space-x-4 pb-6 border-b border-gray-100">
              <img
                src={propertyImage}
                alt={property.title || 'Property'}
                className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
              />
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {property.type || 'Hotel'}
                </span>
                <h3 className="font-bold text-gray-900 text-base leading-snug">
                  {property.title || 'Luxury Accommodation'}
                </h3>
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <FiMapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {property.location?.city ? `${property.location.city}, ` : ''}
                    {property.location?.state || property.location?.country || 'India'}
                  </span>
                </p>
                {unit.name && (
                  <p className="text-xs font-semibold text-gray-700 pt-1">
                    Room Unit: <span className="text-emerald-700">{unit.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dates & Guests Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium">
                  <FiCalendar className="w-4 h-4 text-emerald-600" />
                  <span>Check-in</span>
                </div>
                <p className="font-bold text-gray-900 text-base">
                  {booking.checkIn ? format(new Date(booking.checkIn), 'EEE, MMM dd, yyyy') : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">After 2:00 PM</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium">
                  <FiCalendar className="w-4 h-4 text-emerald-600" />
                  <span>Check-out</span>
                </div>
                <p className="font-bold text-gray-900 text-base">
                  {booking.checkOut ? format(new Date(booking.checkOut), 'EEE, MMM dd, yyyy') : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">Before 11:00 AM</p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FiUsers className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} Total
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">Cancellation Policy</h3>
            <CancellationPolicy
              policyType={property.policies?.cancellation || 'moderate'}
              checkIn={booking.checkIn}
              totalAmount={booking.totalAmount}
            />
          </div>

          {/* Secure Payment Trigger */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiLock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">Payment Method</h3>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Powered by Razorpay
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Accepting UPI, Credit/Debit Cards, NetBanking, and Wallets. All transactions are encrypted with 256-bit bank-grade security.
            </p>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isProcessingPayment ? (
                <LoadingSpinner size="sm" text="Securing payment..." />
              ) : (
                <>
                  <FiLock className="w-4 h-4" />
                  <span>Pay ₹{Number(booking.totalAmount).toLocaleString('en-IN')} with Razorpay</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400 pt-1">
              <FiShield className="w-3.5 h-3.5 text-emerald-500" />
              <span>PCI-DSS Compliant & SSL Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Right Column: Price Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <PriceBreakdown
            breakdown={booking.priceBreakdown || []}
            totalAmount={booking.totalAmount}
          />
        </div>
      </div>

      {/* Hold Expired Modal */}
      <Modal
        isOpen={holdExpiredModalOpen}
        onClose={handleExpiredModalClose}
        title="Reservation Hold Expired"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your 15-minute temporary hold on this property unit has expired and the room has been released for other travelers.
          </p>
          <button
            type="button"
            onClick={handleExpiredModalClose}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Select Dates Again
          </button>
        </div>
      </Modal>
    </div>
  );
}
