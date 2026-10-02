import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Utensils, 
  Sparkles,
  Layers,
  ThermometerSnowflake,
  Box,
  LayoutGrid,
  List
} from 'lucide-react';

export default function PantryView({ 
  items, 
  onConsume, 
  onWaste, 
  onDeleteItem, 
  onOpenAdd, 
  onOpenScan,
  onCookItem,
  onUpcycleItem
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const locations = ['All', 'Fridge', 'Pantry', 'Freezer'];
  const categories = ['All', 'Produce', 'Dairy', 'Protein', 'Bakery', 'Grains', 'Beverage', 'Condiment'];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || item.location === selectedLocation;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    let matchesUrgency = true;
    if (urgencyFilter === 'critical') matchesUrgency = item.days_remaining <= 3;
    if (urgencyFilter === 'fresh') matchesUrgency = item.days_remaining > 5;

    return matchesSearch && matchesLocation && matchesCategory && matchesUrgency;
  });

  const urgentCount = items.filter(i => i.days_remaining <= 3).length;

  const getLocationIcon = (loc) => {
    switch (loc) {
      case 'Fridge': return <ThermometerSnowflake className="w-3.5 h-3.5 text-[#4E6E36]" />;
      case 'Freezer': return <ThermometerSnowflake className="w-3.5 h-3.5 text-[#523B2F]" />;
      default: return <Box className="w-3.5 h-3.5 text-[#C8822A]" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner for Urgent Items */}
      {urgentCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#FFFBF5] border-2 border-[#A84323]/30 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#A84323]/10 text-[#A84323] border border-[#A84323]/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#2D1F18] font-serif flex items-center gap-2">
                  <span>{urgentCount} items need attention soon!</span>
                  <span className="text-[10px] uppercase font-black bg-[#A84323]/10 text-[#A84323] px-2 py-0.5 rounded-full border border-[#A84323]/20">
                    High Priority
                  </span>
                </h4>
                <p className="text-xs text-[#6B5344] mt-0.5">
                  AI Random Forest model predicts these items will spoil within 3 days. Use the Zero-Waste Chef to cook them now.
                </p>
              </div>
            </div>
            <button
              onClick={() => onCookItem(null)}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] transition-all shadow-md shadow-[#A84323]/20"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Rescue in Zero-Waste Chef</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#FFFDF8] p-4 rounded-2xl border border-[#E6DBC8] shadow-2xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7667]" />
          <input
            type="text"
            placeholder="Search spinach, milk, avocados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-sm text-[#2D1F18] placeholder-[#8A7667] focus:outline-none focus:border-[#A84323] transition-all"
          />
        </div>

        {/* Location Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {locations.map(loc => {
            const count = loc === 'All' ? items.length : items.filter(i => i.location === loc).length;
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#A84323] text-white shadow-2xs'
                    : 'text-[#6B5344] bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8]'
                }`}
              >
                <span>{loc}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#E6DBC8] text-[#5C4435]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Urgency and View Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUrgencyFilter(urgencyFilter === 'critical' ? 'All' : 'critical')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
              urgencyFilter === 'critical'
                ? 'bg-[#A84323] text-white'
                : 'text-[#6B5344] bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#A84323]" />
            <span>Expiring Soon</span>
          </button>

          <div className="flex items-center bg-[#FAF5EB] p-0.5 rounded-xl border border-[#E6DBC8]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#A84323] text-white' : 'text-[#6B5344] hover:text-[#2D1F18]'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#A84323] text-white' : 'text-[#6B5344] hover:text-[#2D1F18]'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Pantry Grid / List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFDF8] rounded-2xl border-2 border-dashed border-[#E6DBC8]">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF5EB] text-[#8A7667] mx-auto mb-3 border border-[#E6DBC8]">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#2D1F18] font-serif">No pantry items match your filter</h3>
          <p className="text-xs text-[#6B5344] mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or use YOLO Camera Scan to auto-fill your pantry.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={onOpenScan}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#A84323] text-white hover:bg-[#94381C] shadow-md transition-all"
            >
              📸 Scan Groceries
            </button>
            <button
              onClick={onOpenAdd}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#2D1F18] hover:bg-[#F4ECE0] border border-[#E6DBC8] transition-all"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const score = item.freshness_score;
            const daysLeft = item.days_remaining;
            
            let colorClass = 'text-[#4E6E36] bg-[#4E6E36]/10 border-[#4E6E36]/25';
            let barColor = 'bg-[#4E6E36]';
            let statusText = 'Peak Freshness';

            if (daysLeft <= 1 || score < 25) {
              colorClass = 'text-[#A84323] bg-[#A84323]/10 border-[#A84323]/25';
              barColor = 'bg-[#A84323]';
              statusText = 'Expires Tomorrow';
            } else if (daysLeft <= 3 || score < 55) {
              colorClass = 'text-[#C8822A] bg-[#C8822A]/10 border-[#C8822A]/25';
              barColor = 'bg-[#C8822A]';
              statusText = 'Use Within 3d';
            }

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-[#FFFDF8] p-4 border-2 border-[#E6DBC8] hover:border-[#A84323] transition-all shadow-2xs hover:shadow-md"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#6B5344] bg-[#FAF5EB] px-2.5 py-1 rounded-lg border border-[#E6DBC8]">
                      {getLocationIcon(item.location)}
                      <span>{item.location}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Item Name and Category */}
                  <div className="mt-2">
                    <h4 className="text-base font-bold text-[#2D1F18] font-serif group-hover:text-[#A84323] transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-[#6B5344] mt-0.5 font-medium">
                      <span>{item.quantity} {item.unit}</span>
                      <span>•</span>
                      <span className="text-[#8A7667]">{item.category}</span>
                    </div>
                  </div>

                  {/* Freshness Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B5344] flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{daysLeft > 0 ? `${daysLeft}d remaining` : 'Expired'}</span>
                      </span>
                      <span className="font-bold text-[#2D1F18] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#A84323]" />
                        {Math.round(score)}% Fresh
                      </span>
                    </div>
                    
                    <div className="w-full h-2 rounded-full bg-[#EAE0CF] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
                      />
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-[#8A7667] italic mt-3 line-clamp-1">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-[#E6DBC8] flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onConsume(item.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-[#4E6E36] bg-[#4E6E36]/10 hover:bg-[#4E6E36]/20 border border-[#4E6E36]/20 transition-all flex items-center space-x-1"
                      title="Consume item"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Eat</span>
                    </button>
                    
                    <button
                      onClick={() => onCookItem(item)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-[#A84323] bg-[#A84323]/10 hover:bg-[#A84323]/20 border border-[#A84323]/20 transition-all flex items-center space-x-1"
                      title="Generate Recipe with this item"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Cook</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpcycleItem(item)}
                      className="p-1.5 rounded-lg text-[#6B5344] hover:text-[#A84323] hover:bg-[#FAF5EB] transition-all"
                      title="Second Life Ideas"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-[#8A7667] hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E6DBC8] overflow-hidden divide-y divide-[#E6DBC8]">
          {filteredItems.map(item => {
            const score = item.freshness_score;
            const daysLeft = item.days_remaining;
            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFFBF5] transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] flex items-center justify-center border border-[#E6DBC8]">
                    {getLocationIcon(item.location)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#2D1F18] font-serif">{item.name}</span>
                      <span className="text-xs text-[#6B5344]">({item.quantity} {item.unit})</span>
                    </div>
                    <div className="text-xs text-[#8A7667] flex items-center space-x-2 mt-0.5">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-32 text-right">
                    <div className="text-xs font-bold text-[#2D1F18] flex items-center justify-end gap-1">
                      <Sparkles className="w-3 h-3 text-[#A84323]" />
                      {Math.round(score)}% Fresh
                    </div>
                    <div className="text-[11px] text-[#6B5344] mt-0.5">{daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onConsume(item.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#4E6E36] bg-[#4E6E36]/10 hover:bg-[#4E6E36]/20"
                    >
                      Eat
                    </button>
                    <button
                      onClick={() => onCookItem(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#A84323] bg-[#A84323]/10 hover:bg-[#A84323]/20"
                    >
                      Cook
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-[#8A7667] hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
