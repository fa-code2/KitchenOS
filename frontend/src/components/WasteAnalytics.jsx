import React, { useState, useEffect } from 'react';
import {
  Leaf,
  IndianRupee,
  Award,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';

export default function WasteAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalyticsSummary();
        setSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#A84323', '#4E6E36', '#C8822A', '#8A7667', '#D9943B', '#E8B36B'];

  const categoryData = summary?.category_distribution
    ? Object.entries(summary.category_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const locationData = summary?.location_distribution
    ? Object.entries(summary.location_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center space-x-2 rounded-full border border-[#A84323]/20 bg-[#A84323]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#A84323]">
              <Award className="w-3.5 h-3.5" />
              <span>Environmental & Financial Impact Tracking</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#2D1F18] sm:text-3xl">
              Macro & Waste <span className="text-[#4E6E36]">Analytics</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C4435]">
              Every ingredient saved directly reduces methane emissions and household grocery expenses. Track your circular kitchen performance with metrics.
            </p>
          </div>

          <div className="min-w-[12rem] rounded-2xl border border-[#A84323]/20 bg-[#A84323]/8 p-4 text-center">
            <div className="text-3xl font-black text-[#A84323]">
              {summary?.waste_reduction_rate_pct || 94.2}%
            </div>
            <div className="mt-1 text-xs font-bold text-[#5C4435]">Waste Reduction Rate</div>
            <div className="mt-0.5 text-[10px] text-[#8A7667]">Top 5% Household Tier</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Food Rescued</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4E6E36]/10 text-[#4E6E36]">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            {summary?.total_waste_prevented_kg || 14.8} <span className="text-xs font-normal text-[#8A7667]">kg</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#4E6E36]">
            <TrendingUp className="w-3 h-3" />
            <span>+3.2 kg saved this week</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Grocery Money Saved</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4E6E36]/10 text-[#4E6E36]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            ₹{summary?.total_money_saved_usd || 112.5}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#4E6E36]">
            <TrendingUp className="w-3 h-3" />
            <span>Est. ₹450/year saved</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">CO2 Footprint Avoided</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C8822A]/10 text-[#C8822A]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            {summary?.total_co2_reduced_kg || 36.2} <span className="text-xs font-normal text-[#8A7667]">kg CO₂e</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-[#C8822A]">
            Equivalent to 148 car miles
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Pantry Freshness Avg</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A84323]/10 text-[#A84323]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#A84323]">
            {summary?.freshness_health_avg || 88}%
          </div>
          <div className="mt-1 text-[11px] text-[#5C4435]">
            {summary?.active_items_count || 10} active pantry items
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[#E5D9C5] pb-3">
            <h3 className="text-sm font-bold text-[#2D1F18]">Inventory by Category</h3>
            <span className="text-xs text-[#8A7667]">{categoryData.length} categories</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#8A7667" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8A7667" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E5D9C5',
                    borderRadius: '12px',
                    color: '#2D1F18',
                  }}
                />
                <Bar dataKey="value" fill="#4E6E36" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[#E5D9C5] pb-3">
            <h3 className="text-sm font-bold text-[#2D1F18]">Storage Location Distribution</h3>
            <span className="text-xs text-[#8A7667]">Fridge / Pantry / Freezer</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E5D9C5',
                    borderRadius: '12px',
                    color: '#2D1F18',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#2D1F18]">
          <Clock className="w-4 h-4 text-[#A84323]" />
          <span>Recent Waste Prevention Activity</span>
        </h3>

        <div className="divide-y divide-[#E5D9C5]">
          {(summary?.recent_activity || []).map((act, idx) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A84323]/10 text-[#A84323]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2D1F18]">{act.action}: </span>
                  <span className="text-xs font-semibold text-[#5C4435]">{act.item_name}</span>
                  <div className="text-[10px] text-[#8A7667]">{act.date}</div>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-bold text-[#4E6E36]">+{act.waste_prevented_kg} kg saved</div>
                <div className="text-[11px] text-[#8A7667]">+₹{act.money_saved_usd}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

