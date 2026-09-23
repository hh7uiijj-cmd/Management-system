require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');
const Member = require('./models/Member');
const { ROLE_TIER_LABELS } = require('./config/constants');
const roster = require('./data/members.json');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Role.deleteMany({});
  await User.deleteMany({});
  await Member.deleteMany({});

  const allPermissions = [
    'manage_events',
    'approve_registrations',
    'manage_users',
    'manage_roles',
    'export_csv',
  ];

  // 6 role tiers ตาม config/constants.js — role.name ต้องตรงกับ ROLE_TIERS ทุกตัวอักษร
  // เพราะ middleware/moduleAccess.js อ่านสิทธิ์ของโมดูลใหม่จาก role.name โดยตรง
  const adminRole = await Role.create({
    name: 'admin',
    displayName: ROLE_TIER_LABELS.admin,
    permissions: allPermissions,
  });
  const presidentRole = await Role.create({
    name: 'president',
    displayName: ROLE_TIER_LABELS.president,
    permissions: ['approve_registrations', 'export_csv'],
  });
  const vicePresidentRole = await Role.create({
    name: 'vice_president',
    displayName: ROLE_TIER_LABELS.vice_president,
    permissions: ['approve_registrations', 'export_csv'],
  });
  const headRole = await Role.create({
    name: 'head',
    displayName: ROLE_TIER_LABELS.head,
    permissions: ['manage_events', 'approve_registrations', 'export_csv'],
  });
  const secretaryRole = await Role.create({
    name: 'secretary',
    displayName: ROLE_TIER_LABELS.secretary,
    permissions: ['manage_events', 'approve_registrations', 'export_csv'],
  });
  await Role.create({
    name: 'member',
    displayName: ROLE_TIER_LABELS.member,
    permissions: [],
  });

  // ผู้ดูแลระบบ (มองเห็นทุกฝ่าย ไม่ต้องระบุ department)
  await User.create({
    name: 'Admin',
    email: 'daocha',
    password: 'ChaDao',
    role: adminRole._id,
  });

  // รายชื่อสมาชิกจริงจากไฟล์ FT20 Control Center (backend/data/members.json)
  // อีเมล/รหัสผ่านของแต่ละคน: u67110110553<รหัส 3 หลัก>@gmail.com / <รหัส 3 หลัก>
  const memberRole = await Role.findOne({ name: 'member' });
  const roleByTier = {
    president: presidentRole,
    vice_president: vicePresidentRole,
    head: headRole,
    secretary: secretaryRole,
    member: memberRole,
  };

  for (const person of roster) {
    const memberDoc = await Member.create({
      name: person.name,
      department: person.department,
      position: person.position,
    });

    await User.create({
      name: person.name,
      email: person.email,
      password: person.password,
      role: roleByTier[person.role]._id,
      department: person.department,
      member: memberDoc._id,
    });
  }

  console.log('Seed completed!');
  console.log('Admin login: DaoCha / ChaDao');
  console.log(`สมาชิกทั้งหมด ${roster.length} คน — login ด้วย u67110110553<รหัส 3 หลัก>@gmail.com / <รหัส 3 หลัก>`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
