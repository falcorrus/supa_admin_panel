
import React from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { LogoutIcon, UserCircleIcon, DatabaseIcon } from './Icons';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-md">
      <div className="flex items-center">
        <DatabaseIcon className="w-6 h-6 text-emerald-400" />
        <h1 className="text-xl font-bold ml-2 text-white">Supabase Admin</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg">
          <UserCircleIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-sm ml-2 text-gray-300 max-w-xs truncate">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
        >
          <LogoutIcon className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
