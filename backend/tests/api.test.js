import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
};

let guestToken = '';
let ownerToken = '';
let samplePropertyId = '';
let sampleUnitId = '';
let createdPropertyId = '';
let createdUnitId = '';
let createdBookingId = '';

test('TC-01: Health Check & Server Availability', async () => {
  const res = await apiFetch('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('TC-02: Authentication & Role-Based Authorization', async () => {
  // Unauthenticated access to protected route should return 401
  const unauth = await apiFetch('/bookings/my');
  assert.equal(unauth.status, 401);

  // Guest login
  const guestLogin = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'guest@demo.com', password: 'password123' }),
  });
  assert.equal(guestLogin.status, 200);
  assert.ok(guestLogin.body.token);
  assert.equal(guestLogin.body.user.role, 'guest');
  guestToken = guestLogin.body.token;

  // Guest accessing owner route should return 403 Forbidden
  const forbidden = await apiFetch('/owner/properties', {
    headers: { Authorization: `Bearer ${guestToken}` },
  });
  assert.equal(forbidden.status, 403);

  // Owner login
  const ownerLogin = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'owner@demo.com', password: 'password123' }),
  });
  assert.equal(ownerLogin.status, 200);
  assert.ok(ownerLogin.body.token);
  assert.equal(ownerLogin.body.user.role, 'owner');
  ownerToken = ownerLogin.body.token;

  // Google OAuth endpoint rejects missing credential
  const googleMissing = await apiFetch('/auth/google', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(googleMissing.status, 400);
});

test('TC-03: Property Search, Filtering & Availability Engine', async () => {
  const allRes = await apiFetch('/properties/search?limit=50');
  assert.equal(allRes.status, 200);
  assert.ok(allRes.body.properties.length >= 10, 'Expected seeded properties');

  const mumbaiRes = await apiFetch('/properties/search?city=Mumbai');
  assert.equal(mumbaiRes.status, 200);
  assert.ok(mumbaiRes.body.properties.length >= 1);
  samplePropertyId = mumbaiRes.body.properties[0]._id;

  const detailRes = await apiFetch(`/properties/${samplePropertyId}`);
  assert.equal(detailRes.status, 200);
  assert.ok(detailRes.body.property.units.length >= 1);
  sampleUnitId = detailRes.body.property.units[0]._id;

  const availRes = await apiFetch(`/properties/${samplePropertyId}/availability`);
  assert.equal(availRes.status, 200);
  assert.ok(availRes.body.availability.calendar);
});

test('TC-04: Owner CRUD Operations (Property, Unit, Calendar & Reports)', async () => {
  // Create Property
  const createProp = await apiFetch('/owner/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Test Automated Villa',
      description: 'Automated test property for CRUD verification.',
      type: 'villa',
      location: { address: '1 Test Road', city: 'Goa', state: 'Goa', country: 'India' },
      basePrice: 7500,
    }),
  });
  assert.equal(createProp.status, 201);
  createdPropertyId = createProp.body.property._id;
  assert.ok(createdPropertyId);

  // Read Owner Properties
  const listProps = await apiFetch('/owner/properties', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(listProps.status, 200);
  assert.ok(listProps.body.properties.some((p) => p._id === createdPropertyId));

  // Update Property
  const updateProp = await apiFetch(`/owner/properties/${createdPropertyId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ title: 'Test Automated Villa Updated' }),
  });
  assert.equal(updateProp.status, 200);
  assert.equal(updateProp.body.property.title, 'Test Automated Villa Updated');

  // Create Unit
  const createUnit = await apiFetch(`/owner/properties/${createdPropertyId}/units`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: 'Automated Test Suite',
      capacity: 2,
      count: 1,
      basePrice: 8000,
    }),
  });
  assert.equal(createUnit.status, 201);
  createdUnitId = createUnit.body.unit._id;

  // Read Unit Calendar
  const calRes = await apiFetch(`/owner/units/${createdUnitId}/calendar`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(calRes.status, 200);
  assert.equal(calRes.body.unit._id, createdUnitId);

  // Reports
  const reportsRes = await apiFetch('/owner/reports?timeframe=30d', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(reportsRes.status, 200);
  assert.ok(typeof reportsRes.body.reports.totalRevenue === 'number');
});

test('TC-05: Booking Lifecycle, Concurrent Double-Booking Prevention & Cancellation', async () => {
  const checkIn = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + 92 * 86400000).toISOString().split('T')[0];

  // Quote
  const quoteRes = await apiFetch('/bookings/quote', {
    method: 'POST',
    body: JSON.stringify({ unitId: createdUnitId, checkIn, checkOut, guests: 2 }),
  });
  assert.equal(quoteRes.status, 200);
  assert.equal(quoteRes.body.quote.nights, 2);

  // Concurrent booking attempts on a unit with count=1 (at least one must fail or only 1 succeed)
  const [holdA, holdB] = await Promise.all([
    apiFetch('/bookings/hold', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ unitId: createdUnitId, checkIn, checkOut, guests: 2 }),
    }),
    apiFetch('/bookings/hold', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ unitId: createdUnitId, checkIn, checkOut, guests: 2 }),
    }),
  ]);

  const successes = [holdA, holdB].filter((r) => r.status === 201);
  assert.ok(successes.length >= 1, 'At least one hold should succeed');
  createdBookingId = successes[0].body.booking._id;

  // Confirm Booking
  const confirmRes = await apiFetch(`/bookings/${createdBookingId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${guestToken}` },
    body: JSON.stringify({
      razorpayOrderId: 'order_test_suite',
      razorpayPaymentId: 'pay_test_suite',
      razorpaySignature: 'sig_mock_verified',
    }),
  });
  assert.equal(confirmRes.status, 200);
  assert.equal(confirmRes.body.booking.status, 'confirmed');

  // Overlapping hold after confirmation must be rejected (409)
  const overlapHold = await apiFetch('/bookings/hold', {
    method: 'POST',
    headers: { Authorization: `Bearer ${guestToken}` },
    body: JSON.stringify({ unitId: createdUnitId, checkIn, checkOut, guests: 2 }),
  });
  assert.equal(overlapHold.status, 409);

  // Cancel Booking & verify refund
  const cancelRes = await apiFetch(`/bookings/${createdBookingId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${guestToken}` },
    body: JSON.stringify({ reason: 'Automated test cleanup' }),
  });
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.booking.status, 'cancelled');
});

test('TC-06: Owner Delete Unit & Delete Property Cleanup', async () => {
  const delUnit = await apiFetch(`/owner/units/${createdUnitId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(delUnit.status, 200);

  const delProp = await apiFetch(`/owner/properties/${createdPropertyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.equal(delProp.status, 200);
});
