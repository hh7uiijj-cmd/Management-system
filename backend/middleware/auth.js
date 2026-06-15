const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'ไม่มี token การยืนยันตัวตน' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'ผู้ใช้ไม่พบในระบบ' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token หมดอายุแล้ว' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
};

module.exports = auth;
