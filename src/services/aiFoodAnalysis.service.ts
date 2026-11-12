import OpenAI from "openai";
import { compressImage, fileToBase64 } from "../utils/imageCompressor";

export type FoodNutritionAnalysis = {
  menu: string;
  cal: number;
  protein: number;
  carb: number;
  fat: number;
  isFood?: boolean;
};

export const isUnrecognizedFood = (data: FoodNutritionAnalysis | null | undefined): boolean => {
  if (!data) return true;
  if (data.isFood === false) return true;
  if (!data.menu) return true;
  const menuStr = String(data.menu).trim().toLowerCase();
  return (
    menuStr.includes("ไม่สามารถวิเคราะห์ได้") ||
    menuStr.includes("ไม่สามารถ") ||
    menuStr.includes("ไม่ใช่รูปอาหาร") ||
    menuStr.includes("ไม่ใช่ภาพอาหาร") ||
    menuStr.includes("unrecognized") ||
    menuStr.includes("not food")
  );
};

export const analyzeFoodImage = async (
  imageFile: File
): Promise<FoodNutritionAnalysis> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API Key in environment variables");
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Balance speed and accuracy: 896px / 0.35MB keeps food textures & portions sharp for Vision
  const optimizedFile = await compressImage(imageFile, 0.35, 896);
  const base64Image = await fileToBase64(optimizedFile);

  const prompt = `วิเคราะห์รูปภาพนี้ว่าเป็นอาหารหรือไม่ ถ้าเป็นอาหารให้ระบุชื่อและสารอาหารโดยประเมินจากปริมาณในจานจริง แต่ถ้าไม่ใช่รูปอาหารหรือไม่ชัดเจนจนไม่สามารถระบุได้ ให้ใส่ isFood: false และ menu: "ไม่สามารถวิเคราะห์ได้":
{
  "isFood": true หรือ false,
  "menu": "ชื่ออาหาร (ภาษาไทย) หรือ 'ไม่สามารถวิเคราะห์ได้'",
  "cal": จำนวนแคลอรี่ (ตัวเลข),
  "protein": จำนวนโปรตีน (กรัม, ตัวเลข),
  "carb": จำนวนคาร์โบไฮเดรต (กรัม, ตัวเลข),
  "fat": จำนวนไขมัน (กรัม, ตัวเลข)
}
ส่งเฉพาะ JSON เท่านั้น`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: "auto",
            },
          },
        ],
      },
    ],
    max_tokens: 200,
  });

  const text = response.choices[0]?.message?.content ?? "";
  if (text) {
    try {
      return JSON.parse(text) as FoodNutritionAnalysis;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as FoodNutritionAnalysis;
      }
    }
  }

  throw new Error("ไม่สามารถแปลง response เป็น JSON ได้");
};
