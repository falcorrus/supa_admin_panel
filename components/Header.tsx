
import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { LogoutIcon, UserCircleIcon, DatabaseIcon } from './Icons';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center">
        <DatabaseIcon className="w-6 h-6 text-emerald-400" />
        <h1 className="text-xl font-bold ml-2">Supabase Admin</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <UserCircleIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm ml-2 text-gray-300">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
        >
          <LogoutIcon className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
