import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);

  const superAdminEmail = (process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@indistay.com').toLowerCase().trim();
  const superAdminPassword = process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'IndiStayAdmin#2026!';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 12);

  let adminUser = await User.findOne({ email: superAdminEmail });

  if (!adminUser) {
    console.log(`Super admin ${superAdminEmail} not found, creating new...`);
    adminUser = await User.create({
      name: process.env.INITIAL_SUPER_ADMIN_NAME || 'IndiStay Super Administrator',
      email: superAdminEmail,
      passwordHash: superAdminHash,
      phone: process.env.INITIAL_SUPER_ADMIN_PHONE || '+919876543210',
      role: 'SUPER_ADMIN',
      accountStatus: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });
    console.log('Created super admin:', adminUser.email);
  } else {
    adminUser.passwordHash = superAdminHash;
    adminUser.role = 'SUPER_ADMIN';
    adminUser.accountStatus = 'ACTIVE';
    await adminUser.save();
    console.log(`Updated super admin (${adminUser.email}) password to: ${superAdminPassword}`);
  }

  const isMatch = await bcrypt.compare(superAdminPassword, adminUser.passwordHash);
  console.log(`Password verification test for ${superAdminEmail}:`, isMatch ? 'PASSED ✅' : 'FAILED ❌');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
