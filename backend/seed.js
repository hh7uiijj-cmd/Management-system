require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');
const Member = require('./models/Member');
const { DEPARTMENTS, ROLE_TIER_LABELS } = require('./config/constants');

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
    email: 'admin@system.com',
    password: 'admin1234',
    role: adminRole._id,
  });

  // ประธานโครงการ / รองประธาน (มองเห็นทุกฝ่าย)
  await User.create({
    name: 'ประธานโครงการ',
    email: 'president@system.com',
    password: 'president1234',
    role: presidentRole._id,
  });
  await User.create({
    name: 'รองประธานโครงการ',
    email: 'vicepresident@system.com',
    password: 'vp1234567',
    role: vicePresidentRole._id,
  });

  // ตัวอย่างหัวหน้าฝ่าย + เลขาฝ่าย + สมาชิก ให้ครบทั้ง 7 ฝ่าย เพื่อทดสอบสิทธิ์
  const deptSlug = (name, i) => `dept${i}`;
  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const dept = DEPARTMENTS[i];
    const slug = deptSlug(dept, i + 1);

    await Member.create({ name: `หัวหน้าฝ่าย ${i + 1}`, department: dept, position: 'หัวหน้าฝ่าย' });
    await Member.create({ name: `เลขาฝ่าย ${i + 1}`, department: dept, position: 'เลขาฝ่าย' });
    await Member.create({ name: `สมาชิกฝ่าย ${i + 1}`, department: dept, position: 'สมาชิก' });

    await User.create({
      name: `หัวหน้าฝ่าย ${i + 1}`,
      email: `head${slug}@system.com`,
      password: 'head1234',
      role: headRole._id,
      department: dept,
    });
    await User.create({
      name: `เลขาฝ่าย ${i + 1}`,
      email: `secretary${slug}@system.com`,
      password: 'secretary1234',
      role: secretaryRole._id,
      department: dept,
    });
    await User.create({
      name: `สมาชิกฝ่าย ${i + 1}`,
      email: `member${slug}@system.com`,
      password: 'member1234',
      role: (await Role.findOne({ name: 'member' }))._id,
      department: dept,
    });
  }

  console.log('Seed completed!');
  console.log('Admin login: admin@system.com / admin1234');
  console.log('President login: president@system.com / president1234');
  console.log('Vice President login: vicepresident@system.com / vp1234567');
  console.log('ตัวอย่างหัวหน้าฝ่าย/เลขา/สมาชิก: head/secretary/member + dept1..dept7 @system.com (เช่น headdept1@system.com / head1234)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
