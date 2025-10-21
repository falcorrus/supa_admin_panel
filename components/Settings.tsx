import React, { useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Table } from '../types';
import { VisibilityAllIcon, VisibilityNoneIcon, VisibilityMixedIcon } from './Icons';

interface SettingsProps {
  user: User | null;
  tables: Table[];
  tableVisibility: Record<string, boolean>;
  visibilityMode: 'all' | 'none' | 'custom';
  toggleTableVisibility: (tableName: string) => void;
  toggleAllTables: (show: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, tables, tableVisibility, visibilityMode, toggleTableVisibility, toggleAllTables }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const visibilityState = useMemo(() => {
    return visibilityMode;
  }, [visibilityMode]);

  const toggleAllVisibility = () => {
    if (visibilityState === 'all') {
      // If all are visible, hide all
      toggleAllTables(false);
    } else if (visibilityState === 'none') {
      // If all are hidden, show all
      toggleAllTables(true);
    } else {
      // If mixed (custom), hide all
      toggleAllTables(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Настройки</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Видимость таблиц</h2>
          <button
            onClick={toggleAllVisibility}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title={
              visibilityState === 'all' ? 'Скрыть все' : 
              visibilityState === 'none' ? 'Показать все' : 'Скрыть все'
            }
          >
            {visibilityState === 'all' ? (
              <VisibilityAllIcon className="w-6 h-6 text-emerald-400" />
            ) : visibilityState === 'none' ? (
              <VisibilityNoneIcon className="w-6 h-6 text-gray-400" />
            ) : (
              <VisibilityMixedIcon className="w-6 h-6 text-yellow-400" />
            )}
          </button>
        </div>
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