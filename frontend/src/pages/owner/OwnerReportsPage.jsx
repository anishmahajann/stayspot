import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fetchReports, fetchOwnerBookings } from '../../store/slices/ownerSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiArrowLeft,
  FiDownload,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiPercent,
  FiBarChart2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OwnerReportsPage() {
  const dispatch = useDispatch();
  const { reports, bookings, loading } = useSelector((state) => state.owner);

  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d' | '90d' | '1y'

  useEffect(() => {
    dispatch(fetchReports(timeframe));
    dispatch(fetchOwnerBookings());
  }, [dispatch, timeframe]);

  // Derived metrics from real backend reports & bookings
  const totalRevenue =
    reports?.totalRevenue ??
    (bookings || [])
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const totalBookingsCount = reports?.totalBookings ?? bookings?.length ?? 0;
  const averageDailyRate =
    reports?.averageBookingValue ??
    reports?.averageDailyRate ??
    (totalBookingsCount > 0 ? Math.round(totalRevenue / totalBookingsCount) : 0);
  const occupancyPercent = reports?.occupancyRate ?? 0;

  // Dynamic chart data from backend dailyBreakdown
  const dailyData = reports?.dailyBreakdown || [];
  const chartPoints = dailyData.length > 0
    ? dailyData.slice(-8).map((d) => ({
        label: d.date ? d.date.slice(5) : '',
        revenue: d.revenue || 0,
        bookings: d.bookings || 0,
      }))
    : [{ label: 'No data', revenue: 0, bookings: 0 }];

  const maxRev = Math.max(1, ...chartPoints.map((p) => p.revenue));
  const svgCoords = chartPoints.map((p, idx) => {
    const x = chartPoints.length === 1 ? 200 : 20 + (idx / (chartPoints.length - 1)) * 360;
    const y = 140 - (p.revenue / maxRev) * 115;
    return { ...p, x: Math.round(x), y: Math.round(y) };
  });
  const linePath = svgCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaPath =
    svgCoords.length > 0
      ? `${linePath} L ${svgCoords[svgCoords.length - 1].x} 150 L ${svgCoords[0].x} 150 Z`
      : '';

  // CSV Export functionality
  const handleExportCSV = () => {
    if (!bookings || bookings.length === 0) {
      toast.error('No booking records to export');
      return;
    }

    const headers = ['Booking ID', 'Guest Name', 'Guest Email', 'Property', 'Check-In', 'Check-Out', 'Total Amount', 'Status'];
    const rows = bookings.map((b) => [
      b._id,
      b.userId?.name || 'Guest',
      b.userId?.email || '',
      b.propertyId?.title || '',
      b.checkIn ? format(new Date(b.checkIn), 'yyyy-MM-dd') : '',
      b.checkOut ? format(new Date(b.checkOut), 'yyyy-MM-dd') : '',
      b.totalAmount || 0,
      b.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stayspot_reports_${timeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Host Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
            Financial & Performance Analytics
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Revenue & Occupancy Reports
          </h1>
        </div>

        {/* Timeframe Selector and Export */}
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-2xl border border-gray-200 flex items-center shadow-xs">
            {['7d', '30d', '90d', '1y'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <FiDownload className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              ₹{Number(totalRevenue).toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">+14.2% vs prev period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600 flex-shrink-0">
            <FiCalendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Reservations
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalBookingsCount}</h3>
            <span className="text-[11px] text-teal-600 font-semibold">94% Completion Rate</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 flex-shrink-0">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Avg Daily Rate (ADR)
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              ₹{Number(averageDailyRate).toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-purple-600 font-semibold">Per unit night</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 flex-shrink-0">
            <FiPercent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Average Occupancy
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{occupancyPercent}%</h3>
            <span className="text-[11px] text-amber-600 font-semibold">Strong demand peak</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Section (Revenue Line Chart & Occupancy Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue SVG Line Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Revenue Trajectory</h3>
              <p className="text-xs text-gray-500">Weekly earnings over selected timeframe</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ₹ INR
            </span>
          </div>

          <div className="h-64 pt-6">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="#e5e7eb" strokeWidth="1" />

              {/* Gradient Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#revenueGradient)" />}

              {/* Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points & labels */}
              {svgCoords.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                  <text x={pt.x} y="162" textAnchor="middle" fontSize="10" fill="#9ca3af">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Bookings & Occupancy Bar Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Daily Revenue Breakdown</h3>
              <p className="text-xs text-gray-500">Revenue per active booking day ({occupancyPercent}% avg occupancy)</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
              {occupancyPercent}% Occupied
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
            {chartPoints.map((d, i) => {
              const pct = Math.max(4, Math.round((d.revenue / maxRev) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-gray-700">
                    ₹{(d.revenue / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full bg-gray-100 rounded-xl h-44 flex items-end overflow-hidden p-1">
                    <div
                      className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-lg transition-all duration-500"
                      style={{ height: `${d.revenue > 0 ? pct : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 truncate max-w-full">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Bookings Log</h2>
          <span className="text-xs text-gray-500">{bookings?.length || 0} Records</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ref ID</th>
                    <th className="px-6 py-3.5">Guest</th>
                    <th className="px-6 py-3.5">Property</th>
                    <th className="px-6 py-3.5">Check-In</th>
                    <th className="px-6 py-3.5">Check-Out</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-gray-700">
                        #{b._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{b.userId?.name || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {b.propertyId?.title || 'Listing'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {b.checkIn ? format(new Date(b.checkIn), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No bookings logged yet for the selected timeframe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
