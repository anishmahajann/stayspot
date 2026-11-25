import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import PropertyCard from '../components/search/PropertyCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import {
  FiSearch,
  FiCalendar,
  FiSmile,
  FiShield,
  FiAward,
  FiHeadphones,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  MdHotel,
  MdPool,
  MdVilla,
  MdEventSeat,
} from 'react-icons/md';

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback featured data in case the backend DB has no seeded properties yet
  const fallbackFeatured = [
    {
      _id: 'sample-prop-1',
      title: 'Grand Palace Heritage Hotel & Suites',
      type: 'hotel',
      location: { city: 'Udaipur', state: 'Rajasthan', country: 'India' },
      rating: 4.9,
      reviewCount: 142,
      minPrice: 8500,
      amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'AC', 'Breakfast'],
      images: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      _id: 'sample-prop-2',
      title: 'Azure Bayfront Luxury Resort & Spa',
      type: 'resort',
      location: { city: 'Goa', state: 'Goa', country: 'India' },
      rating: 4.8,
      reviewCount: 98,
      minPrice: 12000,
      amenities: ['WiFi', 'Pool', 'Bar', 'Restaurant', 'Gym', 'Parking'],
      images: [
        { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      _id: 'sample-prop-3',
      title: 'The Imperial Ballroom & Event Convention',
      type: 'event-venue',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      rating: 4.95,
      reviewCount: 76,
      minPrice: 45000,
      amenities: ['WiFi', 'Parking', 'AC', 'Conference Hall', 'Dining', 'Security'],
      images: [
        { url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      _id: 'sample-prop-4',
      title: 'Pine Valley Glass Villa & Retreat',
      type: 'villa',
      location: { city: 'Manali', state: 'Himachal Pradesh', country: 'India' },
      rating: 4.85,
      reviewCount: 64,
      minPrice: 9800,
      amenities: ['WiFi', 'Kitchen', 'Pet Friendly', 'AC', 'Parking'],
      images: [
        { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/properties', { params: { limit: 4 } });
        if (isMounted) {
          const list = data.properties || data.data || (Array.isArray(data) ? data : []);
          setFeaturedProperties(list.length > 0 ? list : fallbackFeatured);
        }
      } catch (err) {
        if (isMounted) {
          setFeaturedProperties(fallbackFeatured);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 text-white px-4 sm:px-6 lg:px-8">
        {/* Background decorative elements (clipped separately so SearchBar popovers can overflow) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto w-full text-center py-16 sm:py-24 z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md">
            <FiAward className="w-4 h-4 text-emerald-400" />
            <span>Discover Handcrafted Stays & Luxury Venues</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Find Your Next <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Extraordinary Stay
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/80 mb-10 leading-relaxed">
            Reserve boutique hotels, private villas, and majestic event halls with transparent pricing, zero hidden fees, and instant confirmation.
          </p>

          {/* SearchBar Overlay */}
          <div className="max-w-4xl mx-auto text-left">
            <SearchBar />
          </div>

          {/* Popular Categories Shortcut */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-emerald-200">
            <span className="font-semibold text-emerald-300/80">Browse by type:</span>
            <Link
              to="/search?type=hotel"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-1.5 border border-white/10"
            >
              <MdHotel className="w-4 h-4 text-emerald-300" />
              <span>Hotels</span>
            </Link>
            <Link
              to="/search?type=resort"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-1.5 border border-white/10"
            >
              <MdPool className="w-4 h-4 text-teal-300" />
              <span>Resorts</span>
            </Link>
            <Link
              to="/search?type=villa"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-1.5 border border-white/10"
            >
              <MdVilla className="w-4 h-4 text-amber-300" />
              <span>Villas</span>
            </Link>
            <Link
              to="/search?type=event-venue"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-1.5 border border-white/10"
            >
              <MdEventSeat className="w-4 h-4 text-rose-300" />
              <span>Event Halls</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-emerald-700/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-500/40">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">1,200+</p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">Curated Properties</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">85,000+</p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">Delighted Guests</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">40+</p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">Indian Cities</p>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">4.9/5</p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">Average Guest Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Top Picks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Featured Stays & Venues
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline mt-2 sm:mt-0"
          >
            <span>Explore all properties</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading featured properties..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS (3 Steps: Search, Book, Stay) */}
      <section className="bg-gray-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Simple Experience
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">How StaySpot Works</h2>
            <p className="text-sm text-gray-600 mt-2">
              Book the perfect venue or room in just 3 straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Search */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-inner">
                <FiSearch className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Step 01
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">Search & Compare</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Filter by verified city, real-time availability, price range, and amenities to find the ideal property.
              </p>
            </div>

            {/* Step 2: Book */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-inner">
                <FiCalendar className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                Step 02
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">Hold & Pay Safely</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Lock your room with a 15-minute temporary hold. Complete safe checkout powered by Razorpay.
              </p>
            </div>

            {/* Step 3: Stay */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-inner">
                <FiSmile className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Step 03
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">Enjoy Your Stay</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get instant booking vouchers and QR codes. Experience seamless check-in and 24/7 concierge assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST & VALUE PROPOSITION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Verified Listings</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Every property and host is rigorously vetted to ensure pristine cleanliness and top-tier amenities.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Flexible Cancellation</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Plans change. Enjoy clear, transparent cancellation policies with automated refunds back to your bank.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <FiHeadphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">24/7 Host & Guest Support</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Dedicated support specialists ready around the clock to assist with dates, logistics, and queries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
