import React, { useState } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { DatabaseIcon } from './Icons';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        const { error: insertError } = await getSupabaseClient()
          .from('supadmin_users')
          .insert([{ user_id: data.user.id, name: data.user.email }]);
        if (insertError) {
          setError(insertError.message);
        } else {
          navigate('/setup');
        }
      } else {
        setError('Registration failed: No user data returned.');
      }
    } catch (error: any) {
      setError(error.message);
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
                <h2 className="text-2xl font-semibold text-center text-gray-200 mb-6">Register for an account</h2>
                <form onSubmit={handleRegister}>
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
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">
              Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300">Login here</Link>.
            </p>
        </div>
    </div>
  );
};

export default Registration;
