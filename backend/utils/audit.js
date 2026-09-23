const AuditLog = require('../models/AuditLog');

// AUDIT_LOG (A) เพิ่มได้อย่างเดียว — เรียกใช้หลังทุก create/update/delete/approve/export ของโมดูลอื่น
const logAudit = async ({ req, module, action, entityId = null, department = null, summary = '' }) => {
  try {
    await AuditLog.create({
      module,
      action,
      entityId,
      department,
      performedBy: req.user._id,
      summary,
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = { logAudit };
