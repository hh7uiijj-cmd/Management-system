const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }

    const userPermissions = req.user.role?.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        message: `คุณไม่มีสิทธิ์ในการดำเนินการนี้ (ต้องการสิทธิ์: ${permission})`,
      });
    }

    next();
  };
};

module.exports = checkPermission;
