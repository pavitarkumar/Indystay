import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

function categorizeRoom(name: string) {
  const lower = (name || '').toLowerCase();
  if (/royal|palace|maharaja|heritage|monument|nizami|haveli|chamber|kohinoor|victorian/i.test(lower)) {
    return 'ROYAL_PALACE';
  }
  if (/mountain|alpine|himalayan|ridge|kanchenjunga|valley|doon|cedar|cabin/i.test(lower)) {
    return 'ALPINE_MOUNTAIN';
  }
  if (/sea|ocean|beach|azure|villa|chalet|lake|backwater|river|pool|portuguese|french/i.test(lower)) {
    return 'COASTAL_SEAVIEW';
  }
  if (/executive|business|club|skyline|regency|urban|estate/i.test(lower)) {
    return 'EXECUTIVE_SKYLINE';
  }
  return 'DELUXE_SIGNATURE';
}

function getTourAssetsForCategory(category: string, roomName: string) {
  switch (category) {
    case 'ROYAL_PALACE':
      return {
        panoramas: [
          {
            url: '/panoramas/royal-palace-360.jpg',
            sceneName: 'Imperial Grand Palace Suite',
            sceneId: 'palace-chamber',
            order: 1,
            description: 'Palatial royal suite with ornate architectural carvings and imperial chandeliers.',
            hotspots: [
              {
                pitch: -6,
                yaw: 45,
                label: 'Imperial Carved King Bed',
                description: 'Handcrafted royal teak platform bed with pure silk upholstery.',
              },
              {
                pitch: 18,
                yaw: 10,
                label: 'Crystal Chandelier',
                description: 'Grand bohemian crystal imperial chandelier casting warm ambient light.',
              },
              {
                pitch: 2,
                yaw: -80,
                label: 'Heritage Jharokha Alcove',
                description: 'Carved stone viewing gallery overlooking manicured palace courtyards.',
              },
            ],
          },
          {
            url: '/panoramas/suite-lounge-360.jpg',
            sceneName: 'Royal Nizami Living Hall',
            sceneId: 'palace-lounge',
            order: 2,
            description: 'Private audience hall with velvet seating and antique decorative artifacts.',
            hotspots: [
              {
                pitch: -10,
                yaw: 30,
                label: 'Royal Velvet Diwan',
                description: 'Rich velvet seating with embroidered gold cushions.',
              },
            ],
          },
        ],
        model3d: {
          url: '/models/glamvelvetsofa.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80',
          description: `${roomName} — Palatial Suite 3D with Italian marble, royal crimson accents, and luxury velvet sofa.`,
          themeStyle: 'ROYAL_PALACE',
        },
      };

    case 'ALPINE_MOUNTAIN':
      return {
        panoramas: [
          {
            url: '/panoramas/alpine-cabin-360.jpg',
            sceneName: 'Alpine Cedar Ridge Chamber',
            sceneId: 'alpine-bedroom',
            order: 1,
            description: 'Rustic cedar mountain suite with exposed pine timber beams and snow-peak views.',
            hotspots: [
              {
                pitch: -8,
                yaw: 20,
                label: 'Himalayan Cedar King Bed',
                description: 'Locally crafted cedar timber bed with organic goose-down duvet.',
              },
              {
                pitch: 4,
                yaw: 135,
                label: 'Mountain Vista Terrace',
                description: 'Panoramic glass deck offering sweeping views of pine valleys.',
              },
              {
                pitch: -12,
                yaw: -60,
                label: 'Hearthstone Fireplace',
                description: 'Natural stone fireplace providing warmth on crisp mountain evenings.',
              },
            ],
          },
          {
            url: '/panoramas/plantation-chalet-360.jpg',
            sceneName: 'Valley View Chalet Lounge',
            sceneId: 'chalet-lounge',
            order: 2,
            description: 'Cozy timber living area with reading nook and hot beverage bar.',
            hotspots: [
              {
                pitch: -5,
                yaw: 50,
                label: 'Artisan Tea Station',
                description: 'Fresh estate-grown single origin teas and French press coffee.',
              },
            ],
          },
        ],
        model3d: {
          url: '/models/luxury-armchair.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=400&q=80',
          description: `${roomName} — Alpine Mountain 3D Suite with rustic oak timber, pine green runner, and reading armchair.`,
          themeStyle: 'ALPINE_MOUNTAIN',
        },
      };

    case 'COASTAL_SEAVIEW':
      return {
        panoramas: [
          {
            url: '/panoramas/plantation-chalet-360.jpg',
            sceneName: 'Oceanfront Beach Villa Suite',
            sceneId: 'beach-bedroom',
            order: 1,
            description: 'Breezy coastal villa with sun-bleached hardwoods and ocean vistas.',
            hotspots: [
              {
                pitch: -5,
                yaw: 15,
                label: 'Coastal Teak Bed',
                description: 'Open-grain teak bed dressed in cool Egyptian percale linens.',
              },
              {
                pitch: 6,
                yaw: 110,
                label: 'Sea Breeze Sundeck',
                description: 'Direct step-out deck facing turquoise waters and palm groves.',
              },
              {
                pitch: -10,
                yaw: -70,
                label: 'Rattan Daybed Lounge',
                description: 'Relaxed woven daybed perfect for afternoon coastal reading.',
              },
            ],
          },
          {
            url: '/panoramas/suite-lounge-360.jpg',
            sceneName: 'Veranda Coastal Living',
            sceneId: 'beach-lounge',
            order: 2,
            description: 'Shaded open veranda living space with tropical refreshments.',
            hotspots: [
              {
                pitch: -8,
                yaw: 35,
                label: 'Coconut Water & Juice Bar',
                description: 'Chilled local tender coconut and seasonal fruit smoothies.',
              },
            ],
          },
        ],
        model3d: {
          url: '/models/glamvelvetsofa.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=400&q=80',
          description: `${roomName} — Coastal Beach Villa 3D with sun-bleached ash floors, cyan ocean runner, and coastal lounge.`,
          themeStyle: 'COASTAL_SEAVIEW',
        },
      };

    case 'EXECUTIVE_SKYLINE':
      return {
        panoramas: [
          {
            url: '/panoramas/executive-skyline-360.jpg',
            sceneName: 'Skyline Business Penthouse',
            sceneId: 'executive-lounge',
            order: 1,
            description: 'Sleek metropolitan skyline suite with executive workstation and city panorama.',
            hotspots: [
              {
                pitch: 0,
                yaw: 15,
                label: 'Skyline Glass Windows',
                description: 'Floor-to-ceiling soundproof acoustic glass facing city skyscrapers.',
              },
              {
                pitch: -12,
                yaw: 85,
                label: 'Ergonomic Workstation',
                description: 'Designer glass work desk with high-speed WiFi and universal power ports.',
              },
              {
                pitch: -8,
                yaw: -60,
                label: 'Club Minibar & Espresso',
                description: 'Nespresso Vertuo coffee system and sommelier-curated refreshments.',
              },
            ],
          },
          {
            url: '/panoramas/suite-bedroom-360.jpg',
            sceneName: 'Executive Rest Quarters',
            sceneId: 'executive-bedroom',
            order: 2,
            description: 'Quiet master sleeping quarters designed for optimal restorative sleep.',
            hotspots: [
              {
                pitch: -6,
                yaw: 25,
                label: 'Memory Foam King Bed',
                description: 'Temperature-regulating plush mattress with blackout motorized shades.',
              },
            ],
          },
        ],
        model3d: {
          url: '/models/luxury-armchair.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80',
          description: `${roomName} — Modern Executive 3D Suite with charcoal slate walls, midnight sapphire runner, and work desk.`,
          themeStyle: 'EXECUTIVE_SKYLINE',
        },
      };

    case 'DELUXE_SIGNATURE':
    default:
      return {
        panoramas: [
          {
            url: '/panoramas/suite-bedroom-360.jpg',
            sceneName: 'Master King Bedroom',
            sceneId: 'master-bedroom',
            order: 1,
            description: 'Signature IndiStay luxury bedroom with king platform bed and ambient lighting.',
            hotspots: [
              {
                pitch: -6,
                yaw: 15,
                label: 'Plush King Platform Bed',
                description: 'Signature 400-thread count Egyptian cotton bedding with pillow menu.',
              },
              {
                pitch: 3,
                yaw: 120,
                label: 'Private Balcony Access',
                description: 'Glass terrace doors providing fresh air and garden views.',
              },
              {
                pitch: 0,
                yaw: -70,
                label: 'Reading & Vanity Nook',
                description: 'Warm halo reading lamps with USB-C bedside charging.',
              },
            ],
          },
          {
            url: '/panoramas/suite-lounge-360.jpg',
            sceneName: 'In-Room Executive Lounge',
            sceneId: 'room-lounge',
            order: 2,
            description: 'Spacious in-room relaxation lounge with plush armchair and cocktail table.',
            hotspots: [
              {
                pitch: -12,
                yaw: 40,
                label: 'Designer Lounge Seating',
                description: 'Custom handcrafted armchair for evening reading.',
              },
            ],
          },
        ],
        model3d: {
          url: '/models/luxury-armchair.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80',
          description: `${roomName} — Signature Deluxe 3D Suite with honey oak floors, IndiStay indigo runner, and designer armchair.`,
          themeStyle: 'DELUXE_SIGNATURE',
        },
      };
  }
}

