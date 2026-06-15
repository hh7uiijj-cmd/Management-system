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
});

module.exports = mongoose.model('Role', roleSchema);
