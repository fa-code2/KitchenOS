import React, { useState } from 'react';
import { X, Plus, Sparkles, Calendar, ThermometerSnowflake } from 'lucide-react';
import { api } from '../services/api';

export default function AddItemModal({ isOpen, onClose, onItemAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Produce',
    quantity: 1,
    unit: 'units',
    location: 'Fridge',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    setError(null);
    try {
      await api.createPantryItem({
        ...formData,
        quantity: parseFloat(formData.quantity) || 1.0
      });
      onItemAdded();
      onClose();
      setFormData({
        name: '',
        category: 'Produce',
        quantity: 1,
        unit: 'units',
        location: 'Fridge',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      setError('Failed to add item to pantry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] p-6 sm:p-8 shadow-2xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DBC8]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center border border-[#A84323]/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D1F18] font-serif">Add Pantry Item</h3>
              <p className="text-xs text-[#5C4435] font-medium">Deterministic Spoilage Engine calculates shelf life</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A7667] hover:text-[#2D1F18] hover:bg-[#FAF5EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Baby Spinach"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] placeholder-[#8A7667] focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
              >
                <option value="Produce" className="bg-[#FFFDF8] text-[#2D1F18]">Produce</option>
                <option value="Dairy" className="bg-[#FFFDF8] text-[#2D1F18]">Dairy</option>
                <option value="Protein" className="bg-[#FFFDF8] text-[#2D1F18]">Protein</option>
                <option value="Bakery" className="bg-[#FFFDF8] text-[#2D1F18]">Bakery</option>
                <option value="Grains" className="bg-[#FFFDF8] text-[#2D1F18]">Grains</option>
                <option value="Beverage" className="bg-[#FFFDF8] text-[#2D1F18]">Beverage</option>
                <option value="Condiment" className="bg-[#FFFDF8] text-[#2D1F18]">Condiment</option>
                <option value="Other" className="bg-[#FFFDF8] text-[#2D1F18]">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
              >
                <option value="Fridge" className="bg-[#FFFDF8] text-[#2D1F18]">Fridge</option>
                <option value="Pantry" className="bg-[#FFFDF8] text-[#2D1F18]">Pantry</option>
                <option value="Freezer" className="bg-[#FFFDF8] text-[#2D1F18]">Freezer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Unit</label>
              <input
                type="text"
                placeholder="units, bag, lbs, carton"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2D1F18] font-serif mb-1.5 block">Notes / Storage details (optional)</label>
            <input
              type="text"
              placeholder="e.g. Opened yesterday"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] placeholder-[#8A7667] focus:outline-none focus:border-[#A84323]"
            />
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E6DBC8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#8A7667] hover:text-[#2D1F18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md shadow-[#A84323]/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Pantry'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
