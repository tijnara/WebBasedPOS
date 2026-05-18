import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const setAuth = useStore(state => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Demo user credentials check
    if (email === 'demo@gmail.com' && password === 'demodemo') {
      handleDemoLogin();
      setIsLoading(false);
      return;
    }

    // Regular user login
    try {
      const { data: userPayload, error: authError } = await supabase.rpc(
          'authenticate_user',
          {
            p_email: email,
            p_password: password,
          }
      );

      if (authError) throw authError;

      if (userPayload) {
        // Ensure isDemo is false for real users
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
        <Head>
          <title>Sign In | Seaside POS</title>
        </Head>
        <div className="min-h-screen w-full flex bg-gray-50/50 font-sans">

          {/* Left Panel - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
            <div className="w-full max-w-[420px] space-y-8">
              <div className="text-center">
                <div className="lg:hidden bg-white w-20 h-20 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                  <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 mt-2 font-medium">
                  Enter your credentials to access your dashboard.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                      <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                      </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium outline-none"
                            placeholder="name@seaside.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                      type="submit"
                      disabled={isLoading || isDemoLoading}
                      className="w-full h-12 mt-6 flex items-center justify-center gap-2 rounded-xl text-white font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
                </form>

                <div className="mt-8 relative flex items-center justify-center">
                  <hr className="w-full border-gray-200" />
                  <span className="absolute bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Or
                </span>
                </div>

                <button
                    onClick={handleDemoLogin}
                    disabled={isLoading || isDemoLoading}
                    className="mt-8 w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDemoLoading ? (
                      <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading Demo...
                    </span>
                  ) : (
                      <>
                        <User className="h-5 w-5 text-gray-500" /> Try Demo Version
                      </>
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} Seaside Purified Water.
              </p>
            </div>
          </div>

          {/* Right Panel - Branding */}
          <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
            {/* Background image with overlay */}
            <div className="absolute inset-0 bg-[url('/resourceswallpaper.png')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-[#8BC34A]/80 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex flex-col items-center text-center px-12 text-white">
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-10 flex items-center justify-center w-40 h-40">
                <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-5xl font-black mb-6 tracking-tight leading-tight">
                Pure Trust,<br/> Delivered.
              </h2>
              <p className="text-lg text-teal-50 max-w-md font-medium leading-relaxed mb-10">
                Streamline your water refilling station operations with our advanced Point of Sale and management system.
              </p>

              <div className="flex items-center gap-4 text-sm font-bold bg-black/10 px-6 py-3 rounded-full backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-5 h-5 text-teal-300" /> Secure Access
              </div>
            </div>
          </div>

        </div>
      </>
  );
}