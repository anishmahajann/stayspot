import React from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineTravelExplore } from 'react-icons/md';
import { FiMail, FiPhone, FiMapPin, FiShield, FiHeart } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
                <MdOutlineTravelExplore className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">StaySpot</span>
                <span className="text-xs block text-emerald-400 font-medium">HOTELS & EVENTS</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Premium hotel booking and unforgettable event space reservations with real-time dynamic pricing, instant confirmation, and reliable host tools.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-gray-400">
              <span className="flex items-center space-x-1.5 text-xs">
                <FiShield className="w-4 h-4 text-emerald-400" />
                <span>Verified Stays</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs">
                <FiHeart className="w-4 h-4 text-rose-400" />
                <span>100% Secure Payments</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-emerald-400 transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/search?type=hotel" className="hover:text-emerald-400 transition-colors">
                  Boutique Hotels
                </Link>
              </li>
              <li>
                <Link to="/search?type=resort" className="hover:text-emerald-400 transition-colors">
                  Luxury Resorts
                </Link>
              </li>
              <li>
                <Link to="/search?type=event-venue" className="hover:text-emerald-400 transition-colors">
                  Grand Event Venues
                </Link>
              </li>
              <li>
                <Link to="/search?type=villa" className="hover:text-emerald-400 transition-colors">
                  Private Villas
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hosting</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/owner/dashboard" className="hover:text-emerald-400 transition-colors">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link to="/register?role=owner&redirect=/owner/dashboard" className="hover:text-emerald-400 transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/owner/reports" className="hover:text-emerald-400 transition-colors">
                  Analytics & Reports
                </Link>
              </li>
              <li>
                <span className="text-gray-500">Host Protection Guarantee</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2.5">
                <FiMail className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>support@stayspot.com</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <FiPhone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>+91 1800 233 4567</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <FiMapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} StaySpot Technologies, Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Cancellation Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
