# Change Log & Code Editing Rules

ไฟล์นี้จัดทำขึ้นเพื่อบันทึกประวัติการแก้ไขโค้ดทุกครั้ง ป้องกันการทำงานซ้ำซ้อน การแก้ไขข้ามขั้นตอน และการเกิดบั๊กซ้ำซากที่หาสาเหตุไม่ได้

---

## 📋 กฎเหล็กในการแก้ไขโค้ด (Editing Rules)

1. **Step-by-Step Execution (ห้ามข้ามขั้นตอน)**
   - ต้องตรวจสอบโค้ดจริงในไฟล์ก่อนลงมือแก้ไขเสมอ
   - แจ้งขอบเขตและไฟล์ที่จะแก้ไขให้ชัดเจน
   - เมื่อทำการแก้ไขโค้ดเสร็จแล้ว ต้องบันทึกรายการลงใน `change-log.md` ทันที

2. **Accurate Scope & No Unrelated Changes**
   - แก้ไขเฉพาะจุดที่ได้รับมอบหมายเท่านั้น ไม่ Refactor โค้ดส่วนอื่นโดยไม่จำเป็น
   - คง Comments, Docstrings และ Business Logic เดิมที่ไม่เกี่ยวข้องไว้เสมอ

3. **Verification Before Complete**
   - รัน Type Check / Build Check ทุกครั้งหลังแก้โค้ดเพื่อยืนยันว่าไม่มี Error หลุดรอด

---

## 📝 ประวัติการแก้ไข (Change History)

### [2026-11-11] - Minimal Text-Color Highlight for Exceeded Calories
- **Modified File**:
  - `src/page/user/dashboard/foodmenu.jsx`:
    - ปรับรูปแบบการ์ดสรุปรวมสารอาหารกลับมาเป็น Clean Card สไตล์เดิม (`bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs`)
    - ใส่สีเฉพาะ Text Color ของตัวเลขแคลอรี่ (`totalCal` เป็น `text-rose-600` เมื่อเกินค่าที่กำหนด, หรือ `text-slate-900` เมื่อปกติ) โดยไม่เปลี่ยนสีพื้นหลังหรือกรอบของการ์ด
- **Verification**: รัน `npm run build` สำเร็จเรียบร้อย ไม่พบ Error

### [2026-11-11] - Highlight Exceeded Calories in FoodMenu Summary Card
- **Modified File**:
  - `src/page/user/dashboard/foodmenu.jsx`:
    - เชื่อมต่อ `fetchUserTDEE` เพื่อดึงค่าเป้าหมายแคลอรี่ประจำวันของผู้ใช้ (`userTDEE`)
    - เพิ่ม logic ตรวจจับกรณีแคลอรี่รวมเกินเป้าหมาย (`totalCal > userTDEE`)
    - ใส่สีเตือน (Rose Tone: `text-rose-600`, ขอบ `border-rose-200/80`, พื้นหลังอ่อน `bg-rose-50/50`) และข้อความ "kcal เกินเป้า" พร้อม Badge แสดงเป้าหมายแคลอรี่บนการ์ดสรุปรวมสารอาหาร
- **Verification**: รัน `npm run build` สำเร็จเรียบร้อย ไม่พบ Error

### [2026-11-11] - Relocate Nutrition Summary to Top in FoodMenu Page
- **Modified File**:
  - `src/page/user/dashboard/foodmenu.jsx`:
    - ย้ายการ์ด "สรุปรวมสารอาหาร" (kcal รวม, โปรตีน, คาร์บ, ไขมัน) ขึ้นไปอยู่ด้านบน ใต้หัวข้อ "รายการอาหารวันที่ [date]"
    - นำการ์ดสรุปสารอาหารเดิมที่อยู่ด้านล่างสุดของหน้ารายการอาหารออก เพื่อไม่ให้แสดงซ้ำซ้อน
- **Verification**: รัน `npm run build` สำเร็จเรียบร้อย ไม่พบ Error

