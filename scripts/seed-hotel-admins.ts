import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../src/lib/db/connection';
import { User } from '../src/models/User';
import { Hotel } from '../src/models/Hotel';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DEFAULT_ADMIN_PASSWORD = 'HotelAdmin#2026!';

// Realistic hotel admin managers mapped to Indian cities/properties
const CITY_ADMIN_PROFILES: Record<string, { name: string; emailPrefix: string; phone: string }> = {
  Goa: { name: 'Vikramaditya Silva', emailPrefix: 'goa.admin', phone: '+919822123401' },
  Jaipur: { name: 'Maharaj Singh Rathore', emailPrefix: 'jaipur.admin', phone: '+919829012345' },
  Mumbai: { name: 'Pooja Mehta', emailPrefix: 'mumbai.admin', phone: '+919820054321' },
  Delhi: { name: 'Rajesh Khanna', emailPrefix: 'delhi.admin', phone: '+919811098765' },
  Udaipur: { name: 'Ranveer Singh Sisodia', emailPrefix: 'udaipur.admin', phone: '+919829987654' },
  Bengaluru: { name: 'Karthik Venkat', emailPrefix: 'bengaluru.admin', phone: '+919845012345' },
  Varanasi: { name: 'Amit Kumar Tripathi', emailPrefix: 'varanasi.admin', phone: '+919415098765' },
  Kochi: { name: 'George Varghese', emailPrefix: 'kochi.admin', phone: '+919847054321' },
  Agra: { name: 'Farhan Qureshi', emailPrefix: 'agra.admin', phone: '+919837012345' },
  Hyderabad: { name: 'Mir Osman Ali', emailPrefix: 'hyderabad.admin', phone: '+919849098765' },
  Kolkata: { name: 'Subhash Banerjee', emailPrefix: 'kolkata.admin', phone: '+919830054321' },
  Chennai: { name: 'Sundar Raman', emailPrefix: 'chennai.admin', phone: '+919840012345' },
  Rishikesh: { name: 'Swami Anand Joshi', emailPrefix: 'rishikesh.admin', phone: '+919412098765' },
  Amritsar: { name: 'Gurpreet Singh Sodhi', emailPrefix: 'amritsar.admin', phone: '+919814054321' },
  Munnar: { name: 'Mathew Thomas', emailPrefix: 'munnar.admin', phone: '+919846012345' },
  Ooty: { name: 'David Wellington', emailPrefix: 'ooty.admin', phone: '+919842098765' },
  Shimla: { name: 'Devendra Sharma', emailPrefix: 'shimla.admin', phone: '+919816054321' },
  Darjeeling: { name: 'Pemba Norbu Sherpa', emailPrefix: 'darjeeling.admin', phone: '+919832012345' },
  Jodhpur: { name: 'Gajendra Bhati', emailPrefix: 'jodhpur.admin', phone: '+919829054321' },
  Pondicherry: { name: 'Pierre Dupont', emailPrefix: 'pondicherry.admin', phone: '+919443012345' },
  Alleppey: { name: 'Saji Kumar Pillai', emailPrefix: 'alleppey.admin', phone: '+919847098765' },
  Mussoorie: { name: 'Sanjay Rawat', emailPrefix: 'mussoorie.admin', phone: '+919412054321' },
  Pune: { name: 'Nikhil Kulkarni', emailPrefix: 'pune.admin', phone: '+919822012345' },
  Ahmedabad: { name: 'Jignesh Patel', emailPrefix: 'ahmedabad.admin', phone: '+919825098765' },
  Lucknow: { name: 'Nawab Kazim Ali', emailPrefix: 'lucknow.admin', phone: '+919415054321' },
  Manali: { name: 'Ananya Deshmukh', emailPrefix: 'manali.admin', phone: '+919816012345' },
};

async function seedHotelAdmins() {
  await connectToDatabase();
  console.log('Connected to MongoDB. Creating/updating dedicated Hotel Admins for all 26 hotels...');

  const hotels = await Hotel.find({}).sort({ city: 1, name: 1 });
  console.log(`Found ${hotels.length} hotels in database.`);

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  let assignedCount = 0;

  for (const hotel of hotels) {
    const profile = CITY_ADMIN_PROFILES[hotel.city] || {
      name: `${hotel.city} Property Manager`,
      emailPrefix: `${hotel.city.toLowerCase().replace(/[^a-z0-9]/g, '')}.admin`,
      phone: '+919800000000',
    };

    const email = `${profile.emailPrefix}@indistay.com`.toLowerCase().trim();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name,
        email,
        passwordHash,
        phone: profile.phone,
        role: 'HOTEL_ADMIN',
        accountStatus: 'ACTIVE',
        assignedHotelId: hotel._id,
        emailVerifiedAt: new Date(),
      });
      console.log(`[Created Admin] ${profile.name} (${email}) for "${hotel.name}" in ${hotel.city}`);
    } else {
      user.name = profile.name;
      user.passwordHash = passwordHash;
      user.role = 'HOTEL_ADMIN';
      user.accountStatus = 'ACTIVE';
      user.assignedHotelId = hotel._id;
      user.phone = profile.phone;
      await user.save();
      console.log(`[Updated Admin] ${profile.name} (${email}) linked to "${hotel.name}"`);
    }

    // Link hotel to this admin
    hotel.ownerUserId = user._id;
    if (!hotel.adminUserIds.some((id) => id.toString() === user!._id.toString())) {
      hotel.adminUserIds.push(user._id);
    }
    await hotel.save();
    assignedCount++;
  }

  console.log(`\n🎉 SUCCESS! All ${assignedCount} hotels now have dedicated HOTEL_ADMIN accounts!`);
  console.log(`Default Password for all Hotel Admins: "${DEFAULT_ADMIN_PASSWORD}"`);
  process.exit(0);
}

seedHotelAdmins().catch((err) => {
  console.error('Failed to seed hotel admins:', err);
  process.exit(1);
});
