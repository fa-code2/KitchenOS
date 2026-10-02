import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Leaf,
  IndianRupee,
  AlertTriangle,
  History,
  Scan,
  Plus,
  Mic,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

export default function Dashboard({
  pantryItems,
  analyticsSummary,
  onNavigate,
  onOpenScan,
  onOpenAdd,
  onOpenVoice
}) {
  // Extract data from props
  const recentActivity = analyticsSummary?.recent_activity || [];

  // Find items expiring soon (e.g., within 3 days or lower freshness score)
  // Assuming pantryItems have freshness_score or expiry_date
  // We'll just sort by freshness score ascending if available
  const expiringItems = (pantryItems || [])
    .slice()
    .sort((a, b) => {
      const scoreA = a.freshness_score !== undefined ? a.freshness_score : 100;
      const scoreB = b.freshness_score !== undefined ? b.freshness_score : 100;
      return scoreA - scoreB;
    })
    .slice(0, 4);

  const categoryData = analyticsSummary?.category_distribution
    ? Object.entries(analyticsSummary.category_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D1F18]">
            Welcome back to <span className="text-[#4E6E36]">KitchenOS</span>
          </h1>
          <p className="text-sm text-[#5C4435] mt-2">
            Here's what's happening in your smart kitchen today.
          </p>
        </div>
        <div className="flex">
          <img
            src="/dashboard_graphic.jpg"
            alt="Dashboard Graphic"
            className="h-24 md:h-32 w-auto object-cover rounded-2xl shadow-sm border border-[#E5D9C5]"
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5 cursor-pointer hover:border-[#4E6E36] transition-colors" onClick={() => onNavigate('analytics')}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Food Rescued</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4E6E36]/10 text-[#4E6E36]">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            {analyticsSummary?.total_waste_prevented_kg || '0.0'} <span className="text-xs font-normal text-[#8A7667]">kg</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5 cursor-pointer hover:border-[#4E6E36] transition-colors" onClick={() => onNavigate('analytics')}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Money Saved</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4E6E36]/10 text-[#4E6E36]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            ₹{analyticsSummary?.total_money_saved_usd || '0.00'}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5 cursor-pointer hover:border-[#A84323] transition-colors" onClick={() => onNavigate('radar')}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Avg Freshness</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A84323]/10 text-[#A84323]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#A84323]">
            {analyticsSummary?.freshness_health_avg || 100}%
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-5 cursor-pointer hover:border-[#2D1F18] transition-colors" onClick={() => onNavigate('pantry')}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7667]">Active Items</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D1F18]/10 text-[#2D1F18]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1F18]">
            {analyticsSummary?.active_items_count || (pantryItems?.length || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expiring Soon */}
          <div className="rounded-3xl border border-[#A84323]/30 bg-[#FFFDF8] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-24 h-24 text-[#A84323]" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-bold text-[#A84323]">
                  <AlertTriangle className="w-5 h-5" />
                  Use These Soon
                </h3>
                <button onClick={() => onNavigate('radar')} className="text-xs font-bold text-[#A84323] hover:underline flex items-center gap-1">
                  View Radar <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {expiringItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expiringItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5D9C5] bg-white">
                      <div>
                        <div className="font-semibold text-[#2D1F18] text-sm">{item.name}</div>
                        <div className="text-xs text-[#8A7667] capitalize">{item.location} • {item.category}</div>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-[#A84323]/10 text-[#A84323] text-xs font-bold">
                        {item.freshness_score}% Fresh
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#5C4435] py-4 bg-white/50 rounded-xl px-4 border border-[#E5D9C5]/50">
                  Your pantry is looking fresh! No items expiring soon.
                </div>
              )}
            </div>
          </div>

          {/* Quick Category View */}
          <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-[#E5D9C5] pb-3">
              <h3 className="font-bold text-[#2D1F18]">Pantry Breakdown</h3>
              <button onClick={() => onNavigate('pantry')} className="text-xs font-bold text-[#8A7667] hover:text-[#2D1F18] flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="h-48 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8A7667" fontSize={11} tickLine={false} axisLine={false} />
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
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-[#8A7667]">
                  No data available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="rounded-3xl border border-[#E5D9C5] bg-[#FFFDF8] p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 border-b border-[#E5D9C5] pb-3">
            <h3 className="flex items-center gap-2 font-bold text-[#2D1F18]">
              <History className="w-5 h-5 text-[#8A7667]" />
              Recent Activity
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 10).map((act, idx) => (
                  <div key={idx} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#4E6E36] mt-1.5" />
                      {idx !== recentActivity.length - 1 && idx !== 9 && (
                        <div className="w-px h-full bg-[#E5D9C5] my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-bold text-[#2D1F18] capitalize">{act.action}</span>
                          <span className="text-sm text-[#5C4435] ml-1">{act.item_name}</span>
                        </div>
                        {act.waste_prevented_kg > 0 && (
                          <span className="text-[10px] font-bold text-[#4E6E36] bg-[#4E6E36]/10 px-1.5 py-0.5 rounded">
                            +{act.waste_prevented_kg}kg
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8A7667] mt-0.5">{act.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#8A7667] text-center p-4">
                No recent activity. Start by adding items or scanning a receipt!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
