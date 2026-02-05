
import { GoogleGenAI, Type } from "@google/genai";
import { IngredientCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CATEGORY_IMAGES: Record<string, string> = {
  [IngredientCategory.RETINOID]: '1556229010-6c3f2c9ca5f8', // Dark clinical bottle aesthetic
  [IngredientCategory.ACID_EXFOLIANT]: '1556228720-3f0f98f395d3', // Glass and water drops
  [IngredientCategory.CLAY_MASK]: '1596755094514-f87034a31217', // Earthy mud texture
  [IngredientCategory.SOOTHING_BARRIER]: '1556228578-0d85b1a4d571', // Soft leaves and cream
  [IngredientCategory.CLEANSER]: '1559539751-24021209ff0e', // Water bubbles/foam
  [IngredientCategory.MOISTURIZER]: '1612817288484-6f9160082884', // Cream swirl
  [IngredientCategory.SERUM_WATER]: '1601049541240-f44d82701974', // Liquid pipette/droplets
  [IngredientCategory.UNKNOWN]: '1556229162-d227b204642d' // General botanical
};

export const geminiService = {
  analyzeProduct: async (base64Image?: string, manualData?: { brand: string, name: string }): Promise<{ brand: string, name: string, category: IngredientCategory, imageUrl?: string, activeIngredients?: string[] }> => {
    const model = 'gemini-3-flash-preview';
    
    let prompt = "";
    let parts: any[] = [];

    if (base64Image) {
      parts.push({ inlineData: { data: base64Image, mimeType: 'image/jpeg' } });
      prompt = `Analyze this skincare product image. Identify the brand, product name, and category. 
      Also, extract the top 2-3 key active ingredients (e.g. "15% Vitamin C", "2% BHA").`;
    } else if (manualData) {
      prompt = `For the skincare product "${manualData.brand} ${manualData.name}", identify its category and the top 2-3 key active ingredients it is known for.`;
    }

    const fullPrompt = `${prompt}
    
    Categories available:
    - Retinoid
    - Direct Acid / Exfoliant
    - Clay / Detox Mask
    - Soothing / Barrier
    - Cleanser
    - Moisturizer
    - Water-based Serum
    
    Return JSON with:
    - brand
    - name
    - category
    - activeIngredients (Array of strings)`;

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            activeIngredients: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["brand", "name", "category", "activeIngredients"]
        }
      }
    });

    try {
      const text = response.text || '{}';
      const data = JSON.parse(text);
      
      const category = (data.category as IngredientCategory) || IngredientCategory.UNKNOWN;
      const imageId = CATEGORY_IMAGES[category] || CATEGORY_IMAGES[IngredientCategory.UNKNOWN];
      const aestheticUrl = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=400&h=400&sig=${Math.floor(Math.random() * 9999)}`;

      return {
        brand: data.brand || (manualData?.brand ?? 'Unknown Brand'),
        name: data.name || (manualData?.name ?? 'Unknown Product'),
        category,
        activeIngredients: data.activeIngredients || [],
        imageUrl: aestheticUrl
      };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Could not analyze product.");
    }
  }
};
