import OpenAI from "openai";
import { compressImage, fileToBase64 } from "../utils/imageCompressor";

export type FoodCompareItem = {
  menu: string;
  cal: number;
  protein: number;
  carb: number;
  fat: number;
  image?: string;
  image_url?: string;
};

export type FoodCompareResult = {
  isSameMeal: boolean;
  mismatchReason?: string;
  percentEaten: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  carbConsumed: number;
  fatConsumed: number;
  analysis: string;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clampPercent = (value: unknown): number => {
  const num = Math.round(toSafeNumber(value, 0));
  return Math.max(0, Math.min(100, num));
};

const resolveBeforeImage = async (imageSource: string): Promise<string> => {
  if (!imageSource.startsWith("http")) {
    return imageSource;
  }

  try {
    const response = await fetch(imageSource);
    if (!response.ok) {
      return imageSource;
    }

    const blob = await response.blob();
    const file = new File([blob], "before-food.jpg", {
      type: blob.type || "image/jpeg",
    });
    const compressed = await compressImage(file, 0.35, 896);
    return await fileToBase64(compressed);
  } catch {
    return imageSource;
  }
};

export const compareFoodAfterEating = async (
  beforeItem: FoodCompareItem,
  afterImageFile: File
): Promise<FoodCompareResult> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("ไม่พบ VITE_OPENAI_API_KEY ในระบบ");
  }

  const rawBeforeImage = beforeItem.image || beforeItem.image_url;
  if (!rawBeforeImage) {
    throw new Error("ไม่พบรูปภาพอาหารก่อนกิน");
  }

  const [beforeImageForAi, optimizedAfterFile] = await Promise.all([
    resolveBeforeImage(rawBeforeImage),
    compressImage(afterImageFile, 0.35, 896),
  ]);

  const afterImageBase64 = await fileToBase64(optimizedAfterFile);

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const prompt = `เปรียบเทียบรูปอาหาร 2 รูป:

รูปที่ 1 (ก่อนกิน): อาหารจานเต็ม
รูปที่ 2 (หลังกิน): อาหารที่เหลือในจาน

ข้อมูลอาหารเดิม:
- เมนู: ${beforeItem.menu}
- แคลอรี่: ${beforeItem.cal} kcal
- โปรตีน: ${beforeItem.protein} g
- คาร์โบไฮเดรต: ${beforeItem.carb} g
- ไขมัน: ${beforeItem.fat} g

วิเคราะห์และส่งข้อมูลกลับมาในรูปแบบ JSON เท่านั้น:
1. ตรวจสอบก่อนว่ารูปที่ 2 (หลังกิน) เป็นอาหารมื้อเดียวกัน/จานเดียวกัน/ประเภทเดียวกันกับรูปที่ 1 (ก่อนกิน) หรือไม่ (เช่น ถ้าก่อนกินเป็นขนม แต่หลังกินเป็นข้าวผัด หรือเป็นคนละเมนูอย่างชัดเจน ให้ใส่ isSameMeal: false)
2. ถ้าเป็นจานเดียวกัน ให้ประเมินเปอร์เซ็นต์ที่กินไป (0-100)

{
  "isSameMeal": true หรือ false,
  "mismatchReason": "เหตุผลสั้นๆ ภาษาไทยกรณี isSameMeal เป็น false (ถ้า true ให้ใส่ค่าว่าง)",
  "percentEaten": เปอร์เซ็นต์ที่กินไป (0-100, ตัวเลข),
  "caloriesConsumed": แคลอรี่ที่กินไปจริง (ตัวเลข),
  "proteinConsumed": โปรตีนที่กินไป (กรัม, ตัวเลข),
  "carbConsumed": คาร์โบไฮเดรตที่กินไป (กรัม, ตัวเลข),
  "fatConsumed": ไขมันที่กินไป (กรัม, ตัวเลข),
  "analysis": "คำอธิบายสั้นๆ ภาษาไทย"
}

ส่งเฉพาะ JSON เท่านั้น`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            "You are an expert dietary visual estimation assistant. Your task is to compare before and after images of a meal and estimate the visual percentage of food consumed (0 to 100). You MUST ALWAYS provide your best estimate in the exact JSON format requested, without refusal or conversational disclaimer.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: beforeImageForAi,
                detail: "auto",
              },
            },
            {
              type: "image_url",
              image_url: {
                url: afterImageBase64,
                detail: "auto",
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("ไม่ได้รับข้อมูลตอบกลับจาก AI");
    }

    const parsed = JSON.parse(text) as Partial<FoodCompareResult>;

    if (parsed.isSameMeal === false) {
      const reason =
        typeof parsed.mismatchReason === "string" && parsed.mismatchReason.trim()
          ? parsed.mismatchReason.trim()
          : "รูปภาพหลังกินไม่ตรงกับอาหารมื้อก่อนหน้า กรุณาเลือกรูปอาหารจานเดียวกัน";
      throw new Error(reason);
    }

    const percentEaten = clampPercent(parsed.percentEaten);

    return {
      isSameMeal: true,
      percentEaten,
      caloriesConsumed: Math.round(toSafeNumber(parsed.caloriesConsumed)),
      proteinConsumed: Math.round(toSafeNumber(parsed.proteinConsumed)),
      carbConsumed: Math.round(toSafeNumber(parsed.carbConsumed)),
      fatConsumed: Math.round(toSafeNumber(parsed.fatConsumed)),
      analysis: typeof parsed.analysis === "string" ? parsed.analysis : "",
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("ไม่สามารถแปลง response เป็น JSON ได้");
    }
    throw error;
  }
};
