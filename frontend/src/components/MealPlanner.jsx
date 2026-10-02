import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function MealPlanner({ onGroceryUpdated, pantryItems }) {
  const [mealPlanData, setMealPlanData] = useState({
    schedule: [],
    total_weekly_calories: 0,
    pantry_coverage_percentage: 100,
    missing_ingredients: []
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newMeal, setNewMeal] = useState({
    day_of_week: 'Monday',
    meal_type: 'Dinner',
    recipe_name: '',
    description: '',
    calories: 450,
    ingredients_used: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  const loadMealPlan = async () => {
    try {
      const data = await api.getWeeklyMealPlan();
      setMealPlanData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMealPlan();
  }, [pantryItems]);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!newMeal.recipe_name) return;

    try {
      const ingList = newMeal.ingredients_used
        ? newMeal.ingredients_used.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await api.createMealPlanEntry({
        ...newMeal,
        calories: parseInt(newMeal.calories) || 400,
        ingredients_used: ingList
      });

      setIsAddModalOpen(false);
      setNewMeal({
        day_of_week: 'Monday',
        meal_type: 'Dinner',
        recipe_name: '',
        description: '',
        calories: 450,
        ingredients_used: ''
      });
      loadMealPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      await api.deleteMealPlanEntry(id);
      loadMealPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToGrocery = async () => {
    setIsSyncing(true);
    try {
      const res = await api.generateGroceryFromMealPlan();
      setSyncMessage(res.message || `Successfully synced missing ingredients to your Grocery list!`);
      if (onGroceryUpdated) onGroceryUpdated();
      await loadMealPlan();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setSyncMessage('Failed to sync to grocery list.');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Pantry Coverage */}
      <div className="bg-[#FFFDF8] rounded-3xl p-6 sm:p-8 border-2 border-[#E6DBC8] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#A84323]/10 text-[#A84323] border border-[#A84323]/20 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly Meal Calendar & Inventory Sync</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D1F18] font-serif">
              Meal Planner & <span className="text-[#A84323] font-serif">Macro Sync</span>
            </h2>
            <p className="text-sm text-[#5C4435] leading-relaxed font-medium">
              Schedule weekly household meals matched against ingredients you already own. Automatically detect missing items and push them to your grocery agent in 1 click.
            </p>
          </div>

          {/* Pantry Coverage Card */}
          <div className="p-5 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] min-w-[18rem] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D1F18]">Pantry Coverage:</span>
              <span className="text-base font-mono font-black text-[#4E6E36]">
                {mealPlanData.pantry_coverage_percentage}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#E6DBC8] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4E6E36] transition-all duration-500"
                style={{ width: `${mealPlanData.pantry_coverage_percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#6B5344]">Total Planned Cal:</span>
              <span className="font-mono font-bold text-[#2D1F18]">{mealPlanData.total_weekly_calories} kcal</span>
            </div>

            {mealPlanData.missing_ingredients && mealPlanData.missing_ingredients.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-[#E6DBC8]/60">
                <div className="flex items-center justify-between text-[11px] text-[#A84323] font-bold">
                  <span>Missing from Pantry:</span>
                  <span className="bg-[#A84323]/10 px-1.5 py-0.5 rounded-md font-mono">{mealPlanData.missing_ingredients.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {mealPlanData.missing_ingredients.map((ing, i) => (
                    <span key={i} className="text-[10px] bg-white border border-[#E6DBC8] text-[#5C4435] px-1.5 py-0.5 rounded">
                      {ing}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleSyncToGrocery}
                  disabled={isSyncing}
                  className="w-full mt-2 py-2 px-3 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-[#A84323]/20 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Syncing...' : `Sync ${mealPlanData.missing_ingredients.length} Missing to Grocery`}</span>
                </button>
              </div>
            )}

            {syncMessage && (
              <div className="p-2 rounded-xl bg-[#4E6E36]/10 text-[#4E6E36] text-[11px] font-bold text-center border border-[#4E6E36]/20">
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Days Grid Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#2D1F18] font-serif">Weekly Schedule</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md transition-all hover:scale-105"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Planned Meal</span>
        </button>
      </div>

      {/* 7-Day Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3.5">
        {days.map(day => {
          const dayMeals = (mealPlanData.schedule || []).filter(m => m.day_of_week === day);

          return (
            <div
              key={day}
              className="bg-[#FFFDF8] rounded-2xl p-3.5 border-2 border-[#E6DBC8] flex flex-col justify-between min-h-[16rem] space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E6DBC8]">
                  <span className="text-xs font-extrabold text-[#2D1F18] font-serif uppercase tracking-wider">{day.slice(0, 3)}</span>
                  <span className="text-[10px] font-bold text-[#8A7667]">{dayMeals.length} meals</span>
                </div>

                <div className="mt-2.5 space-y-2">
                  {dayMeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#8A7667] italic font-medium">
                      No meals set
                    </div>
                  ) : (
                    dayMeals.map(meal => (
                      <div
                        key={meal.id}
                        className="group relative p-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] hover:border-[#A84323] transition-all"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#A84323]/10 text-[#A84323]">
                            {meal.meal_type}
                          </span>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#8A7667] hover:text-rose-600 transition-opacity p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-[#2D1F18] mt-1 font-serif">{meal.recipe_name}</h5>
                        {meal.calories && (
                          <div className="text-[10px] text-[#8A7667] font-mono mt-0.5">{meal.calories} cal</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setNewMeal(prev => ({ ...prev, day_of_week: day }));
                  setIsAddModalOpen(true);
                }}
                className="w-full py-1.5 rounded-xl text-[11px] font-bold text-[#6B5344] hover:text-[#2D1F18] hover:bg-[#FAF5EB] border border-dashed border-[#E6DBC8] transition-colors text-center"
              >
                + Add Meal
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Meal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] p-6 sm:p-8 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DBC8]">
              <h3 className="text-base font-bold text-[#2D1F18] font-serif">Add Meal to Planner</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8A7667] hover:text-[#2D1F18] p-1.5 rounded-xl hover:bg-[#FAF5EB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D1F18] mb-1">Day of Week:</label>
                  <select
                    value={newMeal.day_of_week}
                    onChange={(e) => setNewMeal({ ...newMeal, day_of_week: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] font-semibold text-[#2D1F18]"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D1F18] mb-1">Meal Type:</label>
                  <select
                    value={newMeal.meal_type}
                    onChange={(e) => setNewMeal({ ...newMeal, meal_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] font-semibold text-[#2D1F18]"
                  >
                    {mealTypes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D1F18] mb-1">Meal / Recipe Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lemon Herb Roasted Chicken & Greens"
                  value={newMeal.recipe_name}
                  onChange={(e) => setNewMeal({ ...newMeal, recipe_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] font-semibold text-[#2D1F18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D1F18] mb-1">Estimated Calories (kcal):</label>
                <input
                  type="number"
                  value={newMeal.calories}
                  onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] font-semibold text-[#2D1F18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D1F18] mb-1">Ingredients (comma-separated):</label>
                <input
                  type="text"
                  placeholder="Chicken breast, Lemon, Spinach, Olive oil"
                  value={newMeal.ingredients_used}
                  onChange={(e) => setNewMeal({ ...newMeal, ingredients_used: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#2D1F18]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6DBC8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-[#8A7667] hover:text-[#2D1F18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-bold shadow-md"
                >
                  Save to Schedule
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
