import { transporter } from '../config/email.js';

/**
 * @module emailService
 * Email notification service for booking confirmations, cancellations,
 * and hold expiry reminders.
 */

const APP_NAME = 'StaySpot';
const FROM_EMAIL = process.env.EMAIL_FROM || 'StaySpot <noreply@stayspot.com>';

/**
 * Generate responsive email HTML wrapper
 * @param {string} title - Email title
 * @param {string} bodyContent - HTML body content
 * @returns {string} Complete HTML email
 */
const emailTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px 24px; color: #333333; line-height: 1.7; }
    .booking-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
    .row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #6b7280; font-size: 14px; }
    .value { color: #111827; font-weight: 500; font-size: 14px; }
    .amount { font-size: 18px; font-weight: 700; color: #059669; }
    .footer { text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
      <p>${title}</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send email helper with graceful fallback in development.
 */
const sendMailSafe = async ({ to, subject, html }) => {
  if (!to) return;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`[Email] Message sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.warn(`[Email] Failed to send email to ${to}: ${error.message}`);
    return null;
  }
};

/**
 * Send booking confirmation email with details
 */
export const sendBookingConfirmation = async (booking, user, property, unit) => {
  const recipientEmail = user?.email;
  if (!recipientEmail) return;

  const checkInStr = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const checkOutStr = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const body = `
    <h2>Booking Confirmed! 🎉</h2>
    <p>Hi ${user.name || 'Valued Guest'},</p>
    <p>Your reservation at <strong>${property?.title || 'our property'}</strong> has been confirmed. Below are your booking details:</p>
    
    <div class="booking-card">
      <div class="row"><span class="label">Booking ID:</span><span class="value">${booking._id}</span></div>
      <div class="row"><span class="label">Property:</span><span class="value">${property?.title || 'StayBook Property'}</span></div>
      <div class="row"><span class="label">Room / Unit:</span><span class="value">${unit?.name || 'Standard'}</span></div>
      <div class="row"><span class="label">Check-In:</span><span class="value">${checkInStr}</span></div>
      <div class="row"><span class="label">Check-Out:</span><span class="value">${checkOutStr}</span></div>
      <div class="row"><span class="label">Guests:</span><span class="value">${booking.guests}</span></div>
      <div class="row"><span class="label">Nights:</span><span class="value">${booking.nights}</span></div>
      <div class="row"><span class="label">Total Paid:</span><span class="value amount">₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</span></div>
    </div>
    
    <p>We look forward to hosting you. Have a pleasant stay!</p>
  `;

  await sendMailSafe({
    to: recipientEmail,
    subject: `Reservation Confirmed - ${property?.title || APP_NAME} [${booking._id}]`,
    html: emailTemplate('Reservation Confirmed', body),
  });
};

/**
 * Send cancellation confirmation email
 */
export const sendBookingCancellation = async (booking, user, property, unit) => {
  const recipientEmail = user?.email;
  if (!recipientEmail) return;

  const refundText = booking.refundAmount > 0
    ? `A refund of <strong>₹${booking.refundAmount.toLocaleString('en-IN')}</strong> has been processed to your original payment method.`
    : `As per the property's cancellation policy, this reservation is non-refundable.`;

  const body = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${user.name || 'Guest'},</p>
    <p>Your reservation at <strong>${property?.title || 'our property'}</strong> for Booking ID <code>${booking._id}</code> has been cancelled.</p>
    
    <div class="booking-card">
      <div class="row"><span class="label">Status:</span><span class="value" style="color: #dc2626;">Cancelled</span></div>
      <div class="row"><span class="label">Refund Amount:</span><span class="value">₹${(booking.refundAmount || 0).toLocaleString('en-IN')}</span></div>
      ${booking.cancellationReason ? `<div class="row"><span class="label">Reason:</span><span class="value">${booking.cancellationReason}</span></div>` : ''}
    </div>
    
    <p>${refundText}</p>
    <p>If you have any questions or require assistance, please contact support.</p>
  `;

  await sendMailSafe({
    to: recipientEmail,
    subject: `Reservation Cancelled - ${property?.title || APP_NAME} [${booking._id}]`,
    html: emailTemplate('Reservation Cancelled', body),
  });
};

export default {
  sendBookingConfirmation,
  sendBookingCancellation,
};
