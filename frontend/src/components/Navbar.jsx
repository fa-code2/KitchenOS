import React, { useState } from 'react';
import {
  Leaf,
  ChefHat,
  Activity,
  Recycle,
  CalendarDays,
  ShoppingCart,
  BarChart3,
  Camera,
  Plus,
  Sparkles,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  Home,
  Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenScan, onOpenAdd, onOpenVoice, onOpenAuth, summary }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mainNavLinks = [
    { id: 'home', label: 'Home' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'pantry', label: 'Pantry' },
    { id: 'meal-planner', label: 'Meal Planner' },
    { id: 'radar', label: 'Radar' },
    { id: 'second-life', label: 'Second Life' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'analytics', label: 'Analytics' }
  ];

  const avgFreshness = summary?.freshness_health_avg ?? 92;
  const wasteSavedKg = summary?.total_waste_prevented_kg ?? 14.8;
  const moneySaved = summary?.total_money_saved_usd ?? 112.5;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E6DBC8] bg-[#FAF5EB]/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo matching reference: Cooking Pot Icon + KitchenOS */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            {/* Hand-drawn cooking pot icon */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#A84323] text-white shadow-md shadow-[#A84323]/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">kOs</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-2xl tracking-tight text-[#2D1F18] font-serif">
                  Kitchen<span className="text-[#A84323] font-serif font-black">OS</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#A84323]/10 text-[#A84323] border border-[#A84323]/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-[#6B5344] font-medium">Your Kitchen, Smarter.</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {mainNavLinks.slice(0, 5).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all ${isActive
                    ? 'text-[#A84323] bg-[#A84323]/10 border-b-2 border-[#A84323]'
                    : 'text-[#5C4435] hover:text-[#2D1F18] hover:bg-[#F4ECE0]/60'
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">

            {/* Voice Inventory Logging Button (ElevenLabs) */}
            <button
              onClick={onOpenVoice}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#A84323] bg-[#A84323]/10 hover:bg-[#A84323]/20 border border-[#A84323]/30 transition-all shadow-2xs hover:scale-105"
              title="Voice inventory logging with ElevenLabs audio"
            >
              <Mic className="w-3.5 h-3.5 text-[#A84323]" />
              <span className="hidden sm:inline">Voice Log</span>
            </button>

            {/* AI Vision Scan Button */}
            <button
              onClick={onOpenScan}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#5C4435] bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8] hover:border-[#A84323] transition-all shadow-2xs hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Vision Scan</span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAdd}
              className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#5C4435] bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8] transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            {/* Auth / User Profile */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full bg-[#FFFDF8] border border-[#E6DBC8] hover:border-[#A84323] transition-all shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#A84323] text-white font-bold text-xs flex items-center justify-center">
                    {getInitials(user?.full_name || user?.email)}
                  </div>
                  <span className="text-xs font-bold text-[#2D1F18] max-w-[90px] truncate hidden md:inline">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#6B5344]" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFDF8] border border-[#E6DBC8] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-[#E6DBC8]">
                      <p className="text-xs font-bold text-[#2D1F18] truncate">{user?.full_name || 'Chef'}</p>
                      <p className="text-[11px] text-[#6B5344] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full mt-1 flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md shadow-[#A84323]/25 transition-all hover:scale-105"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>

        {/* Secondary Subnav (Radar, Second Life, Grocery, Analytics) */}
        <div className="flex md:hidden items-center space-x-2 py-2.5 overflow-x-auto no-scrollbar border-t border-[#E6DBC8]/60">
          {mainNavLinks.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${isActive
                  ? 'text-white bg-[#A84323] shadow-xs'
                  : 'text-[#6B5344] bg-[#F4ECE0]/50 hover:bg-[#F4ECE0]'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
