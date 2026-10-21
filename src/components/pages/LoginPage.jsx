// src/components/pages/LoginPage.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useStore(state => state.setAuth);

  // Tab State: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & Feedback States
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  // --- SIGN IN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Demo user credentials check
    if (email === 'demo@gmail.com' && password === 'demodemo') {
      handleDemoLogin();
      setIsLoading(false);
      return;
    }

    // Regular user login via custom authenticate_user RPC
    try {
      const { data: userPayload, error: authError } = await supabase.rpc(
          'authenticate_user',
          {
            p_email: email.trim().toLowerCase(),
            p_password: password,
          }
      );

      if (authError) throw authError;

      if (userPayload) {
        const finalPayload = { ...userPayload, isDemo: false };
        setAuth(finalPayload);
        router.push('/pos');
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      console.error('Login exception:', err.message);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- STAFF SIGN UP HANDLER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = regName.trim();

    if (!cleanName || !cleanEmail || !regPassword) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verify if email is already registered
      const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

      if (existingUser) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // 2. Insert new staff record into users table
      let insertPayload = {
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        role: 'Staff',
        isadmin: false
      };

      let { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([insertPayload])
          .select()
          .single();

      // Graceful fallback if schema uses 'username' instead of 'name'
      if (insertError && (insertError.code === 'PGRST204' || insertError.message?.includes('name'))) {
        insertPayload = {
          username: cleanName,
          email: cleanEmail,
          password: regPassword,
          role: 'Staff',
          isadmin: false
        };
        const retry = await supabase.from('users').insert([insertPayload]).select().single();
        newUserData = retry.data;
        insertError = retry.error;
      }

      if (insertError) throw insertError;

      // 3. Auto-authenticate the newly created staff user
      try {
        const { data: authPayload } = await supabase.rpc('authenticate_user', {
          p_email: cleanEmail,
          p_password: regPassword,
        });

        if (authPayload) {
          setAuth({ ...authPayload, isDemo: false });
          router.push('/pos');
          return;
        }
      } catch (authErr) {
        console.warn('Auto-login RPC skipped:', authErr.message);
      }

      // Fallback: If not automatically redirected, switch to sign-in tab with prefilled credentials
      setActiveTab('signin');
      setEmail(cleanEmail);
      setPassword('');
      setSuccessMsg('Staff account created successfully! Please sign in.');
    } catch (err) {
      console.error('Registration error:', err.message);
      setError(err.message || 'Failed to create staff account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);

    const demoUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@gmail.com',
      role: 'Admin',
      isadmin: true,
      isDemo: true,
    };

    setAuth(demoUser);
    router.push('/pos');
  };

  return (
      <>
        <div className="min-h-screen w-full flex bg-gray-50/50 font-sans">

          {/* Left Panel - Auth Forms */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
            <div className="w-full max-w-[440px] space-y-6">
              <div className="text-center">
                <div className="lg:hidden bg-white w-20 h-20 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                  <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'signin' ? 'Welcome Back' : 'Join Seaside Staff'}
                </h1>
                <p className="text-gray-500 mt-2 font-medium text-sm">
                  {activeTab === 'signin'
                      ? 'Enter your credentials to access your dashboard.'
                      : 'Register a new staff member account to access the POS.'}
                </p>
              </div>

              <div className="bg-white p-7 sm:p-9 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">

                {/* Tab Selector */}
                <div className="flex bg-gray-100/80 p-1 rounded-2xl mb-6 border border-gray-200/50">
                  <button
                      type="button"
                      onClick={() => handleTabSwitch('signin')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'signin'
                              ? 'bg-white text-gray-900 shadow-xs'
                              : 'text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-600" /> Sign In
                  </button>
                  <button
                      type="button"
                      onClick={() => handleTabSwitch('signup')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'signup'
                              ? 'bg-white text-teal-700 shadow-xs'
                              : 'text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <UserPlus className="w-4 h-4 text-teal-600" /> Staff Sign Up
                  </button>
                </div>

                {/* Feedback Alerts */}
                {error && (
                    <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100 flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-5 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                )}

                {/* --- TAB 1: SIGN IN FORM --- */}
                {activeTab === 'signin' && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 ml-1">
                          Email Address
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <Mail className="h-4 w-4" />
                          </div>
                          <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="name@seaside.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5 ml-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                            Password
                          </label>
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                          type="submit"
                          disabled={isLoading || isDemoLoading}
                          className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                          style={{ background: 'linear-gradient(to right, #8DB600, #0d9488)' }}
                      >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Authenticating...
                      </span>
                        ) : (
                            <>
                              Sign In <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('signup')}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                        >
                          New staff member? <span className="underline font-bold">Register an account</span>
                        </button>
                      </div>
                    </form>
                )}

                {/* --- TAB 2: STAFF SIGN UP FORM --- */}
                {activeTab === 'signup' && (
                    <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 ml-1">
                          Full Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                              type="text"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="Juan Dela Cruz"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 ml-1">
                          Staff Email Address
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <Mail className="h-4 w-4" />
                          </div>
                          <input
                              type="email"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="staff@seaside.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 ml-1">
                          Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                              type="password"
                              required
                              minLength={6}
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="•••••••• (min. 6 characters)"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 ml-1">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                              type="password"
                              required
                              minLength={6}
                              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-sm outline-none"
                              placeholder="••••••••"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                          type="submit"
                          disabled={isLoading || isDemoLoading}
                          className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                          style={{ background: 'linear-gradient(to right, #8DB600, #0d9488)' }}
                      >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Creating Account...
                      </span>
                        ) : (
                            <>
                              Register Staff Account <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={() => handleTabSwitch('signin')}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                        >
                          Already have an account? <span className="underline font-bold">Sign in here</span>
                        </button>
                      </div>
                    </form>
                )}

                {/* Demo Mode Divider */}
                <div className="mt-6 relative flex items-center justify-center">
                  <hr className="w-full border-gray-200" />
                  <span className="absolute bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Or
                </span>
                </div>

                {/* Demo Access Button */}
                <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isLoading || isDemoLoading}
                    className="mt-6 w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-xs"
                >
                  {isDemoLoading ? (
                      <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Loading Demo...
                  </span>
                  ) : (
                      <>
                        <User className="h-4 w-4 text-gray-500" /> Try Demo Version
                      </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} Seaside Purified Water Refilling Station.
              </p>
            </div>
          </div>

          {/* Right Panel - Branding Wallpaper */}
          <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('/resourceswallpaper.png')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-[#8BC34A]/80 backdrop-blur-[2px]" />

            <div className="relative z-10 flex flex-col items-center text-center px-12 text-white">
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-10 flex items-center justify-center w-40 h-40">
                <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-5xl font-black mb-6 tracking-tight leading-tight">
                Pure Trust,<br /> Delivered.
              </h2>
              <p className="text-lg text-teal-50 max-w-md font-medium leading-relaxed mb-10">
                Streamline your water refilling station operations with our advanced Point of Sale and management system.
              </p>

              <div className="flex items-center gap-3 text-sm font-bold bg-black/10 px-6 py-3 rounded-full backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-5 h-5 text-teal-300" /> Secure Staff Access
              </div>
            </div>
          </div>

        </div>
      </>
  );
}