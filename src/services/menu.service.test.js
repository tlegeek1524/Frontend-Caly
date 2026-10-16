import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyNutrition } from './menu.service.js';

test('calculateDailyNutrition - Before eating photo only', () => {
  const foodRecords = [
    { id: 1, menu: 'ข้าวกะเพราไก่ไข่ดาว', cal: 550, protein: 25, carb: 60, fat: 20 },
    { id: 2, menu: 'ชานมไข่มุก', cal: 300, protein: 2, carb: 50, fat: 10 }
  ];
  const foodAfterRecords = [];

  const result = calculateDailyNutrition(foodRecords, foodAfterRecords);

  // ควรดึงค่าเต็มมาแสดงทันที
  assert.equal(result.totalCal, 850);
  assert.equal(result.totalProtein, 27);
  assert.equal(result.totalCarb, 110);
  assert.equal(result.totalFat, 30);
});

test('calculateDailyNutrition - After compare with cal field (partially eaten)', () => {
  const foodRecords = [
    { id: 1, menu: 'ข้าวกะเพราไก่ไข่ดาว', cal: 550, protein: 25, carb: 60, fat: 20 },
    { id: 2, menu: 'ชานมไข่มุก', cal: 300, protein: 2, carb: 50, fat: 10 }
  ];
  // มื้อที่ 1 ทานเหลือ หักลบเหลือ 350 kcal
  const foodAfterRecords = [
    { food_menu_id: 1, cal: 350, protein: 18, carb: 40, fat: 12 }
  ];

  const result = calculateDailyNutrition(foodRecords, foodAfterRecords);

  // มื้อ 1 = 350, มื้อ 2 = 300 -> รวม 650
  assert.equal(result.totalCal, 650);
  assert.equal(result.totalProtein, 20); // 18 + 2
  assert.equal(result.totalCarb, 90);    // 40 + 50
  assert.equal(result.totalFat, 22);     // 12 + 10
});

test('calculateDailyNutrition - After compare with eat_percent field', () => {
  const foodRecords = [
    { id: 1, menu: 'สเต็กไก่', cal: 400, protein: 40, carb: 10, fat: 15 }
  ];
  // ทานไป 50%
  const foodAfterRecords = [
    { food_menu_id: 1, eat_percent: 50 }
  ];

  const result = calculateDailyNutrition(foodRecords, foodAfterRecords);

  // 400 * 50% = 200 kcal
  assert.equal(result.totalCal, 200);
  assert.equal(result.totalProtein, 20);
  assert.equal(result.totalCarb, 5);
  assert.equal(result.totalFat, 8); // Math.round(7.5) = 8
});

test('calculateDailyNutrition - Empty or null inputs', () => {
  assert.deepEqual(calculateDailyNutrition([], []), {
    totalCal: 0,
    totalProtein: 0,
    totalCarb: 0,
    totalFat: 0
  });

  assert.deepEqual(calculateDailyNutrition(null, null), {
    totalCal: 0,
    totalProtein: 0,
    totalCarb: 0,
    totalFat: 0
  });
});
