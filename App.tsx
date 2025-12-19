
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Utensils, 
  Calendar, 
  ShoppingCart, 
  User, 
  Trash2, 
  ChevronRight, 
  Star, 
  Clock, 
  Flame,
  X,
  Loader2,
  ChefHat,
  ArrowLeft
} from 'lucide-react';
import { 
  Recipe, 
  Ingredient, 
  DietaryPreferences, 
  MealPlanDay, 
  ShoppingItem,
  Review 
} from './types';
import { 
  generateRecipesFromIngredients, 
  generateMealPlan, 
  generateShoppingList 
} from './services/geminiService';

const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes' | 'mealplan' | 'shopping'>('pantry');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Data State
  const [pantry, setPantry] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    keto: false,
    paleo: false,
    allergies: []
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedPantry = localStorage.getItem('pantry');
    const savedPreferences = localStorage.getItem('preferences');
    const savedMealPlan = localStorage.getItem('mealplan');
    const savedShopping = localStorage.getItem('shopping');
    const savedReviews = localStorage.getItem('reviews');

    if (savedPantry) setPantry(JSON.parse(savedPantry));
    if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
    if (savedMealPlan) setMealPlan(JSON.parse(savedMealPlan));
    if (savedShopping) setShoppingList(JSON.parse(savedShopping));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('pantry', JSON.stringify(pantry));
    localStorage.setItem('preferences', JSON.stringify(preferences));
    localStorage.setItem('mealplan', JSON.stringify(mealPlan));
    localStorage.setItem('shopping', JSON.stringify(shoppingList));
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [pantry, preferences, mealPlan, shoppingList, reviews]);

  const addIngredient = () => {
    if (!newIngredient.trim()) return;
    const item: Ingredient = { id: Date.now().toString(), name: newIngredient.trim() };
    setPantry([...pantry, item]);
    setNewIngredient('');
  };

  const removeIngredient = (id: string) => {
    setPantry(pantry.filter(i => i.id !== id));
  };

  const handleGenerateRecipes = async () => {
    if (pantry.length === 0) {
      setError("Add some ingredients to your pantry first!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ingredientNames = pantry.map(p => p.name);
      const reviewContext = reviews.slice(-5).map(r => `${r.rating} stars: ${r.comment}`);
      const results = await generateRecipesFromIngredients(ingredientNames, preferences, reviewContext);
      setRecipes(results);
      setActiveTab('recipes');
    } catch (err) {
      setError("Failed to generate recipes. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await generateMealPlan(preferences);
      setMealPlan(results);
    } catch (err) {
      setError("Failed to generate meal plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShoppingList = async () => {
    if (recipes.length === 0) return;
    setLoading(true);
    try {
      const list = await generateShoppingList(recipes);
      setShoppingList(list);
      setActiveTab('shopping');
    } catch (err) {
      setError("Failed to generate shopping list.");
    } finally {
      setLoading(false);
    }
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(shoppingList.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleAddReview = (recipeId: string, rating: number, comment: string) => {
    const review: Review = {
      id: Date.now().toString(),
      recipeId,
      user: "FoodieUser",
      rating,
      comment,
      date: new Date().toLocaleDateString()
    };
    setReviews([review, ...reviews]);
  };

  const renderPantry = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-600" />
          What's in your Kitchen?
        </h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
            placeholder="Ex: Chicken breast, spinach..."
            className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button 
            onClick={addIngredient}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {pantry.map((item) => (
            <span 
              key={item.id} 
              className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-emerald-100 group"
            >
              {item.name}
              <button onClick={() => removeIngredient(item.id)} className="hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          {pantry.length === 0 && (
            <p className="text-stone-400 text-sm italic">Add ingredients to get started...</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-amber-500" />
          Preferences & Diet
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.keys(preferences).filter(k => k !== 'allergies').map((pref) => (
            <button
              key={pref}
              onClick={() => setPreferences({ ...preferences, [pref]: !preferences[pref as keyof DietaryPreferences] })}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                preferences[pref as keyof DietaryPreferences] 
                  ? 'bg-amber-100 border-amber-200 text-amber-800' 
                  : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {pref.charAt(0).toUpperCase() + pref.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleGenerateRecipes}
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
        Discover Recipes
      </button>
    </div>
  );

  const renderRecipes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold serif-title">AI Suggested Recipes</h2>
        <button 
          onClick={handleGenerateRecipes} 
          className="text-emerald-600 font-semibold text-sm hover:underline"
        >
          Refresh Suggestions
        </button>
      </div>
      
      {recipes.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
          <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">No recipes generated yet. Go back to pantry.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
          <p className="text-stone-500 animate-pulse font-medium">Chef Gemini is thinking...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <div className="h-48 overflow-hidden relative">
              <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                4.8
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{recipe.title}</h3>
              <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">{recipe.description}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-stone-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.cookingTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {recipe.calories || '450'} kcal
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {recipe.servings} serving
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recipes.length > 0 && (
        <button 
          onClick={handleCreateShoppingList}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Generate Shopping List
        </button>
      )}
    </div>
  );

  const renderMealPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold serif-title">Weekly Meal Planner</h2>
        <button 
          onClick={handleGenerateMealPlan}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100"
        >
          Regenerate
        </button>
      </div>

      {mealPlan.length === 0 ? (
        <div className="text-center py-20 bg-emerald-50 rounded-3xl border border-emerald-100">
          <Calendar className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="text-emerald-800 font-medium">No meal plan created.</p>
          <button 
            onClick={handleGenerateMealPlan}
            className="mt-4 text-emerald-600 font-bold hover:underline"
          >
            Create Plan Now
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {mealPlan.map((day) => (
            <div key={day.day} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-4">
              <div className="sm:w-32 flex-shrink-0">
                <span className="text-emerald-600 font-bold text-lg">{day.day}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Breakfast</span>
                  <p className="text-sm font-semibold text-stone-800">{day.breakfast}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Lunch</span>
                  <p className="text-sm font-semibold text-stone-800">{day.lunch}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Dinner</span>
                  <p className="text-sm font-semibold text-stone-800">{day.dinner}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderShoppingList = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold serif-title">Shopping List</h2>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
        {shoppingList.length === 0 ? (
          <p className="text-stone-400 text-center py-10 italic">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {Array.from(new Set(shoppingList.map(item => item.category))).map(category => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest pl-1">{category}</h3>
                {shoppingList.filter(i => i.category === category).map((item) => (
                  <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={() => toggleShoppingItem(item.id)}
                      className="w-5 h-5 rounded-md border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-stone-700 font-medium ${item.checked ? 'line-through text-stone-300' : ''}`}>
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRecipeDetail = (recipe: Recipe) => (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setSelectedRecipe(null)}
          className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-72 object-cover" />
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-3xl font-bold serif-title mb-3">{recipe.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-stone-500 border-b border-stone-100 pb-6">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500" /> {recipe.cookingTime} mins</span>
                <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> {recipe.calories || 450} kcal</span>
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-500" /> {recipe.servings} servings</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Ingredients</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-stone-600 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Instructions</h3>
              <div className="space-y-6">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-1">{idx + 1}.</span>
                    <p className="text-stone-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-stone-100">
              <h3 className="text-xl font-bold">User Reviews</h3>
              <div className="space-y-4">
                {reviews.filter(r => r.recipeId === recipe.id).map(review => (
                  <div key={review.id} className="bg-stone-50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{review.user}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 text-sm">{review.comment}</p>
                    <span className="text-[10px] text-stone-400 mt-2 block">{review.date}</span>
                  </div>
                ))}
                
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-800 mb-4">Rate this recipe</h4>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleAddReview(recipe.id, star, "Loved this AI creation!")}>
                        <Star className="w-6 h-6 text-amber-400 hover:scale-110 transition-transform" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-600 italic">Your reviews help FlavorGenius personalize future suggestions!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800 tracking-tight">FlavorGenius</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
              <Search className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <User className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto mt-6 px-6">
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-8 px-6">
        {activeTab === 'pantry' && renderPantry()}
        {activeTab === 'recipes' && renderRecipes()}
        {activeTab === 'mealplan' && renderMealPlan()}
        {activeTab === 'shopping' && renderShoppingList()}
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && renderRecipeDetail(selectedRecipe)}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-stone-100 rounded-[32px] px-4 py-2 shadow-2xl z-40 flex items-center gap-1 w-[90%] max-w-md">
        <NavButton 
          active={activeTab === 'pantry'} 
          onClick={() => setActiveTab('pantry')} 
          icon={<Utensils className="w-5 h-5" />} 
          label="Pantry" 
        />
        <NavButton 
          active={activeTab === 'recipes'} 
          onClick={() => setActiveTab('recipes')} 
          icon={<Search className="w-5 h-5" />} 
          label="Recipes" 
        />
        <NavButton 
          active={activeTab === 'mealplan'} 
          onClick={() => setActiveTab('mealplan')} 
          icon={<Calendar className="w-5 h-5" />} 
          label="Plan" 
        />
        <NavButton 
          active={activeTab === 'shopping'} 
          onClick={() => setActiveTab('shopping')} 
          icon={<ShoppingCart className="w-5 h-5" />} 
          label="Cart" 
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all ${
      active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-400 hover:text-emerald-600'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
