import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './landing/LandingPage';
import PantryView from './components/PantryView';
import VisionScanModal from './components/VisionScanModal';
import AddItemModal from './components/AddItemModal';
import VoiceLogModal from './components/VoiceLogModal';
import AuthModal from './components/AuthModal';
import ZeroWasteChef from './components/ZeroWasteChef';
import FreshnessRadar from './components/FreshnessRadar';
import SecondLifeHub from './components/SecondLifeHub';
import MealPlanner from './components/MealPlanner';
import Dashboard from './components/Dashboard';
import GroceryAgent from './components/GroceryAgent';
import WasteAnalytics from './components/WasteAnalytics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [pantryItems, setPantryItems] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secondLifeQuery, setSecondLifeQuery] = useState(null);
  const [targetCookItem, setTargetCookItem] = useState(null);

  const { isAuthenticated, user } = useAuth();

  // Load pantry & analytics
  const refreshAllData = async () => {
    try {
      const [items, summary] = await Promise.all([
        api.getPantryItems(),
        api.getAnalyticsSummary()
      ]);
      setPantryItems(items || []);
      setAnalyticsSummary(summary);
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [isAuthenticated]);

  // Redirect to home if user signs out while on a protected page
  useEffect(() => {
    if (!isAuthenticated && activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [isAuthenticated, activeTab]);

  const handleTabChange = (tabId) => {
    if (!isAuthenticated && tabId !== 'home') {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleOpenScan = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setIsScanOpen(true);
  };

  const handleOpenAdd = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setIsAddOpen(true);
  };

  const handleOpenVoice = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setIsVoiceOpen(true);
  };

  const handleConsume = async (id) => {
    try {
      await api.consumePantryItem(id);
      refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleWaste = async (id) => {
    try {
      await api.wastePantryItem(id);
      refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.deletePantryItem(id);
      refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCookWithItem = (item) => {
    setTargetCookItem(item);
    setActiveTab('recipes');
  };

  const handleUpcycleItem = (item) => {
    setSecondLifeQuery(item.name);
    setActiveTab('second-life');
  };

  const shouldShowLanding = activeTab === 'home';

  return (
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col justify-between text-[#2D1F18]">

      {/* Navigation Header */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenScan={handleOpenScan}
          onOpenAdd={handleOpenAdd}
          onOpenVoice={handleOpenVoice}
          onOpenAuth={() => setIsAuthOpen(true)}
          summary={analyticsSummary}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

          {/* Landing Page or Dashboard (Home) */}
          {shouldShowLanding && !isAuthenticated && (
            <LandingPage
              onNavigate={handleTabChange}
              onOpenScan={handleOpenScan}
              onOpenAuth={() => setIsAuthOpen(true)}
              summary={analyticsSummary}
            />
          )}
          {shouldShowLanding && isAuthenticated && (
            <Dashboard
              pantryItems={pantryItems}
              analyticsSummary={analyticsSummary}
              onNavigate={handleTabChange}
              onOpenScan={handleOpenScan}
              onOpenAdd={handleOpenAdd}
              onOpenVoice={handleOpenVoice}
            />
          )}

          {/* Smart Pantry View */}
          {activeTab === 'pantry' && (
            <PantryView
              items={pantryItems}
              onConsume={handleConsume}
              onWaste={handleWaste}
              onDeleteItem={handleDeleteItem}
              onOpenAdd={handleOpenAdd}
              onOpenScan={handleOpenScan}
              onCookItem={handleCookWithItem}
              onUpcycleItem={handleUpcycleItem}
            />
          )}

          {/* Zero Waste Chef */}
          {activeTab === 'recipes' && (
            <ZeroWasteChef
              onPantryUpdated={refreshAllData}
              initialItem={targetCookItem}
            />
          )}

          {/* Freshness Radar */}
          {activeTab === 'radar' && (
            <FreshnessRadar
              items={pantryItems}
            />
          )}

          {/* Second Life Hub */}
          {activeTab === 'second-life' && (
            <SecondLifeHub
              pantryItems={pantryItems}
              initialQuery={secondLifeQuery}
            />
          )}

          {/* Family Meal Planner */}
          {activeTab === 'meal-planner' && (
            <MealPlanner
              onGroceryUpdated={refreshAllData}
              pantryItems={pantryItems}
            />
          )}

          {/* Dynamic Grocery Agent */}
          {activeTab === 'grocery' && (
            <GroceryAgent
              onPantryRestocked={refreshAllData}
            />
          )}

          {/* Waste Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <WasteAnalytics
              summary={analyticsSummary}
            />
          )}

        </main>
      </div>

      {/* Rustic Warm Footer */}
      <footer className="border-t border-[#E6DBC8] bg-[#FFFDF8] py-6 px-4 text-center text-xs text-[#8A7667]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-base">kOs</span>
            <span className="font-bold text-[#2D1F18] font-serif">Kitchen OS</span>
            <span>•</span>
            <span className="italic">A Better Kitchen, A Better You.</span>
          </div>
          <div className="flex items-center space-x-4 font-semibold text-[#5C4435]">
            <span>Vision AI</span>
            <span>•</span>
            <span>Deterministic Spoilage</span>
            <span>•</span>
            <span>ElevenLabs Voice AI</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VisionScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onImportSuccess={refreshAllData}
      />

      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onItemAdded={refreshAllData}
      />

      <VoiceLogModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onPantryUpdated={refreshAllData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={refreshAllData}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
