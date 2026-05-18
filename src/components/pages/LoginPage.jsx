import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Mail, Lock, LogIn, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const setAuth = useStore(state => state.setAuth);

  const performLogin = async (loginEmail, loginPassword) => {
    setError(null);
    try {
      const { data: userPayload, error: authError } = await supabase.rpc(
        'authenticate_user',
        {
          p_email: loginEmail,
          p_password: loginPassword,
        }
      );

      if (authError) throw authError;

      if (userPayload) {
        setAuth(userPayload);
        localStorage.setItem('custom_session', JSON.stringify(userPayload));
        router.push('/pos');
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      console.error('Login exception:', err.message);
      setError('An error occurred during login. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await performLogin(email, password);
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    
    // Create a mock user object for the demo session
    const demoUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'Admin',
      isadmin: true,
      is_demo: true, // This flag is crucial for read-only mode
    };

    // Set the mock user in the global state
    setAuth(demoUser);
    localStorage.setItem('custom_session', JSON.stringify(demoUser));
    
    // Redirect to the main application
    router.push('/pos');
    
    // No need to set isDemoLoading to false as the page will redirect
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="mx-auto grid w-[380px] gap-8">
          <div className="grid gap-6 text-center">
            <h1 className="text-4xl font-bold">Welcome Back</h1>
            <p className="text-balance text-lg text-muted-foreground">
              Securely access your POS dashboard.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-base text-red-600">
                {error}
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><br></br>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-14 pr-4 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><br></br>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-14 pr-4 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div><br></br>
            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {isLoading ? 'Verifying...' : <> <LogIn className="h-6 w-6" /> Sign In </>}
            </button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={isLoading || isDemoLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
          >
            {isDemoLoading ? 'Logging in...' : <> <User className="h-6 w-6" /> Continue as Demo User </>}
          </button>
        </div>
      </div>
      <div className="hidden bg-gray-100 lg:flex items-center justify-center p-8">
          <img 
              src="/seasidelogo_.png" 
              alt="Seaside POS" 
              className="max-w-md mx-auto"
          />
      </div>
    </div>
  );
}