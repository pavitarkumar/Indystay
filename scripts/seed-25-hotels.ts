import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';
import { Hotel } from '../src/models/Hotel';
import { RoomType } from '../src/models/RoomType';
import { PhysicalRoom } from '../src/models/PhysicalRoom';

interface HotelSeedData {
  name: string;
  slug: string;
  description: string;
  propertyType: 'HOTEL' | 'RESORT' | 'HOMESTAY' | 'VILLA' | 'BOUTIQUE';
  address: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  phone: string;
  email: string;
  coverImage: string;
  gallery: string[];
  ratingAverage: number;
  ratingCount: number;
  roomTypes: Array<{
    name: string;
    bedConfiguration: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    basePrice: number;
    sizeSqFt: number;
    amenities: string[];
    images: string[];
    rooms: Array<{ roomNumber: string; floor: number }>;
  }>;
}

const hotelsData: HotelSeedData[] = [
  // 1. Delhi
  {
    name: 'The Imperial Heritage Palace & Suites',
    slug: 'the-imperial-heritage-palace-new-delhi',
    description: 'An iconic heritage property blending Victorian elegance with Indian hospitality in the heart of Connaught Place, New Delhi.',
    propertyType: 'BOUTIQUE',
    address: 'Janpath Lane, Connaught Place',
    locality: 'Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110001',
    latitude: 28.6253,
    longitude: 77.2177,
    amenities: ['Free High-Speed Wi-Fi', 'Swimming Pool', 'Spa & Wellness Sanctuary', 'Fine Dining Restaurant', 'Cocktail Lounge', 'Valet Parking', 'Airport Transfer', '24/7 Room Service'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 11 4111 6000',
    email: 'reservations.delhi@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 184,
    roomTypes: [
      {
        name: 'Heritage Heritage King Suite',
        bedConfiguration: '1 Royal King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 7200,
        sizeSqFt: 520,
        amenities: ['City View', 'Marble Bathtub', 'High-Speed Wi-Fi', 'Espresso Machine', 'Air Conditioning'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
      {
        name: 'Deluxe Royal Chamber',
        bedConfiguration: '1 Queen Bed',
        maxAdults: 2,
        maxChildren: 0,
        maxOccupancy: 2,
        basePrice: 4800,
        sizeSqFt: 380,
        amenities: ['Garden View', 'Mini Bar', 'Free Wi-Fi', 'Rain Shower', 'Smart LED TV'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '301', floor: 3 },
          { roomNumber: '302', floor: 3 },
          { roomNumber: '303', floor: 3 },
        ],
      },
    ],
  },

  // 2. Udaipur
  {
    name: 'Lake Pichola Royal Palace & Island Resort',
    slug: 'lake-pichola-royal-palace-udaipur',
    description: 'Breathtaking lakeside luxury with panoramic views of the Aravalli hills and the shimmering waters of Lake Pichola.',
    propertyType: 'BOUTIQUE',
    address: 'Outside Chandpole, Lake Pichola Waterfront',
    locality: 'Old City Waterfront',
    city: 'Udaipur',
    state: 'Rajasthan',
    postalCode: '313001',
    latitude: 24.5764,
    longitude: 73.6835,
    amenities: ['Lake View Infinity Pool', 'Rooftop Rajasthani Restaurant', 'Boat Excursions', 'Ayurvedic Spa', 'Free Wi-Fi', 'Cultural Performances'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'MODERATE',
    phone: '+91 294 243 1111',
    email: 'reservations.udaipur@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 220,
    roomTypes: [
      {
        name: 'Lake View Royal Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 8500,
        sizeSqFt: 600,
        amenities: ['Unobstructed Lake View', 'Private Balcony', 'Jacuzzi', 'Butler Service', 'Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
      {
        name: 'Courtyard Haveli Room',
        bedConfiguration: '1 Double Bed',
        maxAdults: 2,
        maxChildren: 0,
        maxOccupancy: 2,
        basePrice: 5200,
        sizeSqFt: 400,
        amenities: ['Courtyard View', 'Handcrafted Wood Decor', 'Free Wi-Fi', 'Air Conditioning'],
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '105', floor: 1 },
          { roomNumber: '106', floor: 1 },
          { roomNumber: '205', floor: 2 },
        ],
      },
    ],
  },

  // 3. Bengaluru
  {
    name: 'The Silicon Grand Luxury Hotel & Spa',
    slug: 'the-silicon-grand-luxury-hotel-bengaluru',
    description: 'State-of-the-art business and luxury hotel situated strategically on MG Road, surrounded by lush gardens and tech hubs.',
    propertyType: 'HOTEL',
    address: '66 MG Road, Shanthala Nagar',
    locality: 'MG Road / Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    latitude: 12.9756,
    longitude: 77.6067,
    amenities: ['High-Speed Fiber Wi-Fi', 'Rooftop Heated Pool', 'Business Center', 'Executive Club Lounge', '24/7 Gym', 'Multi-Cuisine Buffet'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 80 4040 8888',
    email: 'bangalore.stay@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 142,
    roomTypes: [
      {
        name: 'Executive Business Suite',
        bedConfiguration: '1 King Bed & Work Desk',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5600,
        sizeSqFt: 450,
        amenities: ['Ergonomic Workstation', 'High-Speed Wi-Fi', 'City Skyline View', 'Coffee Machine'],
        images: ['https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '401', floor: 4 },
          { roomNumber: '402', floor: 4 },
          { roomNumber: '501', floor: 5 },
          { roomNumber: '502', floor: 5 },
        ],
      },
      {
        name: 'Premier Deluxe Room',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 0,
        maxOccupancy: 2,
        basePrice: 3900,
        sizeSqFt: 350,
        amenities: ['Soundproof Windows', 'Walk-in Shower', 'Smart TV', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
          { roomNumber: '203', floor: 2 },
        ],
      },
    ],
  },

  // 4. Varanasi
  {
    name: 'Ganga Ghat Heritage Haveli & Spiritual Retreat',
    slug: 'ganga-ghat-heritage-haveli-varanasi',
    description: 'Historic riverside palace on Dashashwamedh Ghat with direct morning Aarti views and spiritual wellness programs.',
    propertyType: 'BOUTIQUE',
    address: 'D 24/11 Dashashwamedh Ghat Road',
    locality: 'Ghat Waterfront',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    postalCode: '221001',
    latitude: 25.3076,
    longitude: 83.0104,
    amenities: ['Ganga Aarti View Terrace', 'Vegetarian Dining', 'Yoga & Meditation Deck', 'Free Wi-Fi', 'Boat Tour Concierge'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 542 227 5000',
    email: 'varanasi.heritage@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 165,
    roomTypes: [
      {
        name: 'Ganga View Royal Heritage Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5900,
        sizeSqFt: 480,
        amenities: ['Sacred River View', 'Private Balcony', 'Handmade Silk Tapestries', 'Air Conditioning'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 5. Kochi
  {
    name: 'Fort Kochi Colonial Waterside Heritage Stay',
    slug: 'fort-kochi-colonial-waterside-stay',
    description: 'Charming Portuguese and Dutch colonial manor facing the Arabian Sea harbour, adorned with antique teakwood.',
    propertyType: 'BOUTIQUE',
    address: '1/268 Parade Ground, Fort Kochi',
    locality: 'Fort Kochi Heritage Zone',
    city: 'Kochi',
    state: 'Kerala',
    postalCode: '682001',
    latitude: 9.9658,
    longitude: 76.2421,
    amenities: ['Swimming Pool', 'Seafood Grill', 'Ayurveda Treatments', 'Bicycle Rentals', 'Free Wi-Fi', 'Garden Courtyard'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 484 221 8000',
    email: 'kochi.fort@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.7,
    ratingCount: 110,
    roomTypes: [
      {
        name: 'Dutch Colonial Suite',
        bedConfiguration: '1 Four-Poster King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5400,
        sizeSqFt: 500,
        amenities: ['Sea Breeze Balcony', 'Teakwood Furnishings', 'Free Wi-Fi', 'Rain Shower'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 6. Agra
  {
    name: 'Taj View Royal Palace & Spa',
    slug: 'taj-view-royal-palace-agra',
    description: 'Spectacular resort offering unobstructed view of the Taj Mahal from landscaped gardens and private balconies.',
    propertyType: 'RESORT',
    address: 'Taj East Gate Road, Forest Colony',
    locality: 'Taj East Gate',
    city: 'Agra',
    state: 'Uttar Pradesh',
    postalCode: '282001',
    latitude: 27.1685,
    longitude: 78.0534,
    amenities: ['Taj Mahal View Rooftop', 'Outdoor Pool', 'Mughlai Restaurant', 'Fitness Center', 'Spa', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'MODERATE',
    phone: '+91 562 222 3000',
    email: 'agra.tajview@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 195,
    roomTypes: [
      {
        name: 'Taj Monument View Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 6800,
        sizeSqFt: 510,
        amenities: ['Direct Taj View', 'Marble Bath', 'Smart TV', 'Complimentary Breakfast', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
          { roomNumber: '301', floor: 3 },
          { roomNumber: '302', floor: 3 },
        ],
      },
    ],
  },

  // 7. Hyderabad
  {
    name: "Nizam's Royal Heritage Suites & Club",
    slug: 'nizams-royal-heritage-suites-hyderabad',
    description: 'Opulent Nizami architecture featuring crystal chandeliers, Mughal gardens, and authentic Hyderabadi gourmet.',
    propertyType: 'BOUTIQUE',
    address: 'Road No. 1, Banjara Hills',
    locality: 'Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500034',
    latitude: 17.4156,
    longitude: 78.4354,
    amenities: ['Royal Dining Room', 'Swimming Pool', 'Spa', 'Banquet Hall', 'Valet Parking', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 40 6666 5000',
    email: 'hyderabad.nizam@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 138,
    roomTypes: [
      {
        name: 'Royal Nizami Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 6200,
        sizeSqFt: 550,
        amenities: ['City View', 'Handmade Rugs', 'Free Wi-Fi', 'Mini Bar', 'Deep Soaking Tub'],
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 8. Kolkata
  {
    name: 'The Grand Victoria Colonial Hotel & Club',
    slug: 'the-grand-victoria-colonial-hotel-kolkata',
    description: 'Historic British-era hospitality icon situated on lively Park Street, adjacent to the Victoria Memorial.',
    propertyType: 'BOUTIQUE',
    address: '15 Park Street, Taltala',
    locality: 'Park Street',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700016',
    latitude: 22.5515,
    longitude: 88.3524,
    amenities: ['Colonial High Tea Lounge', 'Swimming Pool', 'Live Jazz Club', 'Free Wi-Fi', '24/7 Room Service'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 33 2249 2323',
    email: 'kolkata.grand@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.7,
    ratingCount: 156,
    roomTypes: [
      {
        name: 'Victoria Heritage King Room',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5100,
        sizeSqFt: 460,
        amenities: ['High Ceilings', 'Period Teak Furnishings', 'Free Wi-Fi', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 9. Chennai
  {
    name: 'Coromandel Coastal Sands Luxury Resort',
    slug: 'coromandel-coastal-sands-resort-chennai',
    description: 'Beachfront serenity along East Coast Road (ECR) with direct ocean access, infinity pools, and Chettinad feasts.',
    propertyType: 'RESORT',
    address: 'East Coast Road, Kovalam',
    locality: 'ECR Coastline',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '603112',
    latitude: 12.7925,
    longitude: 80.2526,
    amenities: ['Private Beach Access', 'Ocean View Infinity Pool', 'Chettinad Seafood Restaurant', 'Spa', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 44 6724 0000',
    email: 'chennai.coromandel@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 125,
    roomTypes: [
      {
        name: 'Oceanfront Villa Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 6500,
        sizeSqFt: 540,
        amenities: ['Arabian Sea Waves View', 'Private Deck', 'Outdoor Rain Shower', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 10. Rishikesh
  {
    name: 'Himalayan Ganga Yoga Retreat & Wellness Spa',
    slug: 'himalayan-ganga-yoga-retreat-rishikesh',
    description: 'Tranquil sanctuary in Tapovan overlooking the holy Ganges, providing daily yoga classes, Ayurveda, and river rafting.',
    propertyType: 'RESORT',
    address: 'Badrinath Road, Tapovan',
    locality: 'Tapovan',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    postalCode: '249192',
    latitude: 30.1313,
    longitude: 78.3248,
    amenities: ['Yoga Hall', 'River View Terrace', 'Ayurvedic Wellness Spa', 'Organic Vegetarian Cafe', 'Free Wi-Fi'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 135 244 2200',
    email: 'rishikesh.retreat@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 172,
    roomTypes: [
      {
        name: 'Ganga & Mountain View Cottage',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 4800,
        sizeSqFt: 420,
        amenities: ['Himalayan Valley View', 'Private Balcony', 'Herbal Tea Station', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 11. Amritsar
  {
    name: 'Golden Temple Heritage Inn & Suites',
    slug: 'golden-temple-heritage-inn-amritsar',
    description: 'Located a short stroll from Sri Harmandir Sahib, presenting authentic Punjabi hospitality and gourmet dining.',
    propertyType: 'BOUTIQUE',
    address: 'Heritage Street, Near Golden Temple Gate 3',
    locality: 'Heritage Street',
    city: 'Amritsar',
    state: 'Punjab',
    postalCode: '143001',
    latitude: 31.6200,
    longitude: 74.8765,
    amenities: ['Temple Shuttle', 'Punjabi Dhaba Restaurant', '24/7 Room Service', 'Free Wi-Fi', 'Luggage Storage'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 183 505 4000',
    email: 'amritsar.stay@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 140,
    roomTypes: [
      {
        name: 'Deluxe Heritage Chamber',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 3800,
        sizeSqFt: 380,
        amenities: ['Air Conditioning', 'Free Wi-Fi', 'Smart TV', 'Tea & Coffee Maker'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 12. Munnar
  {
    name: 'Misty Tea Hills Estate Resort & Chalets',
    slug: 'misty-tea-hills-estate-resort-munnar',
    description: 'Nestled amid emerald tea plantations in the Western Ghats with misty mountain breezes and cardamom trails.',
    propertyType: 'RESORT',
    address: 'Pothamedu, Devikulam Road',
    locality: 'Pothamedu Viewpoint',
    city: 'Munnar',
    state: 'Kerala',
    postalCode: '685612',
    latitude: 10.0889,
    longitude: 77.0595,
    amenities: ['Tea Plantation Walk', 'Campfire Deck', 'Mountain View Restaurant', 'Spa', 'Free Wi-Fi', 'Balcony in all rooms'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 4865 230 400',
    email: 'munnar.resort@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 160,
    roomTypes: [
      {
        name: 'Valley View Tea Plantation Villa',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5200,
        sizeSqFt: 460,
        amenities: ['Panoramic Valley View', 'Private Fireplace', 'Balcony', 'Hot Shower', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 13. Ooty
  {
    name: 'Nilgiri Blue Mountain Colonial Manor',
    slug: 'nilgiri-blue-mountain-colonial-manor-ooty',
    description: 'English country-style estate surrounded by eucalyptus trees, rose gardens, and views of the Doddabetta peak.',
    propertyType: 'BOUTIQUE',
    address: 'Fernhill Palace Road',
    locality: 'Fernhill',
    city: 'Ooty',
    state: 'Tamil Nadu',
    postalCode: '643004',
    latitude: 11.4102,
    longitude: 76.6950,
    amenities: ['Fireplace in Rooms', 'Botanical Garden', 'High Tea Service', 'Billiards Room', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 423 244 5000',
    email: 'ooty.manor@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 118,
    roomTypes: [
      {
        name: 'Victorian Fireplace Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5600,
        sizeSqFt: 480,
        amenities: ['Working Fireplace', 'Garden View', 'Antique Wooden Flooring', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 14. Shimla
  {
    name: 'The Mall Road Heritage Villa & Mountain View',
    slug: 'the-mall-road-heritage-villa-shimla',
    description: 'Charming hill station villa steps from The Ridge and Christ Church, overlooking cedar forests and snow peaks.',
    propertyType: 'BOUTIQUE',
    address: 'Near The Ridge, The Mall',
    locality: 'The Mall / Ridge',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    postalCode: '171001',
    latitude: 31.1048,
    longitude: 77.1734,
    amenities: ['Panoramic Mountain Balcony', 'Fine Dining Restaurant', 'Indoor Heating', 'Free Wi-Fi', '24/7 Hot Water'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 177 265 8000',
    email: 'shimla.villa@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 135,
    roomTypes: [
      {
        name: 'Himalayan Ridge View Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 6100,
        sizeSqFt: 450,
        amenities: ['Snow Peaks View', 'Electric Heating', 'Wooden Decor', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 15. Darjeeling
  {
    name: 'Kanchenjunga Alpine Tea Estate Retreat',
    slug: 'kanchenjunga-alpine-tea-estate-darjeeling',
    description: 'Picturesque estate with morning sunrise views of Mount Kanchenjunga over Darjeeling tea gardens.',
    propertyType: 'RESORT',
    address: 'Lebaong Cart Road',
    locality: 'Chowrasta / Cart Road',
    city: 'Darjeeling',
    state: 'West Bengal',
    postalCode: '734101',
    latitude: 27.0410,
    longitude: 88.2663,
    amenities: ['Kanchenjunga Sunrise View Deck', 'Tea Tasting Tours', 'In-Room Fireplace', 'Free Wi-Fi', 'Traditional Tibetan Meals'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 354 225 4500',
    email: 'darjeeling.retreat@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 150,
    roomTypes: [
      {
        name: 'Kanchenjunga Vista Room',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5800,
        sizeSqFt: 430,
        amenities: ['Snow View Balcony', 'Tea Maker with Fresh Leaves', 'Heated Blankets', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 16. Jodhpur
  {
    name: 'Mehrangarh Desert Oasis Haveli & Spa',
    slug: 'mehrangarh-desert-oasis-haveli-jodhpur',
    description: 'Golden sandstone palace with breathtaking rooftop views of the majestic Mehrangarh Fort and the Blue City.',
    propertyType: 'BOUTIQUE',
    address: 'Makrana Mohalla, Navchokiya',
    locality: 'Blue City Quarter',
    city: 'Jodhpur',
    state: 'Rajasthan',
    postalCode: '342001',
    latitude: 26.2978,
    longitude: 73.0185,
    amenities: ['Fort View Terrace Restaurant', 'Swimming Pool', 'Desert Safari Booking', 'Cultural Dance Shows', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'MODERATE',
    phone: '+91 291 262 7000',
    email: 'jodhpur.haveli@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 168,
    roomTypes: [
      {
        name: 'Fort View Jharokha Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5300,
        sizeSqFt: 460,
        amenities: ['Stone Carved Jharokha Balcony', 'Fort View', 'Air Conditioning', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 17. Pondicherry
  {
    name: 'French Quarter Colonial Promenade Villa',
    slug: 'french-quarter-colonial-villa-pondicherry',
    description: 'Graceful French architecture with pastel mustard facades, bougainvillea verandas, and footsteps to the Promenade Beach.',
    propertyType: 'BOUTIQUE',
    address: '12 Rue Dumas, White Town',
    locality: 'White Town / French Quarter',
    city: 'Pondicherry',
    state: 'Puducherry',
    postalCode: '605001',
    latitude: 11.9338,
    longitude: 79.8350,
    amenities: ['French Bakery & Cafe', 'Courtyard Garden', 'Promenade Walking Distance', 'Free Wi-Fi', 'Bicycle Tours'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 413 222 7500',
    email: 'pondi.frenchvilla@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 132,
    roomTypes: [
      {
        name: 'Rue Dumas French Balcony Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 4900,
        sizeSqFt: 440,
        amenities: ['French Windows & Balcony', 'High Ceilings', 'Free Wi-Fi', 'Air Conditioning'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 18. Alleppey
  {
    name: 'Kerala Backwaters Floating Villa & Palms Resort',
    slug: 'kerala-backwaters-floating-villa-alleppey',
    description: 'Tranquil luxury resort set right along Punnamada Lake, offering serene canal cruises, organic farms, and Ayurvedic care.',
    propertyType: 'RESORT',
    address: 'Punnamada Jetty Road',
    locality: 'Punnamada Lakefront',
    city: 'Alleppey',
    state: 'Kerala',
    postalCode: '688006',
    latitude: 9.5085,
    longitude: 76.3534,
    amenities: ['Houseboat Cruises', 'Lakeside Pool', 'Traditional Kerala Spa', 'Fishing Deck', 'Free Wi-Fi'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 477 224 8800',
    email: 'alleppey.resort@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 145,
    roomTypes: [
      {
        name: 'Backwater Lakefront Cottage',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5700,
        sizeSqFt: 470,
        amenities: ['Direct Lake Frontage', 'Private Veranda', 'Open-to-Sky Bath', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '103', floor: 1 },
        ],
      },
    ],
  },

  // 19. Mussoorie
  {
    name: 'Queen of Hills Mist Valley Manor & Chalets',
    slug: 'queen-of-hills-mist-valley-mussoorie',
    description: 'Perched along Camel’s Back Road with uninterrupted views of the Doon Valley and snow-dusted Garhwal Himalayas.',
    propertyType: 'RESORT',
    address: 'Camel’s Back Road, The Mall',
    locality: 'Camel’s Back',
    city: 'Mussoorie',
    state: 'Uttarakhand',
    postalCode: '248179',
    latitude: 30.4598,
    longitude: 78.0644,
    amenities: ['Valley View Terrace', 'Indoor Fireplaces', 'Multi-Cuisine Dining', 'Bonfire Evenings', 'Free Wi-Fi'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 135 263 2000',
    email: 'mussoorie.manor@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 112,
    roomTypes: [
      {
        name: 'Doon Valley View Suite',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 5500,
        sizeSqFt: 440,
        amenities: ['Panoramic Valley View', 'Private Balcony', 'Heating', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 20. Pune
  {
    name: 'Koregaon Park Contemporary Boutique Hotel',
    slug: 'koregaon-park-contemporary-boutique-pune',
    description: 'Chic modern boutique residence situated in leafy Koregaon Park, close to cafes, Osho Ashram, and cyber parks.',
    propertyType: 'BOUTIQUE',
    address: 'Lane 7, Koregaon Park',
    locality: 'Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5362,
    longitude: 73.8958,
    amenities: ['Artisan Coffee Bar', 'Rooftop Lounge', 'High-Speed Wi-Fi', 'Gym', 'Airport Shuttle'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 20 6604 7000',
    email: 'pune.boutique@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.7,
    ratingCount: 98,
    roomTypes: [
      {
        name: 'Urban Deluxe Room',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 0,
        maxOccupancy: 2,
        basePrice: 3800,
        sizeSqFt: 360,
        amenities: ['Leafy Canopy View', 'Ergonomic Desk', 'Smart TV', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
          { roomNumber: '202', floor: 2 },
        ],
      },
    ],
  },

  // 21. Ahmedabad
  {
    name: 'Sabarmati Waterfront Heritage & Business Hotel',
    slug: 'sabarmati-waterfront-heritage-hotel-ahmedabad',
    description: 'Centrally located by the Sabarmati Riverfront, blending Gujarati jharokha craftsmanship with modern executive comforts.',
    propertyType: 'HOTEL',
    address: 'Riverfront West, Ashram Road',
    locality: 'Ashram Road Riverfront',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380009',
    latitude: 23.0338,
    longitude: 72.5714,
    amenities: ['River View Terrace', 'Vegetarian Gujarati Thali Dining', 'Business Suites', 'Free Wi-Fi', 'Gym'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 79 2658 9000',
    email: 'ahmedabad.stay@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.7,
    ratingCount: 104,
    roomTypes: [
      {
        name: 'Riverfront Executive Room',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 4200,
        sizeSqFt: 400,
        amenities: ['Riverfront View', 'Workstation', 'Tea Maker', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },

  // 22. Lucknow
  {
    name: 'Awadh Royal Nawabi Palace & Residency',
    slug: 'awadh-royal-nawabi-palace-lucknow',
    description: 'Regal Lucknowi palace presenting classic Awadhi hospitality, delicate chikankari decor, and legendary kebabs.',
    propertyType: 'BOUTIQUE',
    address: 'Mahatma Gandhi Marg, Hazratganj',
    locality: 'Hazratganj',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postalCode: '226001',
    latitude: 26.8467,
    longitude: 80.9462,
    amenities: ['Awadhi Gourmet Restaurant', 'Lush Mughal Lawns', 'Free Wi-Fi', 'Valet Parking', '24/7 Room Service'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    phone: '+91 522 400 3300',
    email: 'lucknow.nawabi@indistay.com',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 119,
    roomTypes: [
      {
        name: 'Nawabi Grand Chamber',
        bedConfiguration: '1 King Bed',
        maxAdults: 2,
        maxChildren: 1,
        maxOccupancy: 3,
        basePrice: 4600,
        sizeSqFt: 450,
        amenities: ['Garden View', 'Chikankari Silk Curtains', 'Air Conditioning', 'Free Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        rooms: [
          { roomNumber: '101', floor: 1 },
          { roomNumber: '102', floor: 1 },
          { roomNumber: '201', floor: 2 },
        ],
      },
    ],
  },
];

async function seedHotels() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);

  const defaultPasswordHash = await bcrypt.hash('IndiStay#2026', 12);

  // Ensure default hotel admin exists
  let partnerAdmin = await User.findOne({ email: 'partner.manager@indistay.com' });
  if (!partnerAdmin) {
    partnerAdmin = await User.create({
      name: 'IndiStay Partner Manager',
      email: 'partner.manager@indistay.com',
      passwordHash: defaultPasswordHash,
      phone: '+919876543299',
      role: 'HOTEL_ADMIN',
      accountStatus: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });
    console.log('Created partner manager user');
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const h of hotelsData) {
    let hotel = await Hotel.findOne({ slug: h.slug });

    if (!hotel) {
      hotel = await Hotel.create({
        name: h.name,
        slug: h.slug,
        description: h.description,
        propertyType: h.propertyType,
        ownerUserId: partnerAdmin._id,
        adminUserIds: [partnerAdmin._id],
        address: h.address,
        locality: h.locality,
        city: h.city,
        state: h.state,
        country: 'India',
        postalCode: h.postalCode,
        latitude: h.latitude,
        longitude: h.longitude,
        amenities: h.amenities,
        checkInTime: h.checkInTime,
        checkOutTime: h.checkOutTime,
        cancellationPolicy: h.cancellationPolicy,
        contactInformation: {
          phone: h.phone,
          email: h.email,
        },
        coverImage: {
          url: h.coverImage,
          alt: h.name,
        },
        images: h.gallery.map((url, i) => ({
          url,
          caption: `${h.name} View ${i + 1}`,
        })),
        ratingAverage: h.ratingAverage,
        ratingCount: h.ratingCount,
        verificationStatus: 'APPROVED',
        listingStatus: 'PUBLISHED',
      });
      createdCount++;
      console.log(`[Created Hotel] ${h.name} in ${h.city}`);
    } else {
      hotel.name = h.name;
      hotel.description = h.description;
      hotel.city = h.city;
      hotel.state = h.state;
      hotel.verificationStatus = 'APPROVED';
      hotel.listingStatus = 'PUBLISHED';
      await hotel.save();
      updatedCount++;
      console.log(`[Updated Hotel] ${h.name} in ${h.city}`);
    }

    // Now seed room types and physical rooms for this hotel
    for (const rtData of h.roomTypes) {
      let roomType = await RoomType.findOne({ hotelId: hotel._id, name: rtData.name });
      if (!roomType) {
        roomType = await RoomType.create({
          hotelId: hotel._id,
          name: rtData.name,
          slug: `${h.slug}-${rtData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          bedConfiguration: rtData.bedConfiguration,
          maxAdults: rtData.maxAdults,
          maxChildren: rtData.maxChildren,
          maxOccupancy: rtData.maxOccupancy,
          basePrice: rtData.basePrice,
          currency: 'INR',
          sizeSqFt: rtData.sizeSqFt,
          amenities: rtData.amenities,
          images: rtData.images.map((url) => ({ url, caption: rtData.name })),
          status: 'ACTIVE',
        });
      }

      // Physical rooms
      for (const r of rtData.rooms) {
        const existingRoom = await PhysicalRoom.findOne({
          hotelId: hotel._id,
          roomNumber: r.roomNumber,
        });

        if (!existingRoom) {
          await PhysicalRoom.create({
            hotelId: hotel._id,
            roomTypeId: roomType._id,
            roomNumber: r.roomNumber,
            floor: r.floor,
            operationalStatus: 'AVAILABLE',
            housekeepingStatus: 'CLEAN',
            notes: `${rtData.name} - Unit ${r.roomNumber}`,
          });
        }
      }
    }
  }

  const totalHotels = await Hotel.countDocuments({});
  const totalRooms = await PhysicalRoom.countDocuments({});
  console.log(`\n🎉 SEEDING COMPLETED! Total Hotels: ${totalHotels}, Total Physical Rooms: ${totalRooms}`);
  await mongoose.disconnect();
}

seedHotels().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
