# คำแนะนำสำหรับ Claude เมื่อแก้ไขโปรเจกต์นี้

โปรเจกต์นี้คือ "FT20 Control Center" ระบบจัดการโครงการแฟนพันธุ์แท้จิตวิทยา ครั้งที่ 20
- Backend: Express + Mongoose (MongoDB Atlas) ที่ `backend/`
- Frontend: React + Vite + Tailwind ที่ `frontend/`
- Branch หลักที่ทำงาน: `claude/vibrant-feynman-25k9f9`
- Sandbox นี้เชื่อมต่อ MongoDB Atlas และ Firebase ของผู้ใช้ไม่ได้ (ไม่มี network path) — สคริปต์ที่แก้/ย้ายข้อมูลในฐานข้อมูลต้อง commit+push แล้วให้ผู้ใช้รันเองที่เครื่อง Windows ของเขา (ให้คำสั่ง PowerShell ทีละขั้นเสมอ: `cd` ไปที่ repo → `git pull origin claude/vibrant-feynman-25k9f9` → `cd backend` → `npm run <script>`)

## กฎสำคัญ: การแก้ไข Mongoose schema ที่มีข้อมูลอยู่แล้ว

**ห้ามเปลี่ยนชื่อฟิลด์ หรือเปลี่ยนรูปแบบฟิลด์ (เช่น scalar → array, restructure object) ใน schema ที่มีข้อมูลจริงอยู่แล้วในฐานข้อมูล โดยไม่เขียน migration script คู่กันเสมอ**

เหตุผล: MongoDB ไม่มี schema บังคับจริง การเปลี่ยน schema ใน Mongoose model ไม่ไปแก้ document ที่มีอยู่แล้วในฐานข้อมูล — ข้อมูลเดิมยังอยู่ แต่ field เดิมจะ "มองไม่เห็น" ผ่าน query ของ Model ใหม่ ทำให้ดูเหมือนข้อมูลหายไป (แต่จริง ๆ ไม่ได้ลบ) เคสนี้เคยเกิดขึ้นแล้วกับ `TaskMaster.submissions` (เปลี่ยนจาก `submissionLink/submissionText/submittedBy/submittedAt` เป็น array) ทำให้งานที่ส่งไว้ก่อนหน้าดูเหมือนหายไปจากหน้า UI

**ทุกครั้งที่จะเปลี่ยนโครงสร้างฟิลด์ใน model ที่มีข้อมูลอยู่แล้ว (ไม่ใช่ model ใหม่ที่ยังไม่มีข้อมูลจริง) ให้ทำดังนี้:**
1. ก่อนแก้ ให้เช็คว่า field/model นั้นมีข้อมูลจริงของผู้ใช้อยู่แล้วหรือยัง (เช่น TaskMaster, MasterTaskItem ที่ import ไปแล้ว, Budget, RiskIssue, Evidence, Document, Letter, Member, User)
2. ถ้ามี ให้เขียน migration script คู่กันไปด้วยเสมอ (ใช้ raw collection accessor `Model.collection.find/updateOne` เพื่ออ่าน/เขียนฟิลด์เดิมที่ schema ใหม่ไม่รู้จักแล้ว) โดย script ต้อง:
   - รันซ้ำได้โดยปลอดภัย (idempotent)
   - ไม่ลบข้อมูลทิ้งจนกว่าจะย้ายไปฟิลด์ใหม่สำเร็จแล้ว
   - commit+push พร้อมกับ schema change ในคอมมิตเดียวกัน หรือคอมมิตที่ใกล้กันมาก ไม่ปล่อยให้ schema เปลี่ยนไปก่อนแล้วไม่มี migration ตามมา
3. แจ้งผู้ใช้ทุกครั้งเมื่อมีการเปลี่ยนแปลงแบบนี้เกิดขึ้น พร้อมอธิบายว่ามี migration script ต้องรันหรือไม่ และให้คำสั่งรันแบบ step-by-step เหมือนสคริปต์อื่น ๆ ในโปรเจกต์

ก่อนส่งงาน/ตอบว่า "เสร็จแล้ว" ทุกครั้งที่มีการแก้ schema ให้ตรวจสอบตามข้อนี้ก่อน แล้วค่อยแจ้งผู้ใช้สรุปว่ามีผลกระทบต่อข้อมูลเดิมหรือไม่
