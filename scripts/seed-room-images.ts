import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { connectToDatabase } from '../src/lib/db/connection';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Cohesive 3-photo room suites where all 3 photos match each other's interior style, colors, and lighting
export const COHESIVE_ROOM_SUITES = [
  // Suite 0: Warm Wood & Amber Luxury (Deluxe / Executive)
  [
    {
      url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      caption: 'Master Bed & Cozy Headboard',
    },
    {
      url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      caption: 'In-Room Lounge & Window View',
    },
    {
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      caption: 'Ensuite Marble Bathroom & Vanity',
    },
  ],
  // Suite 1: Royal Heritage / Haveli Classic
  [
    {
      url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      caption: 'Heritage Royal Bed & Carved Wood',
    },
    {
      url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      caption: 'Private Verandah & Courtyard View',
    },
    {
      url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
      caption: 'Traditional Brass Vanity & Bath',
    },
  ],
  // Suite 2: Scenic Resort & Balcony Suite
  [
    {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      caption: 'King Bed with Garden Balcony Access',
    },
    {
      url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      caption: 'Open Terrace Seating & Fresh Air',
    },
    {
      url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
      caption: 'Spa Bathtub & Panoramic Window',
    },
  ],
  // Suite 3: Contemporary Velvet & Ambient Lighting
  [
    {
      url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      caption: 'Plush King Suite & Mood Lighting',
    },
    {
      url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      caption: 'Executive Seating Area & Work Desk',
    },
    {
      url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
      caption: 'Glass Rain Shower & LED Mirror',
    },
  ],
  // Suite 4: Urban Minimalist & Warm Oak
  [
    {
      url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      caption: 'Warm Oak Bed & Clean Aesthetics',
    },
    {
      url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bay Window Study & City Skyline',
    },
    {
      url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
      caption: 'Modern Granite Vanity & Shower',
    },
  ],
];

async function updateAllRooms() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const col = db.collection('physicalrooms');
  const allDocs = await col.find({}).toArray();
  console.log(`Found ${allDocs.length} raw docs in physicalrooms collection`);

  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const numInt = parseInt(String(doc.roomNumber).replace(/\D/g, ''), 10) || i;
    const suiteIndex = numInt % COHESIVE_ROOM_SUITES.length;
    const suite = COHESIVE_ROOM_SUITES[suiteIndex];

    const photos = suite.map((item) => ({
      url: item.url,
      caption: `Room #${doc.roomNumber} - ${item.caption}`,
    }));

    await col.updateOne(
      { _id: doc._id },
      { $set: { images: photos } }
    );
  }

  console.log('Successfully re-seeded all rooms with cohesive matching 3-photo suites!');
  process.exit(0);
}

updateAllRooms().catch((err) => {
  console.error(err);
  process.exit(1);
});
