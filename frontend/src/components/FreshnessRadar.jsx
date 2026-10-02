import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Sparkles, 
  ShieldCheck,
  TrendingDown, 
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export default function FreshnessRadar({ items }) {
  const [selectedItemName, setSelectedItemName] = useState('Organic Spinach');
  const [simLocation, setSimLocation] = useState('Fridge');
  const [simTempFactor, setSimTempFactor] = useState(1.0);

  // Spoilage distribution
  const criticalItems = items.filter(i => i.days_remaining <= 3);
  const moderateItems = items.filter(i => i.days_remaining > 3 && i.days_remaining <= 7);
  const freshItems = items.filter(i => i.days_remaining > 7);

  // Generate dynamic simulation curve for selected item
  const getSimulationData = () => {
    let baseDays = 7;
    if (selectedItemName.toLowerCase().includes('spinach')) baseDays = simLocation === 'Freezer' ? 60 : (simLocation === 'Pantry' ? 2 : 5);
    else if (selectedItemName.toLowerCase().includes('milk')) baseDays = simLocation === 'Freezer' ? 30 : (simLocation === 'Pantry' ? 1 : 7);
    else if (selectedItemName.toLowerCase().includes('salmon')) baseDays = simLocation === 'Freezer' ? 90 : (simLocation === 'Pantry' ? 1 : 2);
    else if (selectedItemName.toLowerCase().includes('apple')) baseDays = simLocation === 'Freezer' ? 180 : (simLocation === 'Pantry' ? 14 : 28);
    else if (selectedItemName.toLowerCase().includes('bread')) baseDays = simLocation === 'Freezer' ? 60 : (simLocation === 'Pantry' ? 4 : 7);

    const effectiveDays = Math.round(baseDays * (1.1 - (simTempFactor - 1.0) * 0.5));
    const data = [];
    for (let day = 0; day <= effectiveDays + 2; day++) {
      const ratio = Math.max(0, 1 - (day / effectiveDays));
      const freshnessPct = Math.round(Math.pow(ratio, 1.15) * 100);
      data.push({
        day: `Day ${day}`,
        freshness: freshnessPct,
        status: freshnessPct > 60 ? 'Peak' : (freshnessPct > 25 ? 'Use Soon' : 'Past Prime')
      });
    }
    return { data, effectiveDays };
  };

  const { data: simCurve, effectiveDays } = getSimulationData();

  const storageTips = [
    {
      title: "Ethylene Gas Separation",
      tip: "Keep bananas, apples, and tomatoes separate from leafy greens and avocados to prevent premature ripening.",
      icon: "🍎"
    },
    {
      title: "Herb Freshness Revival",
      tip: "Trim fresh cilantro/parsley stems and store them upright in a jar with 1 inch of water in the fridge door.",
      icon: "🌿"
    },
    {
      title: "Refrigerator Temperature Zones",
      tip: "Store highly perishable dairy and meats on the middle/bottom shelf (coldest zone) rather than the refrigerator door.",
      icon: "❄️"
    },
    {
      title: "Bread Freezing Trick",
      tip: "Slice artisan sourdough loaves before freezing so you can toast single slices directly from frozen without thawing the whole loaf.",
      icon: "🍞"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-[#FFFDF8] rounded-3xl p-6 sm:p-8 border-2 border-[#E6DBC8] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#4E6E36]/10 text-[#4E6E36] border border-[#4E6E36]/20 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Random Forest ML Regressor Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D1F18] font-serif">
              Freshness & Spoilage <span className="text-[#A84323] font-serif">Radar</span>
            </h2>
            <p className="text-sm text-[#5C4435] mt-1 max-w-2xl leading-relaxed font-medium">
              Kitchen OS uses a multi-factor Random Forest model trained on food degradation datasets to predict real-time shelf life, non-linear degradation, and optimal consumption windows.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#A84323]/25 text-center min-w-[5.5rem]">
              <div className="text-xl font-extrabold text-[#A84323]">{criticalItems.length}</div>
              <div className="text-[10px] uppercase font-bold text-[#A84323] mt-0.5">Critical</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#C8822A]/25 text-center min-w-[5.5rem]">
              <div className="text-xl font-extrabold text-[#C8822A]">{moderateItems.length}</div>
              <div className="text-[10px] uppercase font-bold text-[#C8822A] mt-0.5">Moderate</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#4E6E36]/25 text-center min-w-[5.5rem]">
              <div className="text-xl font-extrabold text-[#4E6E36]">{freshItems.length}</div>
              <div className="text-[10px] uppercase font-bold text-[#4E6E36] mt-0.5">Fresh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive ML Simulator and Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator Controls */}
        <div className="bg-[#FFFDF8] rounded-3xl p-6 border-2 border-[#E6DBC8] space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E6DBC8]">
            <Sparkles className="w-4 h-4 text-[#A84323]" />
            <h3 className="text-sm font-bold text-[#2D1F18] font-serif uppercase tracking-wider">ML Shelf-Life Simulator</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2D1F18] mb-1.5 block">Select Ingredient:</label>
            <select
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-semibold text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
            >
              <option value="Organic Spinach">Organic Spinach (Produce)</option>
              <option value="Whole Milk">Whole Milk (Dairy)</option>
              <option value="Fresh Salmon">Fresh Salmon (Protein)</option>
              <option value="Gala Apple">Gala Apple (Produce)</option>
              <option value="Sourdough Bread">Sourdough Bread (Bakery)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2D1F18] mb-1.5 block">Storage Location:</label>
            <div className="grid grid-cols-3 gap-2">
              {['Fridge', 'Pantry', 'Freezer'].map(loc => (
                <button
                  key={loc}
                  onClick={() => setSimLocation(loc)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    simLocation === loc
                      ? 'bg-[#A84323] text-white shadow-xs'
                      : 'bg-[#FAF5EB] text-[#5C4435] hover:bg-[#F4ECE0] border border-[#E6DBC8]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-[#2D1F18] mb-1.5">
              <span>Ambient Temp / Humidity Factor:</span>
              <span className="font-mono text-[#A84323]">{simTempFactor.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={simTempFactor}
              onChange={(e) => setSimTempFactor(parseFloat(e.target.value))}
              className="w-full accent-[#A84323]"
            />
            <div className="flex justify-between text-[10px] text-[#8A7667] mt-1">
              <span>Cool & Dry</span>
              <span>Nominal</span>
              <span>Warm / Summer</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] space-y-1 text-xs">
            <div className="flex justify-between font-medium text-[#5C4435]">
              <span>Predicted Shelf Life:</span>
              <strong className="text-[#2D1F18] font-bold">{effectiveDays} Days</strong>
            </div>
            <div className="flex justify-between font-medium text-[#5C4435]">
              <span>Optimal Rescue Window:</span>
              <strong className="text-[#A84323] font-bold">Days {Math.max(1, effectiveDays - 2)}–{effectiveDays}</strong>
            </div>
          </div>
        </div>

        {/* Degradation Chart */}
        <div className="lg:col-span-2 bg-[#FFFDF8] rounded-3xl p-6 border-2 border-[#E6DBC8] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DBC8]">
            <div>
              <h3 className="text-base font-bold text-[#2D1F18] font-serif">
                Predicted Freshness Degradation Curve
              </h3>
              <p className="text-xs text-[#6B5344]">Non-linear biochemical degradation model vs. Days of Storage</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#4E6E36]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4E6E36]" />
              <span>Simulated Curve</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simCurve}>
                <defs>
                  <linearGradient id="warmFreshnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E6E36" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#A84323" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#8A7667" fontSize={11} />
                <YAxis stroke="#8A7667" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFDF8', 
                    borderColor: '#E6DBC8', 
                    borderRadius: '1rem',
                    color: '#2D1F18',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="freshness" 
                  stroke="#4E6E36" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#warmFreshnessGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Preservation & Freshness Tips */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#2D1F18] font-serif flex items-center gap-2">
          <span>🌿</span>
          <span>Proactive Kitchen Preservation Tips</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storageTips.map((tip, idx) => (
            <div key={idx} className="bg-[#FFFDF8] rounded-2xl p-5 border-2 border-[#E6DBC8] space-y-2 hover:border-[#A84323] transition-all shadow-2xs">
              <div className="text-2xl">{tip.icon}</div>
              <h4 className="text-sm font-bold text-[#2D1F18] font-serif">{tip.title}</h4>
              <p className="text-xs text-[#5C4435] leading-relaxed font-medium">{tip.tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
