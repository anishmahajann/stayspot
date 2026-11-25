import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import { connectDB } from './config/db.js';
import User from './models/User.js';
import Property from './models/Property.js';
import RoomUnit from './models/RoomUnit.js';
import Booking from './models/Booking.js';
import PricingRule from './models/PricingRule.js';
import BlockedDate from './models/BlockedDate.js';
import Review from './models/Review.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayspot';

const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      RoomUnit.deleteMany({}),
      Booking.deleteMany({}),
      PricingRule.deleteMany({}),
      BlockedDate.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('✅ Cleared all collections');

    // =================== USERS ===================
    console.log('👤 Creating users...');
    const plainPassword = 'password123';

    const users = await User.create([
      { name: 'Demo Owner', email: 'owner@demo.com', password: plainPassword, phone: '+91 9876543210', role: 'owner' },
      { name: 'Raj Patel', email: 'raj@demo.com', password: plainPassword, phone: '+91 9876543211', role: 'owner' },
      { name: 'Demo Guest', email: 'guest@demo.com', password: plainPassword, phone: '+91 9876543212', role: 'guest' },
      { name: 'Priya Sharma', email: 'priya@demo.com', password: plainPassword, phone: '+91 9876543213', role: 'guest' },
      { name: 'Amit Kumar', email: 'amit@demo.com', password: plainPassword, phone: '+91 9876543214', role: 'guest' },
      { name: 'Neha Verma', email: 'neha@demo.com', password: plainPassword, phone: '+91 9876543216', role: 'guest' },
      { name: 'Admin User', email: 'admin@demo.com', password: plainPassword, phone: '+91 9876543215', role: 'admin' },
    ]);

    const [owner1, owner2, guest1, guest2, guest3, guest4] = users;
    console.log(`✅ Created ${users.length} users`);

    // =================== PROPERTIES (16 across 10 cities & 5 types) ===================
    console.log('🏨 Creating properties...');

    const properties = await Property.create([
      // 0: Hotel - Mumbai
      {
        ownerId: owner1._id,
        title: 'The Grand Palace Hotel',
        description: 'Experience luxury at its finest in the heart of Mumbai. Overlooking Marine Drive with an infinity pool, fine dining, full-service spa, and executive conference suites.',
        type: 'hotel',
        location: {
          address: '123 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [72.8226, 18.9435] },
        },
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'AC', 'Room Service', 'Bar'],
        images: [
          { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', publicId: 'demo_1' },
          { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', publicId: 'demo_2' },
          { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', publicId: 'demo_3' },
          { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', publicId: 'demo_4' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'moderate', petsAllowed: false, smokingAllowed: false },
        rating: 4.5,
        reviewCount: 3,
        isActive: true,
      },
      // 1: Resort - Goa
      {
        ownerId: owner1._id,
        title: 'Sunset Beach Resort',
        description: 'A tropical paradise on the shores of Calangute, Goa. Wake up to ocean breezes, private beach access, water sports, and authentic Goan coastal dining.',
        type: 'resort',
        location: {
          address: '45 Calangute Beach Road',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [73.7554, 15.5449] },
        },
        amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant', 'Spa', 'Parking', 'AC', 'Bar'],
        images: [
          { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', publicId: 'demo_5' },
          { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', publicId: 'demo_6' },
          { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800', publicId: 'demo_7' },
        ],
        policies: { checkInTime: '15:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: true, smokingAllowed: false },
        rating: 4.7,
        reviewCount: 2,
        isActive: true,
      },
      // 2: Hotel - Jaipur
      {
        ownerId: owner2._id,
        title: 'Heritage Haveli Jaipur',
        description: 'Step back in time at this beautifully restored 18th-century haveli near Hawa Mahal, featuring traditional Rajasthani courtyards, rooftop dining, and curated heritage walks.',
        type: 'hotel',
        location: {
          address: '78 Amber Road, Near Hawa Mahal',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [75.8267, 26.9239] },
        },
        amenities: ['WiFi', 'Restaurant', 'Rooftop Dining', 'AC', 'Parking', 'Laundry', 'Room Service'],
        images: [
          { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', publicId: 'demo_8' },
          { url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', publicId: 'demo_9' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '10:00', cancellation: 'strict', petsAllowed: false, smokingAllowed: false },
        rating: 4.5,
        reviewCount: 2,
        isActive: true,
      },
      // 3: Villa - Manali
      {
        ownerId: owner2._id,
        title: 'Mountain View Glass Villa',
        description: 'Escape to the Himalayas in this private glass-fronted cedar villa overlooking snow-capped peaks in Manali. Includes bonfire deck, orchard garden, and chef kitchen.',
        type: 'villa',
        location: {
          address: '12 Old Manali Orchard Road',
          city: 'Manali',
          state: 'Himachal Pradesh',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [77.1892, 32.2432] },
        },
        amenities: ['WiFi', 'Garden', 'Bonfire', 'Mountain View', 'Parking', 'Kitchen', 'AC', 'BBQ'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', publicId: 'demo_10' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'demo_11' },
        ],
        policies: { checkInTime: '15:00', checkOutTime: '11:00', cancellation: 'moderate', petsAllowed: true, smokingAllowed: false },
        rating: 4.9,
        reviewCount: 1,
        isActive: true,
      },
      // 4: Apartment - Bengaluru
      {
        ownerId: owner1._id,
        title: 'Silicon Valley Suites',
        description: 'Modern serviced apartments in Whitefield, Bengaluru. Equipped with gigabit WiFi, ergonomic workspaces, fitness studio, and easy access to major tech parks.',
        type: 'apartment',
        location: {
          address: '456 Whitefield Main Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [77.7480, 12.9698] },
        },
        amenities: ['WiFi', 'Co-working Space', 'Gym', 'Parking', 'AC', 'Kitchen', 'Laundry', 'Security'],
        images: [
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', publicId: 'demo_12' },
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', publicId: 'demo_13' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: false, smokingAllowed: false },
        rating: 4.4,
        reviewCount: 1,
        isActive: true,
      },
      // 5: Event Venue - Mumbai
      {
        ownerId: owner1._id,
        title: 'The Imperial Ballroom & Convention',
        description: 'A premier event venue in Bandra Kurla Complex, Mumbai, designed for grand weddings, corporate summits, and gala dinners with pillarless halls and concert-grade AV.',
        type: 'event-venue',
        location: {
          address: '88 BKC Avenue, Bandra East',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [72.8691, 19.0653] },
        },
        amenities: ['WiFi', 'Parking', 'AC', 'Restaurant', 'Security', 'AV Equipment', 'Valet'],
        images: [
          { url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', publicId: 'demo_14' },
          { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', publicId: 'demo_15' },
        ],
        policies: { checkInTime: '09:00', checkOutTime: '23:00', cancellation: 'strict', petsAllowed: false, smokingAllowed: false },
        rating: 4.9,
        reviewCount: 1,
        isActive: true,
      },
      // 6: Hotel - Udaipur
      {
        ownerId: owner2._id,
        title: 'Royal Lakeview Palace Udaipur',
        description: 'Palatial lakeside hotel perched along Lake Pichola with marble jharokhas, sunset boat jetty, courtyard pool, and royal Mewari hospitality.',
        type: 'hotel',
        location: {
          address: '21 Lake Pichola Promenade',
          city: 'Udaipur',
          state: 'Rajasthan',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [73.6808, 24.5764] },
        },
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Room Service', 'Bar'],
        images: [
          { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', publicId: 'demo_16' },
          { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', publicId: 'demo_17' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'moderate', petsAllowed: false, smokingAllowed: false },
        rating: 4.8,
        reviewCount: 1,
        isActive: true,
      },
      // 7: Hotel - Delhi
      {
        ownerId: owner1._id,
        title: 'Connaught Heritage Suites',
        description: 'Boutique luxury hotel minutes from Connaught Place and India Gate. Combines colonial-era elegance with modern business lounges and artisanal dining.',
        type: 'hotel',
        location: {
          address: '14 Janpath Lane, Connaught Place',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [77.2197, 28.6289] },
        },
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking', 'AC', 'Room Service', 'Bar', 'Security'],
        images: [
          { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', publicId: 'demo_18' },
          { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', publicId: 'demo_19' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '12:00', cancellation: 'flexible', petsAllowed: false, smokingAllowed: false },
        rating: 4.6,
        reviewCount: 1,
        isActive: true,
      },
      // 8: Resort - Kochi
      {
        ownerId: owner2._id,
        title: 'Backwater Lagoon Resort',
        description: 'Serene waterfront resort nestled amid coconut palms on Vembanad Lake near Kochi. Features Ayurvedic spa therapies, houseboat cruises, and lagoon-view cottages.',
        type: 'resort',
        location: {
          address: '92 Marine Backwater Drive',
          city: 'Kochi',
          state: 'Kerala',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [76.2673, 9.9312] },
        },
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Garden', 'Room Service'],
        images: [
          { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', publicId: 'demo_20' },
          { url: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', publicId: 'demo_21' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: true, smokingAllowed: false },
        rating: 4.8,
        reviewCount: 1,
        isActive: true,
      },
      // 9: Resort - Chennai
      {
        ownerId: owner1._id,
        title: 'Coromandel Bay Resort & Spa',
        description: 'Beachfront luxury along East Coast Road in Chennai. Offers private cabanas, seaside infinity pool, South Indian coastal cuisine, and wellness retreats.',
        type: 'resort',
        location: {
          address: '305 East Coast Road, Kovalam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [80.2496, 12.7905] },
        },
        amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Restaurant', 'Gym', 'Parking', 'AC'],
        images: [
          { url: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800', publicId: 'demo_22' },
          { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800', publicId: 'demo_23' },
        ],
        policies: { checkInTime: '15:00', checkOutTime: '11:00', cancellation: 'moderate', petsAllowed: false, smokingAllowed: false },
        rating: 4.5,
        reviewCount: 1,
        isActive: true,
      },
      // 10: Villa - Goa
      {
        ownerId: owner2._id,
        title: 'Azure Cliffside Pool Villa',
        description: 'Designer 4-bedroom Mediterranean villa in Vagator, Goa with private infinity pool, sunset terrace, dedicated caretaker, and fully equipped gourmet kitchen.',
        type: 'villa',
        location: {
          address: '18 Chapora Cliff Road, Vagator',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [73.7418, 15.5989] },
        },
        amenities: ['WiFi', 'Pool', 'Kitchen', 'Parking', 'AC', 'BBQ', 'Garden', 'Pet Friendly'],
        images: [
          { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', publicId: 'demo_24' },
          { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', publicId: 'demo_25' },
        ],
        policies: { checkInTime: '15:00', checkOutTime: '11:00', cancellation: 'moderate', petsAllowed: true, smokingAllowed: false },
        rating: 4.9,
        reviewCount: 1,
        isActive: true,
      },
      // 11: Villa - Hyderabad
      {
        ownerId: owner2._id,
        title: 'Jubilee Hills Courtyard Villa',
        description: 'Tranquil luxury villa in upscale Jubilee Hills, Hyderabad featuring lush central courtyard, private plunge pool, home theatre, and outdoor dining pavilion.',
        type: 'villa',
        location: {
          address: '54 Road No. 45, Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [78.4071, 17.4326] },
        },
        amenities: ['WiFi', 'Pool', 'Kitchen', 'Parking', 'AC', 'Garden', 'Security'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', publicId: 'demo_26' },
          { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', publicId: 'demo_27' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: true, smokingAllowed: false },
        rating: 4.7,
        reviewCount: 0,
        isActive: true,
      },
      // 12: Apartment - Mumbai
      {
        ownerId: owner1._id,
        title: 'Bandra Seafront Residences',
        description: 'Chic boutique serviced apartments off Carter Road in Bandra West, Mumbai. Ideal for extended stays, creative professionals, and families seeking coastal comfort.',
        type: 'apartment',
        location: {
          address: '72 Carter Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [72.8213, 19.0607] },
        },
        amenities: ['WiFi', 'Kitchen', 'AC', 'Parking', 'Laundry', 'Security', 'Gym'],
        images: [
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', publicId: 'demo_28' },
          { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'demo_29' },
        ],
        policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: false, smokingAllowed: false },
        rating: 4.6,
        reviewCount: 0,
        isActive: true,
      },
      // 13: Apartment - Hyderabad
      {
        ownerId: owner1._id,
        title: 'HITEC City Executive Lofts',
        description: 'Contemporary loft-style serviced apartments in Madhapur, Hyderabad. Walking distance to Mindspace IT Park with rooftop lounge and 24/7 concierge.',
        type: 'apartment',
        location: {
          address: '19 Mindspace Road, Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [78.3816, 17.4435] },
        },
        amenities: ['WiFi', 'Kitchen', 'AC', 'Gym', 'Parking', 'Co-working Space', 'Laundry'],
        images: [
          { url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', publicId: 'demo_30' },
          { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', publicId: 'demo_31' },
        ],
        policies: { checkInTime: '13:00', checkOutTime: '11:00', cancellation: 'flexible', petsAllowed: false, smokingAllowed: false },
        rating: 4.5,
        reviewCount: 0,
        isActive: true,
      },
      // 14: Event Venue - Udaipur
      {
        ownerId: owner2._id,
        title: 'Fateh Sagar Royal Lawns & Banquet',
        description: 'Majestic destination wedding and corporate gala venue overlooking Fateh Sagar Lake in Udaipur. Features manicured royal lawns, courtyard mandaps, and chandelier banquet halls.',
        type: 'event-venue',
        location: {
          address: '5 Fateh Sagar Promenade',
          city: 'Udaipur',
          state: 'Rajasthan',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [73.6736, 24.6009] },
        },
        amenities: ['WiFi', 'Parking', 'AC', 'Garden', 'Restaurant', 'Security', 'AV Equipment'],
        images: [
          { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', publicId: 'demo_32' },
          { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', publicId: 'demo_33' },
        ],
        policies: { checkInTime: '08:00', checkOutTime: '23:30', cancellation: 'strict', petsAllowed: false, smokingAllowed: false },
        rating: 4.9,
        reviewCount: 1,
        isActive: true,
      },
      // 15: Event Venue - Bengaluru
      {
        ownerId: owner1._id,
        title: 'Palace Grounds Grand Pavilion',
        description: 'Iconic convention center and open-air garden pavilion in central Bengaluru for tech conferences, product launches, exhibitions, and luxury receptions.',
        type: 'event-venue',
        location: {
          address: '101 Jayamahal Main Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          coordinates: { type: 'Point', coordinates: [77.5921, 13.0031] },
        },
        amenities: ['WiFi', 'Parking', 'AC', 'AV Equipment', 'Security', 'Valet', 'Restaurant'],
        images: [
          { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800', publicId: 'demo_34' },
          { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', publicId: 'demo_35' },
        ],
        policies: { checkInTime: '08:00', checkOutTime: '22:00', cancellation: 'moderate', petsAllowed: false, smokingAllowed: false },
        rating: 4.7,
        reviewCount: 0,
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${properties.length} properties`);

    // =================== ROOM UNITS ===================
    console.log('🛏️  Creating room units...');

    const roomUnits = await RoomUnit.create([
      // 0-2: Grand Palace Hotel - Mumbai
      { propertyId: properties[0]._id, name: 'Standard Room', description: 'Comfortable room with city view', capacity: 2, count: 10, basePrice: 3500, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'], isActive: true },
      { propertyId: properties[0]._id, name: 'Deluxe Sea View Room', description: 'Spacious room with Marine Drive balcony', capacity: 3, count: 8, basePrice: 5500, amenities: ['WiFi', 'AC', 'TV', 'Balcony', 'Sea View'], isActive: true },
      { propertyId: properties[0]._id, name: 'Presidential Suite', description: 'Luxury suite with living area and panoramic views', capacity: 4, count: 4, basePrice: 9500, amenities: ['WiFi', 'AC', 'Living Room', 'Sea View', 'Butler Service'], isActive: true },

      // 3-4: Sunset Beach Resort - Goa
      { propertyId: properties[1]._id, name: 'Beach Cottage', description: 'Cozy cottage steps from the beach', capacity: 2, count: 12, basePrice: 4000, amenities: ['WiFi', 'AC', 'Beach Access', 'Patio'], isActive: true },
      { propertyId: properties[1]._id, name: 'Pool Villa Suite', description: 'Private resort villa with plunge pool', capacity: 4, count: 6, basePrice: 8000, amenities: ['WiFi', 'AC', 'Private Pool', 'Garden'], isActive: true },

      // 5-6: Heritage Haveli - Jaipur
      { propertyId: properties[2]._id, name: 'Heritage Room', description: 'Traditional room with antique furnishings', capacity: 2, count: 8, basePrice: 2800, amenities: ['WiFi', 'AC', 'Heritage Decor'], isActive: true },
      { propertyId: properties[2]._id, name: 'Royal Suite', description: 'Grand suite with fort views and royal decor', capacity: 3, count: 3, basePrice: 6000, amenities: ['WiFi', 'AC', 'Fort View', 'Sitting Area'], isActive: true },

      // 7: Mountain View Glass Villa - Manali
      { propertyId: properties[3]._id, name: 'Entire Glass Villa', description: 'Complete 4-bedroom mountain villa with orchard & bonfire deck', capacity: 8, count: 1, basePrice: 12000, amenities: ['WiFi', 'Kitchen', 'Garden', 'Bonfire', 'Mountain View'], isActive: true },

      // 8-9: Silicon Valley Suites - Bengaluru
      { propertyId: properties[4]._id, name: 'Studio Apartment', description: 'Compact studio with kitchenette and work desk', capacity: 2, count: 15, basePrice: 2500, amenities: ['WiFi', 'AC', 'Kitchen', 'Work Desk'], isActive: true },
      { propertyId: properties[4]._id, name: '1 BHK Executive Apartment', description: 'Full apartment with separate bedroom & living area', capacity: 3, count: 10, basePrice: 3800, amenities: ['WiFi', 'AC', 'Kitchen', 'Work Desk', 'Washing Machine'], isActive: true },

      // 10-11: Imperial Ballroom & Convention - Mumbai
      { propertyId: properties[5]._id, name: 'Grand Ballroom', description: 'Pillarless banquet hall for up to 500 guests', capacity: 500, count: 2, basePrice: 45000, amenities: ['AC', 'AV Equipment', 'Stage', 'Catering Prep'], isActive: true },
      { propertyId: properties[5]._id, name: 'Executive Conference Hall', description: 'Modern conference hall with video conferencing', capacity: 100, count: 3, basePrice: 18000, amenities: ['WiFi', 'AC', 'Projector', 'Whiteboard'], isActive: true },

      // 12-13: Royal Lakeview Palace - Udaipur
      { propertyId: properties[6]._id, name: 'Lakeview Heritage Room', description: 'Ornate room overlooking Lake Pichola', capacity: 2, count: 10, basePrice: 6500, amenities: ['WiFi', 'AC', 'Lake View', 'Balcony'], isActive: true },
      { propertyId: properties[6]._id, name: 'Maharana Suite', description: 'Royal suite with private terrace & plunge tub', capacity: 4, count: 3, basePrice: 14500, amenities: ['WiFi', 'AC', 'Terrace', 'Lake View', 'Butler Service'], isActive: true },

      // 14-15: Connaught Heritage Suites - Delhi
      { propertyId: properties[7]._id, name: 'Classic King Room', description: 'Refined room in central New Delhi', capacity: 2, count: 14, basePrice: 4200, amenities: ['WiFi', 'AC', 'Work Desk', 'Coffee Maker'], isActive: true },
      { propertyId: properties[7]._id, name: 'Diplomat Suite', description: 'Two-room suite ideal for business executives', capacity: 3, count: 5, basePrice: 8200, amenities: ['WiFi', 'AC', 'Living Room', 'Airport Transfer'], isActive: true },

      // 16-17: Backwater Lagoon Resort - Kochi
      { propertyId: properties[8]._id, name: 'Lagoon View Cottage', description: 'Traditional Kerala cottage facing Vembanad Lake', capacity: 2, count: 10, basePrice: 5200, amenities: ['WiFi', 'AC', 'Lake View', 'Verandah'], isActive: true },
      { propertyId: properties[8]._id, name: 'Ayurvedic Pool Villa', description: 'Private villa with plunge pool and spa access', capacity: 4, count: 4, basePrice: 10500, amenities: ['WiFi', 'AC', 'Private Pool', 'Spa Credit'], isActive: true },

      // 18-19: Coromandel Bay Resort & Spa - Chennai
      { propertyId: properties[9]._id, name: 'Ocean Breeze Room', description: 'Bright coastal room with Bay of Bengal views', capacity: 2, count: 12, basePrice: 4600, amenities: ['WiFi', 'AC', 'Sea View', 'Balcony'], isActive: true },
      { propertyId: properties[9]._id, name: 'Beachfront Cabana Suite', description: 'Steps from the sand with private deck', capacity: 3, count: 5, basePrice: 8900, amenities: ['WiFi', 'AC', 'Beach Access', 'Private Deck'], isActive: true },

      // 20: Azure Cliffside Pool Villa - Goa
      { propertyId: properties[10]._id, name: 'Entire 4BHK Cliff Villa', description: 'Private infinity pool villa for groups up to 10', capacity: 10, count: 1, basePrice: 19500, amenities: ['WiFi', 'Private Pool', 'Kitchen', 'Caretaker'], isActive: true },

      // 21: Jubilee Hills Courtyard Villa - Hyderabad
      { propertyId: properties[11]._id, name: 'Entire Courtyard Villa', description: '3BHK private villa with plunge pool & courtyard', capacity: 6, count: 1, basePrice: 13500, amenities: ['WiFi', 'Pool', 'Kitchen', 'Home Theatre'], isActive: true },

      // 22-23: Bandra Seafront Residences - Mumbai
      { propertyId: properties[12]._id, name: '1 BHK Seafront Flat', description: 'Modern apartment with partial sea view', capacity: 3, count: 8, basePrice: 4800, amenities: ['WiFi', 'AC', 'Kitchen', 'Balcony'], isActive: true },
      { propertyId: properties[12]._id, name: '2 BHK Penthouse Loft', description: 'Spacious penthouse near Carter Road', capacity: 5, count: 3, basePrice: 8400, amenities: ['WiFi', 'AC', 'Kitchen', 'Terrace'], isActive: true },

      // 24-25: HITEC City Executive Lofts - Hyderabad
      { propertyId: properties[13]._id, name: 'Executive Studio Loft', description: 'Smart studio for solo & business travelers', capacity: 2, count: 16, basePrice: 2900, amenities: ['WiFi', 'AC', 'Kitchen', 'Work Desk'], isActive: true },
      { propertyId: properties[13]._id, name: '2 BHK Corporate Suite', description: 'Ideal for team stays and relocations', capacity: 4, count: 6, basePrice: 5400, amenities: ['WiFi', 'AC', 'Kitchen', 'Laundry'], isActive: true },

      // 26-27: Fateh Sagar Royal Lawns & Banquet - Udaipur
      { propertyId: properties[14]._id, name: 'Royal Lakeside Lawn', description: 'Open-air wedding & reception lawn for up to 600 guests', capacity: 600, count: 1, basePrice: 65000, amenities: ['Garden', 'Lake View', 'Lighting', 'Valet'], isActive: true },
      { propertyId: properties[14]._id, name: 'Darbar Banquet Hall', description: 'Chandelier indoor banquet hall for up to 250 guests', capacity: 250, count: 2, basePrice: 32000, amenities: ['AC', 'AV Equipment', 'Stage'], isActive: true },

      // 28-29: Palace Grounds Grand Pavilion - Bengaluru
      { propertyId: properties[15]._id, name: 'Main Convention Pavilion', description: 'Large expo & summit hall for up to 800 attendees', capacity: 800, count: 1, basePrice: 55000, amenities: ['AC', 'AV Equipment', 'High-Speed WiFi', 'Parking'], isActive: true },
      { propertyId: properties[15]._id, name: 'Garden Courtyard Terrace', description: 'Outdoor cocktail & launch venue for 200 guests', capacity: 200, count: 2, basePrice: 24000, amenities: ['WiFi', 'Garden', 'Lighting', 'Catering Prep'], isActive: true },
    ]);

    console.log(`✅ Created ${roomUnits.length} room units`);

    // =================== PRICING RULES ===================
    console.log('💰 Creating pricing rules...');
    const now = new Date();

    const pricingRules = await PricingRule.create([
      { unitId: roomUnits[0]._id, name: 'Weekend Surcharge', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 20, priority: 5, isActive: true },
      { unitId: roomUnits[1]._id, name: 'Weekend Surcharge', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 25, priority: 5, isActive: true },
      { unitId: roomUnits[3]._id, name: 'Peak Season (Winter)', type: 'seasonal', startDate: new Date(now.getFullYear(), 10, 1), endDate: new Date(now.getFullYear() + 1, 1, 28), percentageAdjustment: 35, priority: 10, isActive: true },
      { unitId: roomUnits[4]._id, name: 'Peak Season (Winter)', type: 'seasonal', startDate: new Date(now.getFullYear(), 10, 1), endDate: new Date(now.getFullYear() + 1, 1, 28), percentageAdjustment: 45, priority: 10, isActive: true },
      { unitId: roomUnits[0]._id, name: '10% off for 7+ nights', type: 'length-of-stay', minNights: 7, percentageAdjustment: -10, priority: 3, isActive: true },
      { unitId: roomUnits[8]._id, name: '15% off for 30+ nights', type: 'length-of-stay', minNights: 30, percentageAdjustment: -15, priority: 3, isActive: true },
      { unitId: roomUnits[8]._id, name: '5% off for 7+ nights', type: 'length-of-stay', minNights: 7, percentageAdjustment: -5, priority: 2, isActive: true },
      { unitId: roomUnits[5]._id, name: 'Weekend Rate', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 15, priority: 5, isActive: true },
      { unitId: roomUnits[12]._id, name: 'Festive Lakeview Premium', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 20, priority: 5, isActive: true },
      { unitId: roomUnits[14]._id, name: 'Weekly Business Stay Discount', type: 'length-of-stay', minNights: 5, percentageAdjustment: -10, priority: 3, isActive: true },
      { unitId: roomUnits[16]._id, name: 'Weekend Lagoon Escape', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 15, priority: 5, isActive: true },
      { unitId: roomUnits[20]._id, name: 'Weekend Villa Premium', type: 'weekend', daysOfWeek: [5, 6], percentageAdjustment: 25, priority: 6, isActive: true },
    ]);

    console.log(`✅ Created ${pricingRules.length} pricing rules`);

    // =================== SAMPLE BOOKINGS ===================
    console.log('📅 Creating sample bookings...');

    const futureDate = (daysFromNow) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + daysFromNow);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    };

    const bookings = await Booking.create([
      // 0: Upcoming (guest1 @ Grand Palace Mumbai)
      {
        unitId: roomUnits[0]._id, propertyId: properties[0]._id, userId: guest1._id,
        checkIn: futureDate(10), checkOut: futureDate(13), guests: 2, nights: 3,
        priceBreakdown: [{ date: futureDate(10), price: 3500 }, { date: futureDate(11), price: 3500 }, { date: futureDate(12), price: 4200 }],
        totalAmount: 11200, status: 'confirmed', razorpayOrderId: 'order_demo_001', razorpayPaymentId: 'pay_demo_001',
      },
      // 1: Past (guest2 @ Sunset Beach Resort Goa)
      {
        unitId: roomUnits[3]._id, propertyId: properties[1]._id, userId: guest2._id,
        checkIn: futureDate(-20), checkOut: futureDate(-17), guests: 2, nights: 3,
        priceBreakdown: [{ date: futureDate(-20), price: 4000 }, { date: futureDate(-19), price: 4000 }, { date: futureDate(-18), price: 4800 }],
        totalAmount: 12800, status: 'completed', razorpayOrderId: 'order_demo_002', razorpayPaymentId: 'pay_demo_002',
      },
      // 2: Cancelled (guest3 @ Heritage Haveli Jaipur)
      {
        unitId: roomUnits[5]._id, propertyId: properties[2]._id, userId: guest3._id,
        checkIn: futureDate(5), checkOut: futureDate(8), guests: 2, nights: 3,
        priceBreakdown: [{ date: futureDate(5), price: 2800 }, { date: futureDate(6), price: 3220 }, { date: futureDate(7), price: 3220 }],
        totalAmount: 9240, status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Change of plans', refundAmount: 0,
        razorpayOrderId: 'order_demo_003', razorpayPaymentId: 'pay_demo_003',
      },
      // 3: Upcoming (guest1 @ Mountain View Villa Manali)
      {
        unitId: roomUnits[7]._id, propertyId: properties[3]._id, userId: guest1._id,
        checkIn: futureDate(30), checkOut: futureDate(33), guests: 6, nights: 3,
        priceBreakdown: [{ date: futureDate(30), price: 12000 }, { date: futureDate(31), price: 12000 }, { date: futureDate(32), price: 12000 }],
        totalAmount: 36000, status: 'confirmed', razorpayOrderId: 'order_demo_004', razorpayPaymentId: 'pay_demo_004',
      },
      // 4: Past (guest2 @ Grand Palace Mumbai)
      {
        unitId: roomUnits[1]._id, propertyId: properties[0]._id, userId: guest2._id,
        checkIn: futureDate(-35), checkOut: futureDate(-32), guests: 2, nights: 3,
        priceBreakdown: [{ date: futureDate(-35), price: 5500 }, { date: futureDate(-34), price: 5500 }, { date: futureDate(-33), price: 5500 }],
        totalAmount: 16500, status: 'completed', razorpayOrderId: 'order_demo_005', razorpayPaymentId: 'pay_demo_005',
      },
      // 5: Past (guest3 @ Grand Palace Mumbai)
      {
        unitId: roomUnits[0]._id, propertyId: properties[0]._id, userId: guest3._id,
        checkIn: futureDate(-15), checkOut: futureDate(-13), guests: 2, nights: 2,
        priceBreakdown: [{ date: futureDate(-15), price: 3500 }, { date: futureDate(-14), price: 3500 }],
        totalAmount: 7000, status: 'completed', razorpayOrderId: 'order_demo_006', razorpayPaymentId: 'pay_demo_006',
      },
      // 6: Past (guest1 @ Sunset Beach Resort Goa)
      {
        unitId: roomUnits[4]._id, propertyId: properties[1]._id, userId: guest1._id,
        checkIn: futureDate(-28), checkOut: futureDate(-25), guests: 3, nights: 3,
        priceBreakdown: [{ date: futureDate(-28), price: 8000 }, { date: futureDate(-27), price: 8000 }, { date: futureDate(-26), price: 8000 }],
        totalAmount: 24000, status: 'completed', razorpayOrderId: 'order_demo_007', razorpayPaymentId: 'pay_demo_007',
      },
      // 7: Past (guest2 @ Heritage Haveli Jaipur)
      {
        unitId: roomUnits[6]._id, propertyId: properties[2]._id, userId: guest2._id,
        checkIn: futureDate(-12), checkOut: futureDate(-10), guests: 2, nights: 2,
        priceBreakdown: [{ date: futureDate(-12), price: 6000 }, { date: futureDate(-11), price: 6000 }],
        totalAmount: 12000, status: 'completed', razorpayOrderId: 'order_demo_008', razorpayPaymentId: 'pay_demo_008',
      },
      // 8: Past (guest3 @ Silicon Valley Suites Bengaluru)
      {
        unitId: roomUnits[8]._id, propertyId: properties[4]._id, userId: guest3._id,
        checkIn: futureDate(-10), checkOut: futureDate(-7), guests: 1, nights: 3,
        priceBreakdown: [{ date: futureDate(-10), price: 2500 }, { date: futureDate(-9), price: 2500 }, { date: futureDate(-8), price: 2500 }],
        totalAmount: 7500, status: 'completed', razorpayOrderId: 'order_demo_009', razorpayPaymentId: 'pay_demo_009',
      },
      // 9: Past (guest4 @ Imperial Ballroom Mumbai)
      {
        unitId: roomUnits[11]._id, propertyId: properties[5]._id, userId: guest4._id,
        checkIn: futureDate(-9), checkOut: futureDate(-8), guests: 80, nights: 1,
        priceBreakdown: [{ date: futureDate(-9), price: 18000 }],
        totalAmount: 18000, status: 'completed', razorpayOrderId: 'order_demo_010', razorpayPaymentId: 'pay_demo_010',
      },
      // 10: Past (guest1 @ Royal Lakeview Palace Udaipur)
      {
        unitId: roomUnits[12]._id, propertyId: properties[6]._id, userId: guest1._id,
        checkIn: futureDate(-18), checkOut: futureDate(-16), guests: 2, nights: 2,
        priceBreakdown: [{ date: futureDate(-18), price: 6500 }, { date: futureDate(-17), price: 6500 }],
        totalAmount: 13000, status: 'completed', razorpayOrderId: 'order_demo_011', razorpayPaymentId: 'pay_demo_011',
      },
      // 11: Past (guest2 @ Connaught Heritage Suites Delhi)
      {
        unitId: roomUnits[14]._id, propertyId: properties[7]._id, userId: guest2._id,
        checkIn: futureDate(-8), checkOut: futureDate(-6), guests: 2, nights: 2,
        priceBreakdown: [{ date: futureDate(-8), price: 4200 }, { date: futureDate(-7), price: 4200 }],
        totalAmount: 8400, status: 'completed', razorpayOrderId: 'order_demo_012', razorpayPaymentId: 'pay_demo_012',
      },
      // 12: Past (guest4 @ Backwater Lagoon Resort Kochi)
      {
        unitId: roomUnits[16]._id, propertyId: properties[8]._id, userId: guest4._id,
        checkIn: futureDate(-22), checkOut: futureDate(-19), guests: 2, nights: 3,
        priceBreakdown: [{ date: futureDate(-22), price: 5200 }, { date: futureDate(-21), price: 5200 }, { date: futureDate(-20), price: 5200 }],
        totalAmount: 15600, status: 'completed', razorpayOrderId: 'order_demo_013', razorpayPaymentId: 'pay_demo_013',
      },
      // 13: Past (guest3 @ Coromandel Bay Resort Chennai)
      {
        unitId: roomUnits[18]._id, propertyId: properties[9]._id, userId: guest3._id,
        checkIn: futureDate(-14), checkOut: futureDate(-12), guests: 2, nights: 2,
        priceBreakdown: [{ date: futureDate(-14), price: 4600 }, { date: futureDate(-13), price: 4600 }],
        totalAmount: 9200, status: 'completed', razorpayOrderId: 'order_demo_014', razorpayPaymentId: 'pay_demo_014',
      },
      // 14: Upcoming (guest4 @ Azure Cliffside Pool Villa Goa)
      {
        unitId: roomUnits[20]._id, propertyId: properties[10]._id, userId: guest4._id,
        checkIn: futureDate(14), checkOut: futureDate(16), guests: 8, nights: 2,
        priceBreakdown: [{ date: futureDate(14), price: 19500 }, { date: futureDate(15), price: 19500 }],
        totalAmount: 39000, status: 'confirmed', razorpayOrderId: 'order_demo_015', razorpayPaymentId: 'pay_demo_015',
      },
      // 15: Past (guest1 @ Fateh Sagar Royal Lawns Udaipur)
      {
        unitId: roomUnits[26]._id, propertyId: properties[14]._id, userId: guest1._id,
        checkIn: futureDate(-24), checkOut: futureDate(-23), guests: 300, nights: 1,
        priceBreakdown: [{ date: futureDate(-24), price: 65000 }],
        totalAmount: 65000, status: 'completed', razorpayOrderId: 'order_demo_016', razorpayPaymentId: 'pay_demo_016',
      },
    ]);

    console.log(`✅ Created ${bookings.length} sample bookings`);

    // =================== REVIEWS ===================
    console.log('⭐ Creating reviews...');

    const reviews = await Review.create([
      { propertyId: properties[0]._id, userId: guest1._id, bookingId: bookings[0]._id, rating: 5, title: 'Absolutely Stunning!', comment: 'The Grand Palace exceeded all expectations. The sea view from our room was breathtaking and the staff was incredibly attentive.' },
      { propertyId: properties[0]._id, userId: guest2._id, bookingId: bookings[4]._id, rating: 4, title: 'Great Stay, Minor Issues', comment: 'Beautiful hotel with great amenities and a fantastic pool area. Excellent value for money.' },
      { propertyId: properties[0]._id, userId: guest3._id, bookingId: bookings[5]._id, rating: 4, title: 'Prime Marine Drive Location', comment: 'Rooms are clean and well-maintained. The breakfast buffet has great variety for both business and leisure trips.' },
      { propertyId: properties[1]._id, userId: guest2._id, bookingId: bookings[1]._id, rating: 5, title: 'Paradise Found!', comment: 'Beach cottage just steps from the ocean with unforgettable sunset views. Best family vacation!' },
      { propertyId: properties[1]._id, userId: guest1._id, bookingId: bookings[6]._id, rating: 4, title: 'Relaxing Getaway', comment: 'The pool villas with private plunge pools are amazing and the Goan seafood was delicious.' },
      { propertyId: properties[2]._id, userId: guest3._id, bookingId: bookings[2]._id, rating: 5, title: 'A Royal Experience', comment: 'Staying at the Heritage Haveli was like living in a museum. Rooftop dinner with fort views was unforgettable.' },
      { propertyId: properties[2]._id, userId: guest2._id, bookingId: bookings[7]._id, rating: 4, title: 'Cultural Gem', comment: 'Authentic Rajasthani decor and a very informative heritage walk organized by the hotel.' },
      { propertyId: properties[3]._id, userId: guest1._id, bookingId: bookings[3]._id, rating: 5, title: 'Best Mountain Villa', comment: 'Himalayan views from the glass deck are unreal! Bonfire under the stars was magical.' },
      { propertyId: properties[4]._id, userId: guest3._id, bookingId: bookings[8]._id, rating: 4, title: 'Perfect for Work Trips', comment: 'Fast internet, comfortable work desk, and close to all major IT parks in Whitefield.' },
      { propertyId: properties[5]._id, userId: guest4._id, bookingId: bookings[9]._id, rating: 5, title: 'Flawless Corporate Summit', comment: 'AV setup, acoustics, and valet parking were seamless for our 80-person leadership summit.' },
      { propertyId: properties[6]._id, userId: guest1._id, bookingId: bookings[10]._id, rating: 5, title: 'Dreamy Lake Pichola Views', comment: 'Waking up to Lake Pichola from the terrace was magical. Royal hospitality at every step.' },
      { propertyId: properties[7]._id, userId: guest2._id, bookingId: bookings[11]._id, rating: 5, title: 'Classy & Convenient', comment: 'Steps from Connaught Place, super quiet rooms, and warm service.' },
      { propertyId: properties[8]._id, userId: guest4._id, bookingId: bookings[12]._id, rating: 5, title: 'Peaceful Kerala Backwaters', comment: 'Ayurvedic spa and morning lagoon views made this the most rejuvenating trip of the year.' },
      { propertyId: properties[9]._id, userId: guest3._id, bookingId: bookings[13]._id, rating: 4, title: 'Lovely Seaside Escape', comment: 'Clean beach access, great pool, and delicious South Indian breakfast.' },
      { propertyId: properties[10]._id, userId: guest4._id, bookingId: bookings[14]._id, rating: 5, title: 'Incredible Group Villa', comment: 'The infinity pool overlooking Vagator cliffs was the highlight of our Goa reunion.' },
      { propertyId: properties[14]._id, userId: guest1._id, bookingId: bookings[15]._id, rating: 5, title: 'Unforgettable Wedding Venue', comment: 'Our 300-guest reception on the lakeside lawn looked straight out of a fairytale.' },
    ]);

    console.log(`✅ Created ${reviews.length} reviews`);

    // =================== BLOCKED DATES ===================
    console.log('🚫 Creating blocked dates...');

    await BlockedDate.create([
      { unitId: roomUnits[7]._id, from: futureDate(15), to: futureDate(20), reason: 'Scheduled maintenance and deep cleaning', createdBy: owner2._id },
      { unitId: roomUnits[2]._id, from: futureDate(25), to: futureDate(27), reason: 'Private corporate event', createdBy: owner1._id },
      { unitId: roomUnits[20]._id, from: futureDate(22), to: futureDate(24), reason: 'Pool resurfacing maintenance', createdBy: owner2._id },
      { unitId: roomUnits[26]._id, from: futureDate(18), to: futureDate(19), reason: 'Private royal wedding buyout', createdBy: owner2._id },
    ]);

    console.log('✅ Created blocked dates');

    console.log('\n' + '='.repeat(55));
    console.log('🎉 STAYSPOT SEED COMPLETE!');
    console.log('='.repeat(55));
    console.log('\n📌 Demo Accounts:');
    console.log('   Owner: owner@demo.com / password123');
    console.log('   Guest: guest@demo.com / password123');
    console.log('   Admin: admin@demo.com / password123');
    console.log('\n📊 Seeded Data:');
    console.log(`   Users:         ${users.length}`);
    console.log(`   Properties:    ${properties.length}`);
    console.log(`   Room Units:    ${roomUnits.length}`);
    console.log(`   Bookings:      ${bookings.length}`);
    console.log(`   Pricing Rules: ${pricingRules.length}`);
    console.log(`   Reviews:       ${reviews.length}`);
    console.log('   Blocked Dates: 4');
    console.log('\n🏙️  Cities: Mumbai, Goa, Bengaluru, Delhi, Jaipur, Udaipur, Manali, Kochi, Hyderabad, Chennai');
    console.log('='.repeat(55) + '\n');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit();
  }
};

seedDatabase();
