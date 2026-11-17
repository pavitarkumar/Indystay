import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const samplePanoramas = [
  {
    url: '/panoramas/suite-bedroom-360.jpg',
    sceneName: 'Master Bedroom & Suite',
    sceneId: 'bedroom',
    order: 1,
    description: 'Spacious master bedroom with ambient lighting, king bed, and private view.',
    hotspots: [
      {
        pitch: -8,
        yaw: 35,
        label: 'King Bed & Ambient Headboard',
        description: 'Plush king mattress with 400-thread-count Egyptian cotton linens.',
      },
      {
        pitch: 5,
        yaw: 120,
        label: 'Ensuite Marble Bath',
        description: 'Italian marble bathroom with rain shower and soaking tub.',
      },
      {
        pitch: 0,
        yaw: -75,
        label: 'Private Terrace & Balcony',
        description: 'Floor-to-ceiling glass doors opening onto the scenic balcony.',
      },
    ],
  },
  {
    url: '/panoramas/suite-lounge-360.jpg',
    sceneName: 'Executive Living Lounge',
    sceneId: 'lounge',
    order: 2,
    description: 'Dedicated in-suite living room and study with ergonomic workstation.',
    hotspots: [
      {
        pitch: -15,
        yaw: 40,
        label: 'Designer Velvet Armchair',
        description: 'Custom handcrafted armchair for relaxed reading.',
      },
      {
        pitch: 2,
        yaw: -85,
        label: 'Espresso Bar & Minibar',
        description: 'Complimentary artisan roast coffee and premium refreshments.',
      },
    ],
  },
];

const sampleModel3d = {
  url: '/models/luxury-armchair.glb',
  thumbnailUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80',
  description: 'Interactive 3D model of suite furniture & layout. Drag to rotate, scroll to zoom, right-drag to pan.',
};

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
        panoramas: Array,
        model3d: Object,
      },
      { strict: false }
    )
  );

  const result = await RoomType.updateMany(
    {},
    {
      $set: {
        panoramas: samplePanoramas,
        model3d: sampleModel3d,
      },
    }
  );

  console.log(`Updated ${result.modifiedCount} room types with 360° virtual tour and 3D model assets!`);

  const updatedCount = await RoomType.countDocuments({ 'panoramas.0': { $exists: true } });
  console.log(`Total room types now with 360° panoramas: ${updatedCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

seedVirtualTours().catch((err) => {
  console.error('Error seeding virtual tours:', err);
  process.exit(1);
});
