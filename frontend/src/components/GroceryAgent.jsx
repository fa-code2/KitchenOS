import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  Sparkles,
  PackagePlus,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Flame,
  Search,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function GroceryAgent({ onPantryRestocked }) {
  const [groceryItems, setGroceryItems] = useState([]);
  const [behaviorSuggestions, setBehaviorSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockLocation, setRestockLocation] = useState('Fridge');
  const [notification, setNotification] = useState(null);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Produce',
    quantity: 1,
    unit: 'units',
    priority: 'Medium',
    estimated_price_usd: 2.5,
  });

  const loadGroceryData = async () => {
    try {
      const [listData, suggestionsData] = await Promise.all([
        api.getGroceryList(),
        api.getBehaviorSuggestions().catch(() => ({ suggestions: [] }))
      ]);
      setGroceryItems(listData || []);
      setBehaviorSuggestions(suggestionsData?.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroceryData();
  }, []);

  const handleTogglePurchased = async (item) => {
    try {
      await api.updateGroceryItem(item.id, { is_purchased: !item.is_purchased });
      loadGroceryData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.deleteGroceryItem(id);
      loadGroceryData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoGenerateStaples = async () => {
    try {
      const res = await api.autoGenerateStaples();
      setNotification(res.message);
      loadGroceryData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSuggestedItem = async (suggested) => {
    try {
      await api.addGroceryItem({
        name: suggested.name,
        category: suggested.category || 'Produce',
        quantity: 1.0,
        unit: 'units',
        is_purchased: false,
        auto_added_reason: suggested.reason || 'AI User Behavior Suggestion',
        priority: suggested.priority || 'High',
        estimated_price_usd: suggested.estimated_price_usd || 3.5
      });
      setNotification(`Added ${suggested.name} to your grocery list!`);
      loadGroceryData();
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSearchWindow = (item) => {
    const url = item.search_url || `https://www.google.com/search?q=${encodeURIComponent('buy ' + item.name + ' grocery online')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRestockPurchased = async () => {
    const purchasedIds = groceryItems.filter((i) => i.is_purchased).map((i) => i.id);
    if (purchasedIds.length === 0) return;

    try {
      const res = await api.restockToPantry(purchasedIds, restockLocation);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#A84323', '#4E6E36', '#C8822A'],
      });

      setNotification(res.message);
      if (onPantryRestocked) onPantryRestocked();
      loadGroceryData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      await api.addGroceryItem({
        ...newItem,
        quantity: parseFloat(newItem.quantity) || 1.0,
        estimated_price_usd: parseFloat(newItem.estimated_price_usd) || 2.5,
      });
      setIsAddModalOpen(false);
      setNewItem({
        name: '',
        category: 'Produce',
        quantity: 1,
        unit: 'units',
        priority: 'Medium',
        estimated_price_usd: 2.5,
      });
      loadGroceryData();
    } catch (err) {
      console.error(err);
    }
  };

  const purchasedCount = groceryItems.filter((i) => i.is_purchased).length;
  const estimatedTotal = groceryItems
    .reduce((acc, curr) => acc + (curr.estimated_price_usd || 2.5), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center space-x-2 rounded-full border border-[#A84323]/20 bg-[#A84323]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#A84323]">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Smart Replenishment Agent</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#2D1F18] sm:text-3xl">
              Dynamic <span className="text-[#4E6E36]">Grocery Agent</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C4435]">
              AI recommendations synchronized with your eating behavior, consumed household staples, and planned meals. Search suggested ingredients in a new window or restock directly in 1 click.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleAutoGenerateStaples}
              className="flex items-center justify-center space-x-2 rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-4 py-2.5 text-xs font-bold text-[#2D1F18] transition-all hover:scale-[1.02] hover:border-[#A84323]"
            >
              <Sparkles className="w-4 h-4 text-[#A84323]" />
              <span>Auto-Scan Low Stock</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-[#A84323] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#A84323]/20 transition-all hover:scale-[1.02] hover:bg-[#94381C]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl border border-[#4E6E36]/30 bg-[#4E6E36]/10 p-3 text-xs text-[#4E6E36]">
            <CheckCircle2 className="h-4 w-4 text-[#4E6E36]" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* AI Behavior & Consumption Suggestions Section */}
      {behaviorSuggestions && behaviorSuggestions.length > 0 && (
        <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5D9C5]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center border border-[#A84323]/20">
                <Flame className="w-4 h-4 text-[#A84323]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1F18] font-serif flex items-center gap-2">
                  <span>Suggested Replenishments</span>
                  <span className="text-[10px] font-bold bg-[#A84323]/10 text-[#A84323] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Based on what you've eaten
                  </span>
                </h3>
                <p className="text-xs text-[#5C4435]">
                  AI suggestions based on your eating habits. Click to search online or add to list.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#8A7667]">
              {behaviorSuggestions.length} items analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {behaviorSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-[#E5D9C5] bg-[#FAF5EB] p-4 flex flex-col justify-between hover:border-[#A84323] hover:shadow-md transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#A84323]/10 text-[#A84323]">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#4E6E36]">
                      ${(item.estimated_price_usd || 3.5).toFixed(2)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#2D1F18] mt-2 font-serif group-hover:text-[#A84323] transition-colors">
                    {item.name}
                  </h4>

                  <p className="text-[11px] text-[#5C4435] mt-1 leading-snug">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#E5D9C5]">
                  <button
                    type="button"
                    onClick={() => handleOpenSearchWindow(item)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-[#F5EDE1] border border-[#E5D9C5] text-[11px] font-bold text-[#2D1F18] flex items-center justify-center space-x-1 transition-colors"
                    title={`Search ${item.name} in other window`}
                  >
                    <Search className="w-3 h-3 text-[#A84323]" />
                    <span>Search Online</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#8A7667]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSuggestedItem(item)}
                    className="py-1.5 px-2.5 rounded-xl bg-[#A84323] hover:bg-[#94381C] text-white text-[11px] font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                    title="Add to shopping list"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {purchasedCount > 0 && (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#A84323]/20 bg-gradient-to-r from-[#A84323]/8 via-[#4E6E36]/8 to-transparent p-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4E6E36]/20 bg-[#4E6E36]/10 text-[#4E6E36]">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#2D1F18]">{purchasedCount} items bought and ready!</h4>
              <p className="text-xs text-[#5C4435]">Transfer directly into Smart Pantry with fresh ML shelf life calculations.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={restockLocation}
              onChange={(e) => setRestockLocation(e.target.value)}
              className="rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-3 py-2 text-xs text-[#2D1F18] focus:outline-none"
            >
              <option value="Fridge">Restock to Fridge</option>
              <option value="Pantry">Restock to Pantry</option>
              <option value="Freezer">Restock to Freezer</option>
            </select>

            <button
              onClick={handleRestockPurchased}
              className="flex items-center space-x-1.5 rounded-xl bg-[#4E6E36] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#4E6E36]/20 transition-all hover:bg-[#3F5B2A]"
            >
              <span>Restock ({purchasedCount}) to Pantry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6">
        <div className="flex items-center justify-between border-b border-[#E5D9C5] pb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#2D1F18]">Shopping List</h3>
            <span className="text-xs text-[#8A7667]">({groceryItems.length} items)</span>
          </div>
          <div className="text-xs text-[#5C4435]">
            Est. Total: <span className="font-mono font-bold text-[#4E6E36]">${estimatedTotal}</span>
          </div>
        </div>

        {groceryItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5C4435]">
            Your shopping list is clear! Click "Auto-Scan Low Stock" or plan weekly meals to populate items.
          </div>
        ) : (
          <div className="space-y-2">
            {groceryItems.map((item) => {
              const isChecked = item.is_purchased;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                    isChecked
                      ? 'border-[#4E6E36]/20 bg-[#4E6E36]/5 opacity-70'
                      : 'border-[#E5D9C5] bg-[#FAF5EB] hover:border-[#A84323]/30'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <button
                      onClick={() => handleTogglePurchased(item)}
                      className={`flex h-5 w-5 items-center justify-center rounded-lg transition-all ${
                        isChecked
                          ? 'bg-[#4E6E36] text-white'
                          : 'border border-[#8A7667] hover:border-[#A84323]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${isChecked ? 'line-through text-[#8A7667]' : 'text-[#2D1F18]'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-[#8A7667]">({item.quantity} {item.unit})</span>
                      </div>

                      <div className="mt-0.5 flex items-center space-x-2 text-[11px] text-[#8A7667]">
                        <span className="text-[#5C4435]">{item.category}</span>
                        {item.auto_added_reason && (
                          <>
                            <span>•</span>
                            <span className="text-[#A84323]">{item.auto_added_reason}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleOpenSearchWindow(item)}
                      className="p-1.5 rounded-lg text-[#8A7667] hover:text-[#A84323] hover:bg-[#A84323]/10 transition-colors"
                      title={`Search ${item.name} in other window`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs text-[#5C4435]">
                      ${(item.estimated_price_usd || 2.5).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-lg p-1.5 text-[#8A7667] transition-colors hover:bg-[#A84323]/10 hover:text-[#A84323]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-2xl sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-[#2D1F18]">Add Item to Shopping List</h3>

            <form onSubmit={handleAddCustomItem} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5C4435]">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Virgin Olive Oil"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-3 py-2 text-xs text-[#2D1F18] focus:border-[#A84323] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5C4435]">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-3 py-2 text-xs text-[#2D1F18] focus:outline-none"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Protein">Protein</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Grains">Grains</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Condiment">Condiment</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5C4435]">Quantity & Unit</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-16 rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-2 py-2 text-center text-xs text-[#2D1F18] focus:border-[#A84323] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-2 py-2 text-xs text-[#2D1F18] focus:border-[#A84323] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5C4435]">Est. Price ($)</label>
                <input
                  type="number"
                  step="0.10"
                  value={newItem.estimated_price_usd}
                  onChange={(e) => setNewItem({ ...newItem, estimated_price_usd: e.target.value })}
                  className="w-full rounded-xl border border-[#E5D9C5] bg-[#FAF5EB] px-3 py-2 text-xs text-[#2D1F18] focus:border-[#A84323] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-[#E5D9C5] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5C4435] hover:text-[#2D1F18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#A84323] px-5 py-2 text-xs font-bold text-white hover:bg-[#94381C]"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