### [2026-11-11] - Revert FoodMenu Page to Clean Craft Design
- **Modified File**:
  - `src/page/user/dashboard/foodmenu.jsx`:
    - ยกเลิก AI Slop ทั้งหมด (ลบแสงนีออนเบลอ, พื้นหลังม่วงดำ, อิโมจิเกินจำเป็น, และ Hype words)
    - นำดีไซน์ Clean Craft เดิมกลับคืนมา: พื้นหลังสีสว่างสะอาดตา `bg-slate-50`, การ์ดสีขาวขอบบาง `border-slate-100/80`, อ่านง่าย ไม่รกตา
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Transform FoodMenu Page into Ultra AI Slop Edition (Demo)
- **Modified File**:
  - `src/page/user/dashboard/foodmenu.jsx`: ทดสอบสไตล์ Slop ตามคำขอ
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Remove Sub-badge Above Main Headline
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ตัด Pill Badge เหนือหัวข้อหลักออก
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Remove Badge and Feature Bullets from LineLogin Page
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ตัด Badge ส่วนหัว และ Bullets ด้านล่างคำอธิบายออก
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Light Clean Theme with Real Food Imagery for LineLogin
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ปรับธีมเป็นโทนขาวสว่าง สะอาดตา ผสานภาพถ่ายอาหารจริง
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Cinematic Hero Imagery & Wow Factor for LineLogin
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ปรับดีไซน์ภาพอาหารจริง
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Unslop LineLogin Page Design
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ปรับแต่งความเรียบง่าย
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Fixed Viewport No-Scroll Mobile UI for LineLogin
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ล็อคหน้าจอไม่ให้เลื่อนบน Mobile
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Full-screen Responsive Redesign for LineLogin Page
- **Modified File**:
  - `src/page/auth/linelogin.jsx`: ปรับ Layout เต็มจอ
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Set Global Font to Kanit
- **Modified Files**:
  - `index.html`: อัปเดต Google Fonts เพิ่มฟอนต์ `Kanit`
  - `src/index.css`: กำหนด `font-family: 'Kanit'` ทั่วทั้งระบบ
  - `src/context/AppContext.tsx`: กำหนด `fontFamily: '"Kanit"'` ใน Ant Design
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Unslop UI for UnrecognizedFoodModal
- **Modified Files**:
  - `src/components/UnrecognizedFoodModal/UnrecognizedFoodModal.tsx`: ปรับ UI เป็น Ant Design Clean Pattern
  - `src/components/UnrecognizedFoodModal/UnrecognizedFoodModal.css`: ลดทอน CSS ส่วนเกิน
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Extract UnrecognizedFoodModal Component & Helper
- **New Files**:
  - `src/components/UnrecognizedFoodModal/UnrecognizedFoodModal.tsx`
  - `src/components/UnrecognizedFoodModal/UnrecognizedFoodModal.css`
- **Modified Files**:
  - `src/services/aiFoodAnalysis.service.ts`
  - `src/page/user/dashboard/foodmenu.jsx`
  - `src/page/user/dashboard/maindashboard.jsx`
- **Verification**: รัน `npm run build` ผ่าน 100%

### [2026-11-11] - Food Recognition Check & Warning Modal
- **Modified Files**:
  - `src/services/aiFoodAnalysis.service.ts`: ปรับ Prompt ให้ระบุ `isFood: true/false`
  - `src/page/user/dashboard/foodmenu.jsx`: ดักจับภาพที่ไม่ใช่อาหาร
  - `src/page/user/dashboard/maindashboard.jsx`: ดักจับภาพที่ไม่ใช่อาหาร
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Replace window.alert with Ant Design message Notification
- **Modified Files**:
  - `src/page/user/dashboard/foodmenu.jsx`: แทนที่ `window.alert` ด้วย `message.success`
  - `src/page/user/dashboard/maindashboard.jsx`: แทนที่ `window.alert` ด้วย `message.success`
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Connect Backend Upload Endpoint (`POST /upload` or `POST /api/upload`)
- **Modified File**:
  - `src/services/imageStorage.service.ts`: เชื่อมต่อ endpoint `POST /upload`
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [2026-11-11] - Separation of Services & Image AI Optimization
- **New Files**:
  - `src/utils/imageCompressor.ts`
  - `src/services/aiFoodAnalysis.service.ts`
  - `src/services/imageStorage.service.ts`
- **Modified Files**:
  - `src/page/user/dashboard/foodmenu.jsx`
  - `src/page/user/dashboard/maindashboard.jsx`
- **Verification**: รัน `npm run build` สำเร็จ 100%

### [Initial Setup] - 2026-11-11
- **File**: `change-log.md`
- **Action**: สร้างไฟล์บันทึกประวัติและกฎเกณฑ์การแก้ไขโค้ด
- **Reason**: ควบคุมการแก้ไขโค้ดให้เป็นระบบ ป้องกันการทำงานข้ามขั้นตอนและลดปัญหาบั๊กซ้ำซาก
