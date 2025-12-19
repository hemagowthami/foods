
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, DietaryPreferences, MealPlanDay } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateRecipesFromIngredients = async (
  ingredients: string[],
  preferences: DietaryPreferences,
  previousReviews: string[] = []
): Promise<Recipe[]> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Generate 3 high-quality recipes based strictly on these ingredients: ${ingredients.join(", ")}.
  Dietary Restrictions: ${Object.entries(preferences)
    .filter(([_, v]) => v === true)
    .map(([k]) => k)
    .join(", ")}. 
  Allergies: ${preferences.allergies.join(", ")}.
  Context from user reviews: ${previousReviews.join("; ")}.
  Make sure recipes are creative and professional.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            cookingTime: { type: Type.NUMBER },
            servings: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["id", "title", "description", "ingredients", "instructions", "cookingTime", "servings"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text);
  return parsed.map((r: any) => ({
    ...r,
    imageUrl: `https://picsum.photos/seed/${r.title.replace(/\s/g, '')}/800/600`
  }));
};

export const generateMealPlan = async (
  preferences: DietaryPreferences
): Promise<MealPlanDay[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate a 7-day meal plan based on these dietary preferences: ${JSON.stringify(preferences)}.
  Return exactly 7 days (Monday through Sunday). Each day should have a breakfast, lunch, and dinner title.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            breakfast: { type: Type.STRING },
            lunch: { type: Type.STRING },
            dinner: { type: Type.STRING },
            snacks: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["day", "breakfast", "lunch", "dinner"],
        },
      },
    },
  });

  return JSON.parse(response.text);
};

export const generateShoppingList = async (recipes: Recipe[]): Promise<any[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Based on these recipes: ${recipes.map(r => r.title).join(", ")}, 
  create a consolidated grocery shopping list. Categorize items (e.g., Produce, Dairy, Pantry).`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["id", "name", "category"],
        },
      },
    },
  });

  return JSON.parse(response.text).map((item: any) => ({ ...item, checked: false }));
};
