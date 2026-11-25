/**
 * @module voucherGenerator
 * Generates downloadable booking vouchers as styled HTML.
 * Can be rendered in browser and printed/saved as PDF.
 */

/**
 * Generate a booking voucher HTML string
 * @param {Object} booking - Booking details
 * @returns {string} HTML voucher content
 */
export const generateVoucherHTML = ({
  bookingId,
  guestName,
  guestEmail,
  propertyTitle,
  propertyAddress,
  propertyCity,
  unitName,
  checkIn,
  checkOut,
  guests,
  nights,
  totalAmount,
  status,
  razorpayPaymentId,
  createdAt,
}) => {
  const checkInStr = new Date(checkIn).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const checkOutStr = new Date(checkOut).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const bookedOnStr = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Voucher - ${bookingId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #f3f4f6;
      padding: 20px;
      color: #1f2937;
    }
    
    .voucher {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .voucher-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 32px;
      text-align: center;
      position: relative;
    }
    
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    
    .voucher-title {
      font-size: 16px;
      margin-top: 6px;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .status-badge {
      display: inline-block;
      margin-top: 14px;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .voucher-body {
      padding: 32px;
    }
    
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .info-card {
      background: #f9fafb;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
    }
    
    .info-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .info-val {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-top: 4px;
    }
    
    .highlight-val {
      color: #059669;
      font-size: 18px;
    }
    
    .footer-note {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px dashed #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .voucher { box-shadow: none; border: 1px solid #e5e7eb; }
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="voucher-header">
      <div class="brand-name">StaySpot</div>
      <div class="voucher-title">Official Reservation Voucher</div>
      <div class="status-badge">${status || 'Confirmed'}</div>
    </div>
    
    <div class="voucher-body">
      <div class="section-title">Booking Details</div>
      <div class="grid-2">
        <div class="info-card">
          <div class="info-label">Confirmation ID</div>
          <div class="info-val">${bookingId}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Booking Date</div>
          <div class="info-val">${bookedOnStr}</div>
        </div>
      </div>

      <div class="section-title">Property & Room</div>
      <div class="grid-2">
        <div class="info-card">
          <div class="info-label">Property</div>
          <div class="info-val">${propertyTitle || 'StaySpot Property'}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${propertyAddress || ''}, ${propertyCity || ''}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Reserved Unit</div>
          <div class="info-val">${unitName || 'Standard Room'}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${guests} Guests • ${nights} Nights</div>
        </div>
      </div>

      <div class="section-title">Stay Dates</div>
      <div class="grid-2">
        <div class="info-card">
          <div class="info-label">Check-In</div>
          <div class="info-val">${checkInStr}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Check-Out</div>
          <div class="info-val">${checkOutStr}</div>
        </div>
      </div>

      <div class="section-title">Guest & Payment Info</div>
      <div class="grid-2">
        <div class="info-card">
          <div class="info-label">Primary Guest</div>
          <div class="info-val">${guestName || 'Guest'}</div>
          <div style="font-size: 13px; color: #6b7280;">${guestEmail || ''}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Total Amount Paid</div>
          <div class="info-val highlight-val">₹${(totalAmount || 0).toLocaleString('en-IN')}</div>
          ${razorpayPaymentId ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Txn ID: ${razorpayPaymentId}</div>` : ''}
        </div>
      </div>

      <div class="footer-note">
        Thank you for choosing StaySpot. Please present a valid government-issued photo ID upon check-in.
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export default { generateVoucherHTML };
