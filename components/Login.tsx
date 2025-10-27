
import React, { useState } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { DatabaseIcon } from './Icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      setError(error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="w-full max-w-md">
            <div className="flex justify-center items-center mb-6">
                 <DatabaseIcon className="w-10 h-10 text-emerald-400" />
                <h1 className="ml-3 text-3xl font-bold text-gray-100">Supabase Admin</h1>
            </div>
            <div className="bg-gray-800 shadow-lg rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-center text-gray-200 mb-6">Sign in to your account</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                        />
                    </div>
                     {error && <p className="text-red-400 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline disabled:bg-emerald-800 disabled:cursor-not-allowed transition-colors duration-200"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">
              Please enter your Supabase user credentials.
            </p>
        </div>
    </div>
  );
};

export default Login;
