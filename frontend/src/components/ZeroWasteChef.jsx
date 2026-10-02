import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  UtensilsCrossed,
  Check,
  Award,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function ZeroWasteChef({ onPantryUpdated, initialItem }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCookRecipe, setActiveCookRecipe] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cookingSuccessMessage, setCookingSuccessMessage] = useState(null);

  const fetchRecipes = async (forceItem = null) => {
    setLoading(true);
    setError(null);
    try {
      const itemToCook = forceItem || initialItem;
      let data;
      if (itemToCook) {
        data = await api.generateZeroWasteRecipesWithItems([itemToCook]);
      } else {
        data = await api.getZeroWasteRecipes();
      }
      setRecipes(data || []);
    } catch (err) {
      console.error(err);
      setError('Could not generate zero-waste recipes at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(initialItem);
  }, [initialItem]);

  const handleStartCooking = (recipe) => {
    setActiveCookRecipe(recipe);
    setCurrentStepIndex(0);
    setCookingSuccessMessage(null);
  };

  const handleFinishCooking = async () => {
    if (!activeCookRecipe) return;
    try {
      const ingredientsToDeduct = (activeCookRecipe.ingredients || [])
        .filter(i => i.from_pantry)
        .map(i => i.name);

      const res = await api.cookRecipe(activeCookRecipe.title, ingredientsToDeduct);

      // Trigger festive zero-waste confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A84323', '#4E6E36', '#C8822A', '#FAF5EB']
      });

      setCookingSuccessMessage(res.message);
      if (onPantryUpdated) onPantryUpdated();

      setTimeout(() => {
        setActiveCookRecipe(null);
        fetchRecipes();
      }, 3000);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFFDF8] p-6 sm:p-8 border-2 border-[#E6DBC8] shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#A84323]/10 text-[#A84323] border border-[#A84323]/20 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Zero-Waste Culinary Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D1F18] font-serif">
              Zero-Waste <span className="text-[#A84323] font-serif">Chef</span>
            </h2>
            <p className="text-sm text-[#5C4435] leading-relaxed font-medium">
              Our culinary engine inspects your pantry's freshness scores and generates handcrafted recipes designed specifically to rescue expiring ingredients before they spoil.
            </p>
          </div>

          <button
            onClick={fetchRecipes}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md shadow-[#A84323]/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate New Recipes</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#FFFDF8] rounded-3xl p-6 h-96 border border-[#E6DBC8] animate-pulse space-y-4">
              <div className="h-6 bg-[#FAF5EB] rounded-xl w-3/4" />
              <div className="h-4 bg-[#FAF5EB] rounded-lg w-full" />
              <div className="h-4 bg-[#FAF5EB] rounded-lg w-2/3" />
              <div className="h-32 bg-[#FAF5EB] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#FFFDF8] p-8 text-center rounded-3xl border border-[#A84323]/30">
          <AlertCircle className="w-8 h-8 text-[#A84323] mx-auto mb-2" />
          <p className="text-sm text-[#A84323] font-bold">{error}</p>
          <button
            onClick={fetchRecipes}
            className="mt-4 px-5 py-2 rounded-full text-xs font-bold bg-[#A84323] text-white hover:bg-[#94381C]"
          >
            Try Again
          </button>
        </div>
      ) : (
        /* Recipes Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, idx) => {
            const badges = [
              { label: 'Quick Save', color: 'bg-[#C8822A]/15 text-[#C8822A] border-[#C8822A]/30' },
              { label: "Chef's Special", color: 'bg-[#A84323]/15 text-[#A84323] border-[#A84323]/30' },
              { label: 'Batch & Preserve', color: 'bg-[#4E6E36]/15 text-[#4E6E36] border-[#4E6E36]/30' }
            ];
            const badge = badges[idx % badges.length];

            return (
              <div
                key={idx}
                className="bg-[#FFFDF8] rounded-3xl p-6 flex flex-col justify-between border-2 border-[#E6DBC8] hover:border-[#A84323] transition-all hover:shadow-md group"
              >
                <div>
                  {/* Card Header & Waste Score */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <div className="flex items-center space-x-1 text-xs font-bold text-[#4E6E36] bg-[#4E6E36]/10 px-2.5 py-0.5 rounded-full border border-[#4E6E36]/20">
                      <Award className="w-3.5 h-3.5" />
                      <span>{recipe.waste_saved_score || 95}% Rescued</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#2D1F18] font-serif group-hover:text-[#A84323] transition-colors leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-[#5C4435] mt-2 leading-relaxed line-clamp-3 font-medium">
                    {recipe.description}
                  </p>

                  {/* Expiring Ingredients Rescued Tags */}
                  {(recipe.expiring_ingredients_used || []).length > 0 && (
                    <div className="mt-4 p-3 rounded-2xl bg-[#FFFBF5] border border-[#A84323]/25">
                      <div className="text-[11px] font-bold text-[#A84323] flex items-center gap-1.5 mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#A84323]" />
                        <span>Rescues Expiring Items:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.expiring_ingredients_used.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#A84323]/15 text-[#A84323] border border-[#A84323]/25"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prep & Macros Pills */}
                  <div className="mt-4 grid grid-cols-4 gap-1.5 text-center p-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8]">
                    <div>
                      <div className="text-[10px] text-[#8A7667]">Time</div>
                      <div className="text-xs font-bold text-[#2D1F18]">{(recipe.prep_time_minutes || 10) + (recipe.cook_time_minutes || 15)}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8A7667]">Calories</div>
                      <div className="text-xs font-bold text-[#2D1F18]">{recipe.calories || 380}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8A7667]">Protein</div>
                      <div className="text-xs font-bold text-[#4E6E36]">{recipe.protein_g || 18}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8A7667]">Diff</div>
                      <div className="text-xs font-bold text-[#2D1F18]">{recipe.difficulty || 'Easy'}</div>
                    </div>
                  </div>

                  {/* Key Ingredients Preview */}
                  <div className="mt-4">
                    <h5 className="text-xs font-bold text-[#2D1F18] mb-2 font-serif">Ingredients Included:</h5>
                    <ul className="space-y-1">
                      {(recipe.ingredients || []).slice(0, 4).map((ing, i) => (
                        <li key={i} className="text-xs text-[#5C4435] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A84323]" />
                            <span className={ing.expiring ? 'text-[#A84323] font-bold' : 'text-[#2D1F18]'}>
                              {ing.name}
                            </span>
                          </span>
                          <span className="text-[#8A7667] text-[11px] font-mono">{ing.amount}</span>
                        </li>
                      ))}
                      {(recipe.ingredients || []).length > 4 && (
                        <li className="text-[11px] text-[#8A7667] italic pl-3">
                          + {recipe.ingredients.length - 4} more pantry items
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Cook Action */}
                <div className="mt-6 pt-4 border-t border-[#E6DBC8]">
                  <button
                    onClick={() => handleStartCooking(recipe)}
                    className="w-full py-2.5 px-4 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md shadow-[#A84323]/20 transition-all flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Start Step-by-Step Cooking</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Step-by-Step Cooking Modal */}
      {activeCookRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] p-6 sm:p-8 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DBC8]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center border border-[#A84323]/20">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2D1F18] font-serif">{activeCookRecipe.title}</h3>
                  <p className="text-xs text-[#6B5344]">Zero-Waste Step-by-Step Cooking Mode</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCookRecipe(null)}
                className="text-[#8A7667] hover:text-[#2D1F18] p-2 rounded-xl hover:bg-[#FAF5EB]"
              >
                ✕
              </button>
            </div>

            {/* Success Celebration state */}
            {cookingSuccessMessage ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#4E6E36]/20 text-[#4E6E36] flex items-center justify-center mx-auto border border-[#4E6E36]/30 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2D1F18] font-serif">Bon Appétit! 🎉</h3>
                <p className="text-sm text-[#5C4435] max-w-md mx-auto">{cookingSuccessMessage}</p>
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#4E6E36]/10 text-[#4E6E36] border border-[#4E6E36]/20 text-xs font-bold">
                  <span>Pantry items deducted • Waste prevented logged!</span>
                </div>
              </div>
            ) : (
              /* Steps walkthrough */
              <div className="mt-6 space-y-6">

                {/* Ingredients Checklist */}
                <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8]">
                  <h4 className="text-xs font-bold text-[#2D1F18] font-serif uppercase tracking-wider mb-2">Ingredients Needed:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(activeCookRecipe.ingredients || []).map((ing, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-[#5C4435]">
                        <Check className="w-3.5 h-3.5 text-[#4E6E36] flex-shrink-0" />
                        <span>{ing.amount} {ing.name}</span>
                        {ing.expiring && (
                          <span className="text-[10px] text-[#A84323] bg-[#A84323]/15 px-1.5 py-0.2 rounded font-bold">
                            urgent
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-6 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#A84323]">
                      Step {currentStepIndex + 1} of {(activeCookRecipe.instructions || []).length}
                    </span>
                    <span className="text-xs text-[#8A7667] font-mono">
                      {Math.round(((currentStepIndex + 1) / (activeCookRecipe.instructions?.length || 1)) * 100)}% Complete
                    </span>
                  </div>

                  <p className="text-base font-semibold text-[#2D1F18] leading-relaxed min-h-[4rem]">
                    {activeCookRecipe.instructions?.[currentStepIndex] || 'Prepare ingredients and enjoy cooking!'}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#E6DBC8] mt-4 overflow-hidden">
                    <div
                      className="h-full bg-[#A84323] rounded-full transition-all duration-300"
                      style={{ width: `${((currentStepIndex + 1) / (activeCookRecipe.instructions?.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Second Life Scraps Tip */}
                {activeCookRecipe.second_life_tips && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#4E6E36]/30 flex items-start space-x-3 text-xs text-[#4E6E36]">
                    <Lightbulb className="w-4 h-4 text-[#4E6E36] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#4E6E36]">Scraps Tip: </span>
                      <span className="text-[#5C4435]">{activeCookRecipe.second_life_tips}</span>
                    </div>
                  </div>
                )}

                {/* Navigation and Finish Cooking Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E6DBC8]">
                  <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex(c => c - 1)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#8A7667] hover:text-[#2D1F18] disabled:opacity-30"
                  >
                    Previous Step
                  </button>

                  {currentStepIndex < (activeCookRecipe.instructions?.length || 1) - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStepIndex(c => c + 1)}
                      className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] transition-all flex items-center space-x-1.5 shadow-md"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishCooking}
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#4E6E36] hover:bg-[#3F5B2A] shadow-md shadow-[#4E6E36]/20 transition-all flex items-center space-x-1.5 hover:scale-105"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finish & Deduct Ingredients</span>
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
