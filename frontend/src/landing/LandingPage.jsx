import React from 'react';
import {
  Sparkles,
  BookOpen,
  Package,
  CalendarDays,
  Lightbulb,
  Camera,
  ChefHat,
  Activity,
  Leaf,
} from 'lucide-react';

export default function LandingPage({ onNavigate, onOpenScan, summary }) {
  const wasteSavedKg = summary?.total_waste_prevented_kg ?? 14.8;

  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#E6DBC8] bg-[#FFFDF8] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 p-8 sm:p-12 lg:p-14 space-y-6 z-10">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-[1.08] text-[#2D1F18] font-serif">
                Your Kitchen, <br />
                <span className="text-[#A84323] italic font-serif">Smarter.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#5C4435] leading-relaxed max-w-md font-medium">
                Plan meals. Discover recipes. Keep your pantry in check. All from one cozy kitchen space.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('pantry')}
                className="inline-flex items-center space-x-3 px-7 py-3.5 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#A84323]/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Start Your KitchenOS</span>
                <span className="text-lg">→</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-bold text-[#5C4435]">
              <div
                onClick={() => onNavigate('recipes')}
                className="cursor-pointer flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] hover:border-[#A84323] hover:bg-[#FFFBF5] transition-all shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-[#A84323]" />
                <span>Curated Recipes</span>
              </div>
              <div
                onClick={() => onNavigate('pantry')}
                className="cursor-pointer flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] hover:border-[#A84323] hover:bg-[#FFFBF5] transition-all shadow-2xs"
              >
                <Package className="w-4 h-4 text-[#4E6E36]" />
                <span>Smart Pantry</span>
              </div>
              <div
                onClick={() => onNavigate('meal-planner')}
                className="cursor-pointer flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] hover:border-[#A84323] hover:bg-[#FFFBF5] transition-all shadow-2xs"
              >
                <CalendarDays className="w-4 h-4 text-[#C8822A]" />
                <span>Meal Planning</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-[500px] w-full overflow-hidden bg-[#F4ECE0] border-t lg:border-t-0 lg:border-l border-[#E6DBC8]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1400&q=80')`,
                filter: 'sepia(18%) saturate(115%) contrast(96%) brightness(98%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF5EB]/50 via-transparent to-[#A84323]/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D1F18]/40 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 rounded-2xl bg-[#FFFDF8]/90 backdrop-blur-md border border-[#E6DBC8] shadow-lg flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#4E6E36]/15 text-[#4E6E36] flex items-center justify-center font-bold">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-extrabold text-[#4E6E36]">Zero-Waste AI</p>
                <p className="text-xs font-bold text-[#2D1F18]">{wasteSavedKg} kg food rescued</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 p-3 sm:p-4 rounded-2xl bg-[#FFFDF8]/90 backdrop-blur-md border border-[#E6DBC8] shadow-lg max-w-xs hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#A84323]/15 text-[#A84323] flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-[#2D1F18]">
                Instant YOLOv8 visual food detection with freshness predictions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D1F18] flex items-center justify-center gap-2">
            <span className="text-[#4E6E36]">🌿</span>
            <span>Everything You Need in Your Kitchen</span>
            <span className="text-[#4E6E36]">🌿</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('recipes')}
            className="cursor-pointer group p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#E6DBC8] hover:border-[#A84323] hover:bg-[#FFFBF5] transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#A84323] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1F18] group-hover:text-[#A84323] transition-colors font-serif">
                  Delicious Recipes
                </h3>
                <p className="text-xs text-[#5C4435] mt-1.5 leading-relaxed font-medium">
                  Handpicked zero-waste meals tailored to what you already have.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6DBC8]/60 text-center text-xs font-bold text-[#A84323] flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Explore Chef Recipes</span>
              <span>→</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('pantry')}
            className="cursor-pointer group p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#E6DBC8] hover:border-[#4E6E36] hover:bg-[#FFFBF5] transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#4E6E36] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1F18] group-hover:text-[#4E6E36] transition-colors font-serif">
                  Pantry Tracker
                </h3>
                <p className="text-xs text-[#5C4435] mt-1.5 leading-relaxed font-medium">
                  Keep track of what you have in Fridge, Pantry, and Freezer.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6DBC8]/60 text-center text-xs font-bold text-[#4E6E36] flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>View Smart Pantry</span>
              <span>→</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('meal-planner')}
            className="cursor-pointer group p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#E6DBC8] hover:border-[#C8822A] hover:bg-[#FFFBF5] transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#C8822A] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1F18] group-hover:text-[#C8822A] transition-colors font-serif">
                  Meal Planner
                </h3>
                <p className="text-xs text-[#5C4435] mt-1.5 leading-relaxed font-medium">
                  Plan your week with ease and generate automated grocery lists.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6DBC8]/60 text-center text-xs font-bold text-[#C8822A] flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Plan Weekly Meals</span>
              <span>→</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('second-life')}
            className="cursor-pointer group p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#E6DBC8] hover:border-[#A84323] hover:bg-[#FFFBF5] transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#A84323] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Lightbulb className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1F18] group-hover:text-[#A84323] transition-colors font-serif">
                  Kitchen Tips & Upcycling
                </h3>
                <p className="text-xs text-[#5C4435] mt-1.5 leading-relaxed font-medium">
                  Little hacks for food scraps and a happier cooking experience.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6DBC8]/60 text-center text-xs font-bold text-[#A84323] flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Explore Scrap Upcycling</span>
              <span>→</span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs sm:text-sm font-serif italic text-[#6B5344] tracking-wide">
            — A Better Kitchen, A Better You —
          </p>
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#A84323] bg-[#A84323]/10 px-3 py-1 rounded-full border border-[#A84323]/20">
            Powered by Computer Vision & ML
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#2D1F18]">
            Mindful Cooking, Powered by Gentle Technology
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4435]">
            Experience how Kitchen OS helps you cook better meals while keeping food fresh and waste near zero.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#FFFDF8] border border-[#E6DBC8] space-y-4 hover:border-[#A84323] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D1F18] font-serif">YOLOv8 Visual Food Scanner</h3>
            <p className="text-xs text-[#5C4435] leading-relaxed">
              Snap a picture of your grocery haul or fruit bowl. Kitchen OS automatically detects produce, categorizes items, and calculates days before expiry.
            </p>
            <button
              onClick={onOpenScan}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#A84323] hover:text-[#94381C]"
            >
              <span>Try Camera Scanner</span>
              <span>→</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFDF8] border border-[#E6DBC8] space-y-4 hover:border-[#4E6E36] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#4E6E36]/10 text-[#4E6E36] flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D1F18] font-serif">Zero-Waste Culinary Intelligence</h3>
            <p className="text-xs text-[#5C4435] leading-relaxed">
              Never let an avocado or herbs go bad. The recipe engine prioritizes expiring ingredients first to craft delicious, personalized meals.
            </p>
            <button
              onClick={() => onNavigate('recipes')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4E6E36] hover:text-[#3F5B2A]"
            >
              <span>Generate Recipes</span>
              <span>→</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFDF8] border border-[#E6DBC8] space-y-4 hover:border-[#C8822A] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#C8822A]/10 text-[#C8822A] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2D1F18] font-serif">ML Freshness Predictor</h3>
            <p className="text-xs text-[#5C4435] leading-relaxed">
              A trained Random Forest regressor continuously estimates shelf-life and alerts you when ingredients enter the critical freshness window.
            </p>
            <button
              onClick={() => onNavigate('radar')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#C8822A] hover:text-[#A6681C]"
            >
              <span>Open Freshness Radar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#FAF5EB] via-[#FFFDF8] to-[#F4ECE0] border-2 border-[#E6DBC8] text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D1F18] max-w-xl mx-auto">
          Ready to bring calm, creativity, and sustainability into your cooking?
        </h2>
        <p className="text-xs sm:text-sm text-[#5C4435] max-w-md mx-auto">
          Start tracking your kitchen in seconds. No complex setup required.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('pantry')}
            className="px-6 py-3 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-bold text-sm shadow-md transition-all hover:scale-105"
          >
            Open Smart Pantry →
          </button>
          <button
            type="button"
            onClick={onOpenScan}
            className="px-5 py-3 rounded-full bg-[#FFFDF8] border border-[#E6DBC8] hover:border-[#A84323] text-[#2D1F18] font-bold text-sm transition-all"
          >
            📸 Try YOLO Camera Scan
          </button>
        </div>
      </section>
    </div>
  );
}
