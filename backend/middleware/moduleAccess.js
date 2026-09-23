// สิทธิ์การเข้าถึงโมดูลใหม่ (T/D/L/R/B/RI/E/M/U/A) — บังคับที่ server ทั้งหมด ห้าม client ตัดสินใจเอง
//
// ADMIN                        — ทุกฝ่าย ทุก action ทำได้ทุกอย่าง
// PRESIDENT / VICE_PRESIDENT   — ทุกฝ่าย ทุก action ทำได้ทุกอย่าง (เหมือน admin แต่ไม่ใช่ admin role)
// HEAD / SECRETARY             — ฝ่ายตัวเอง: create/edit/delete/approve/export ได้ทุกอย่าง, ฝ่ายอื่น: ดูได้อย่างเดียว
// MEMBER                       — ดูได้เฉพาะรายการในฝ่ายตัวเอง, เพิ่ม/แก้ไข/ลบได้เฉพาะของตัวเองเท่านั้น

const roleOf = (req) => req.user?.role?.name || null;

const TOP_TIERS = ['president', 'vice_president'];
const DEPT_LEADS = ['head', 'secretary'];

// ตรวจสอบว่าผู้ใช้ทำ action นี้ในระดับ "ประเภท route" ได้หรือไม่ (ยังไม่รู้จัก document เป้าหมาย)
// action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
const moduleAccess = (action) => (req, res, next) => {
  const role = roleOf(req);

  if (role === 'admin') return next();

  if (TOP_TIERS.includes(role)) return next();

  if (DEPT_LEADS.includes(role)) return next(); // ต้องเช็คขอบเขตฝ่ายเพิ่มเติมด้วย canAccessDoc/departmentFilter

  if (role === 'member') {
    if (action === 'approve') {
      return res.status(403).json({ message: 'สมาชิกไม่มีสิทธิ์อนุมัติ' });
    }
    return next(); // view จะถูกกรองด้วย departmentFilter, create/edit/delete จะถูกเช็ค ownership ด้วย canAccessDoc
  }

  return res.status(403).json({ message: 'ไม่พบสิทธิ์การเข้าถึง' });
};

// เงื่อนไข filter สำหรับ list/query ตามฝ่าย
const departmentFilter = (req) => {
  const role = roleOf(req);
  if (role === 'admin' || TOP_TIERS.includes(role)) return {};
  return { department: req.user.department };
};

// เช็คสิทธิ์ระดับเอกสารเดี่ยว (สำหรับ edit/delete หรือดูรายละเอียด)
// ownerField: ชื่อ field ที่เก็บผู้สร้าง/เจ้าของ document (ค่าเริ่มต้น createdBy)
const canAccessDoc = (req, doc, { ownerField = 'createdBy', action = 'view' } = {}) => {
  const role = roleOf(req);
  if (role === 'admin') return true;

  if (TOP_TIERS.includes(role)) return true;

  if (DEPT_LEADS.includes(role)) {
    return doc.department === req.user.department;
  }

  if (role === 'member') {
    if (doc.department !== req.user.department) return false;
    if (action === 'view') return true;
    const ownerId = doc[ownerField];
    return ownerId && String(ownerId) === String(req.user._id);
  }

  return false;
};

module.exports = { moduleAccess, departmentFilter, canAccessDoc };
