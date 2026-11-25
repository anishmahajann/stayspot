import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './store/slices/authSlice';

// Layout & Route Guards
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import OwnerRoute from './components/common/OwnerRoute';

// Guest & Public Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Owner Portal Pages
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerPropertyPage from './pages/owner/OwnerPropertyPage';
import OwnerCalendarPage from './pages/owner/OwnerCalendarPage';
import OwnerReportsPage from './pages/owner/OwnerReportsPage';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // If a JWT token exists in storage, load current user session
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Booking Confirmation Route */}
        <Route
          path="/booking-confirmation/:bookingId"
          element={<BookingConfirmationPage />}
        />

        {/* Protected Guest Routes */}
        <Route
          path="/checkout/:bookingId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        {/* Owner Only Routes */}
        <Route
          path="/owner/dashboard"
          element={
            <OwnerRoute>
              <OwnerDashboardPage />
            </OwnerRoute>
          }
        />
        <Route
          path="/owner/properties/:id"
          element={
            <OwnerRoute>
              <OwnerPropertyPage />
            </OwnerRoute>
          }
        />
        <Route
          path="/owner/calendar/:unitId"
          element={
            <OwnerRoute>
              <OwnerCalendarPage />
            </OwnerRoute>
          }
        />
        <Route
          path="/owner/reports"
          element={
            <OwnerRoute>
              <OwnerReportsPage />
            </OwnerRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
