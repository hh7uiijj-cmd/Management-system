const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  permissions: {
    type: [String],
    enum: [
      'manage_events',
      'approve_registrations',
      'manage_users',
      'manage_roles',
      'export_csv',
    ],
    default: [],
  },
  // ระดับสิทธิ์คงที่ที่ใช้กับโมดูลใหม่ (T/D/L/R/B/RI/E/M/U/A) ต้องตรงกับ ROLE_TIERS ใน config/constants.js
  // ค่านี้ผูกกับ role.name โดยตรง เพื่อให้ middleware/moduleAccess.js ตรวจสอบสิทธิ์ได้
});

module.exports = mongoose.model('Role', roleSchema);
