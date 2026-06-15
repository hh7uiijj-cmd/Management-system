require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Role.deleteMany({});
  await User.deleteMany({});

  const allPermissions = [
    'manage_events',
    'approve_registrations',
    'manage_users',
    'manage_roles',
    'export_csv',
  ];

  const adminRole = await Role.create({
    name: 'admin',
    displayName: 'ผู้ดูแลระบบ',
    permissions: allPermissions,
  });

  await Role.create({
    name: 'head',
    displayName: 'หัวหน้าฝ่าย',
    permissions: ['manage_events', 'approve_registrations', 'export_csv'],
  });

  await Role.create({
    name: 'member',
    displayName: 'สมาชิก',
    permissions: [],
  });

  await User.create({
    name: 'Admin',
    email: 'admin@system.com',
    password: 'admin1234',
    role: adminRole._id,
  });

  console.log('Seed completed!');
  console.log('Admin login: admin@system.com / admin1234');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
