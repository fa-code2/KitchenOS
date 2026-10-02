import React, { useState, useEffect } from 'react';
import { 
  Recycle, 
  Sparkles, 
  Sprout, 
  Utensils, 
  Leaf, 
  Coffee, 
  Clock, 
  ChevronRight, 
  Lightbulb, 
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function SecondLifeHub({ initialQuery }) {
  const [guides, setGuides] = useState([]);
  const [matchedItems, setMatchedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGuide, setActiveGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuides = async () => {
      try {
        const res = await api.getPantryMatchedGuides();
        setGuides(res.guides || []);
        setMatchedItems(res.matched_items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadGuides();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setLoading(true);
      api.querySecondLife(initialQuery)
        .then(guide => {
          setGuides(prev => {
            const exists = prev.find(g => g.id === guide.id || g.title === guide.title);
            if (!exists) return [guide, ...prev];
            return prev;
          });
          setActiveGuide(guide);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [initialQuery]);

  const categories = ['All', 'Household & Cleaning', 'Gardening & Soil', 'Culinary Upcycling', 'Regenerative Kitchen', 'DIY Personal Care & Garden'];

  const filteredGuides = selectedCategory === 'All'
    ? guides
    : guides.filter(g => g.category === selectedCategory);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Household & Cleaning': return <Sparkles className="w-4 h-4 text-[#A84323]" />;
      case 'Gardening & Soil': return <Sprout className="w-4 h-4 text-[#4E6E36]" />;
      case 'Culinary Upcycling': return <Utensils className="w-4 h-4 text-[#C8822A]" />;
      case 'Regenerative Kitchen': return <Leaf className="w-4 h-4 text-[#4E6E36]" />;
      default: return <Coffee className="w-4 h-4 text-[#523B2F]" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFFDF8] p-6 sm:p-8 border-2 border-[#E6DBC8] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#4E6E36]/10 text-[#4E6E36] border border-[#4E6E36]/20 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Circular Kitchen & Zero-Waste Upcycling</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D1F18] font-serif">
              Second Life <span className="text-[#A84323] font-serif">Hub</span>
            </h2>
            <p className="text-sm text-[#5C4435] leading-relaxed font-medium">
              When food is no longer suitable for standard recipes, it still has immense value. Discover creative ways to turn scraps, peels, stale bread, and overripe produce into cleaners, broth, garden fertilizer, and windowsill regrowths.
            </p>
          </div>

          {matchedItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-[#A84323]/25 max-w-xs">
              <div className="text-xs font-bold text-[#A84323] flex items-center gap-1.5 mb-1.5 font-serif">
                <Lightbulb className="w-3.5 h-3.5 text-[#A84323]" />
                <span>Pantry Matches Detected:</span>
              </div>
              <p className="text-xs text-[#5C4435] font-medium">
                You have <span className="text-[#2D1F18] font-bold">{matchedItems.join(', ')}</span> that can be upcycled right now!
              </p>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-6 mt-4 border-t border-[#E6DBC8]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#A84323] text-white shadow-xs'
                  : 'text-[#6B5344] bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8]'
              }`}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => setActiveGuide(guide)}
            className="group cursor-pointer bg-[#FFFDF8] rounded-3xl p-6 flex flex-col justify-between border-2 border-[#E6DBC8] hover:border-[#A84323] transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#6B5344] bg-[#FAF5EB] px-3 py-1 rounded-full border border-[#E6DBC8]">
                  {getCategoryIcon(guide.category)}
                  <span>{guide.category}</span>
                </div>
                <span className="text-[10px] font-bold text-[#4E6E36] bg-[#4E6E36]/10 px-2.5 py-0.5 rounded-full border border-[#4E6E36]/20">
                  {guide.difficulty}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#2D1F18] font-serif group-hover:text-[#A84323] transition-colors mt-2">
                {guide.title}
              </h3>
              <p className="text-xs text-[#5C4435] mt-2 leading-relaxed line-clamp-3 font-medium">
                {guide.description}
              </p>

              {/* Target Items */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(guide.target_items || []).map((item, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF5EB] text-[#5C4435] border border-[#E6DBC8]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#E6DBC8] flex items-center justify-between text-xs font-bold text-[#A84323]">
              <span className="text-[11px] text-[#8A7667] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{guide.time_required}</span>
              </span>
              <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Guide Detail Modal */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DBC8]">
              <div>
                <span className="text-xs font-bold text-[#4E6E36] bg-[#4E6E36]/10 px-2.5 py-0.5 rounded-full border border-[#4E6E36]/20">
                  {activeGuide.category}
                </span>
                <h3 className="text-lg font-bold text-[#2D1F18] font-serif mt-2">{activeGuide.title}</h3>
              </div>
              <button
                onClick={() => setActiveGuide(null)}
                className="text-[#8A7667] hover:text-[#2D1F18] p-2 rounded-xl hover:bg-[#FAF5EB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#5C4435] leading-relaxed font-medium">
              {activeGuide.description}
            </p>

            {/* Target Ingredients */}
            <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8]">
              <h4 className="text-xs font-bold text-[#2D1F18] font-serif uppercase tracking-wider mb-2">Suitable For:</h4>
              <div className="flex flex-wrap gap-2">
                {(activeGuide.target_items || []).map((item, i) => (
                  <span key={i} className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFFDF8] text-[#2D1F18] border border-[#E6DBC8]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#2D1F18] font-serif uppercase tracking-wider">How to Do It:</h4>
              <div className="space-y-2.5">
                {(activeGuide.instructions || []).map((step, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8]">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#A84323] text-white font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-xs text-[#2D1F18] font-medium leading-relaxed mt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6DBC8] flex justify-end">
              <button
                onClick={() => setActiveGuide(null)}
                className="px-6 py-2 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-bold text-xs shadow-md"
              >
                Got It, Thanks!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
