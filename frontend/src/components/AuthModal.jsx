import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
        setSuccessMsg('Account created successfully! Welcome to Kitchen OS.');
      } else {
        await login(email, password);
        setSuccessMsg('Signed in successfully!');
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('demo@kitchenos.ai', 'password123');
      setSuccessMsg('Signed in as Demo Chef!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err) {
      setError('Could not complete demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] shadow-2xl p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#8A7667] hover:text-[#2D1F18] hover:bg-[#FAF5EB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#A84323]/10 text-[#A84323] border border-[#A84323]/20 shadow-xs mb-3">
            <ShieldCheck className="w-6 h-6 text-[#A84323]" />
          </div>
          <h3 className="text-xl font-extrabold text-[#2D1F18] font-serif">
            {isRegister ? 'Create your Kitchen OS Account' : 'Welcome to Kitchen OS'}
          </h3>
          <p className="text-xs text-[#5C4435] mt-1 font-medium">
            {isRegister 
              ? 'Save your smart pantry, custom recipes, and waste analytics' 
              : 'Sign in to access your intelligent pantry and food forecasts'}
          </p>
        </div>

        {/* Tabs: Sign In / Register */}
        <div className="flex items-center p-1 bg-[#FAF5EB] rounded-2xl border border-[#E6DBC8] mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isRegister 
                ? 'bg-[#A84323] text-white shadow-md shadow-[#A84323]/20' 
                : 'text-[#6B5344] hover:text-[#2D1F18]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isRegister 
                ? 'bg-[#A84323] text-white shadow-md shadow-[#A84323]/20' 
                : 'text-[#6B5344] hover:text-[#2D1F18]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-[#2D1F18] font-serif mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7667]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#2D1F18] text-xs font-medium focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] placeholder-[#8A7667] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2D1F18] font-serif mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7667]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@kitchenos.ai"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#2D1F18] text-xs font-medium focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] placeholder-[#8A7667] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D1F18] font-serif mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7667]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#2D1F18] text-xs font-medium focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] placeholder-[#8A7667] transition-all"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-[#2D1F18] font-serif mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7667]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-[#2D1F18] text-xs font-medium focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] placeholder-[#8A7667] transition-all"
                />
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-bold text-xs shadow-md shadow-[#A84323]/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-6 pt-5 border-t border-[#E6DBC8]">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-full bg-[#FAF5EB] hover:bg-[#F4ECE0] border border-[#E6DBC8] text-[#2D1F18] hover:text-[#A84323] text-xs font-bold flex items-center justify-center space-x-2 transition-all group"
          >
            <Zap className="w-4 h-4 text-[#A84323] group-hover:scale-110 transition-transform" />
            <span>⚡ Instant Demo Login (1-Click)</span>
          </button>
          <p className="text-[10px] text-center text-[#8A7667] mt-2 font-medium">
            No signup needed — test with preloaded pantry & recipe data
          </p>
        </div>

      </div>
    </div>
  );
}
