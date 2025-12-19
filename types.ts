
export interface Ingredient {
  id: string;
  name: string;
  amount?: string;
}

export interface DietaryPreferences {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  keto: boolean;
  paleo: boolean;
  allergies: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  calories?: number;
  tags: string[];
  imageUrl: string;
  rating?: number;
}

export interface Review {
  id: string;
  recipeId: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MealPlanDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  category: string;
}
