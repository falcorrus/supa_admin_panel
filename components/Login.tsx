
import React, { useState } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { DatabaseIcon } from './Icons';
import { Link } from 'react-router-dom';

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('signInWithPassword data:', data);
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
    <div className="flex min-h-screen bg-gray-900">
      {/* Left Side - Branding & Slogan */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gray-900 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-900 to-gray-900 z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl px-12 text-left">
          <div className="flex items-center mb-8">
            <DatabaseIcon className="w-12 h-12 text-emerald-400" />
            <h1 className="ml-4 text-4xl font-bold text-white tracking-tight">Supabase Admin</h1>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Теперь Supabase <span className="text-emerald-400">проще Excel</span>
          </h2>

          <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
            Интуитивный табличный интерфейс, который не нужно объяснять.
            Подключение нескольких баз, Drag-and-drop и скрытие таблиц, cортировка столбцов, редактирование данных и другое
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900 lg:bg-gray-900/50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden flex justify-center items-center mb-8">
            <DatabaseIcon className="w-10 h-10 text-emerald-400" />
            <h1 className="ml-3 text-3xl font-bold text-gray-100">Supabase Admin</h1>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-gray-700/50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-gray-400 text-sm mt-2">Sign in to manage your database</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account? <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
