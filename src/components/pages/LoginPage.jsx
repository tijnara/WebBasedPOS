import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useStore(state => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

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
        setAuth(userPayload);
        localStorage.setItem('custom_session', JSON.stringify(userPayload));
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><br></br><br></br><br></br>
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
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><br></br><br></br><br></br>
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
            </div>
            <br></br>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {isLoading ? 'Verifying...' : <> <LogIn className="h-6 w-6" /> Sign In </>}
            </button>
          </form>
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