async function seedVirtualTours() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.');

  const RoomType = mongoose.model(
    'RoomType',
    new mongoose.Schema(
      {
        name: String,
        panoramas: Array,
        model3d: Object,
      },
      { strict: false }
    )
  );

  const allRooms = await RoomType.find({});
  console.log(`Found ${allRooms.length} room types to customize.`);

  let counts = {
    ROYAL_PALACE: 0,
    ALPINE_MOUNTAIN: 0,
    COASTAL_SEAVIEW: 0,
    EXECUTIVE_SKYLINE: 0,
    DELUXE_SIGNATURE: 0,
  };

  for (const room of allRooms) {
    const category = categorizeRoom(room.name || '');
    counts[category as keyof typeof counts]++;

    const assets = getTourAssetsForCategory(category, room.name || 'Room');

    await RoomType.updateOne(
      { _id: room._id },
      {
        $set: {
          panoramas: assets.panoramas,
          model3d: assets.model3d,
        },
      }
    );
  }

  console.log('Successfully updated all rooms with distinctive 360° virtual tours & 3D models!');
  console.log('Distribution by Theme:');
  console.table(counts);

  await mongoose.disconnect();
  process.exit(0);
}

seedVirtualTours().catch((err) => {
  console.error('Error seeding virtual tours:', err);
  process.exit(1);
});
