import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Table } from '../types';

interface SettingsProps {
  user: User | null;
  tables: Table[];
  tableVisibility: Record<string, boolean>;
  toggleTableVisibility: (tableName: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, tables, tableVisibility, toggleTableVisibility }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Настройки</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Профиль</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Видимость таблиц</h2>
        <p className="text-gray-400 mb-4">Нажмите на таблицу, чтобы скрыть/показать в боковой панели</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map((table) => (
            <button
              key={table.table_name}
              onClick={() => toggleTableVisibility(table.table_name)}
              className={`px-4 py-2 rounded-md text-left font-medium transition-colors ${
                tableVisibility[table.table_name] === false
                  ? 'bg-gray-700 text-gray-400 border border-gray-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {table.table_name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Безопасность</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;