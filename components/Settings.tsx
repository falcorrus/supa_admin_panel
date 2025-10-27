import React, { useMemo, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabase';
import { Table } from '../types';
import { VisibilityAllIcon, VisibilityNoneIcon, VisibilityMixedIcon } from './Icons';
import { connectionManager } from '../services/connectionManager';
import ConnectionList from './ConnectionList';
import ConnectionForm from './ConnectionForm';

interface SettingsProps {
  user: User | null;
  tables: Table[];
  tableVisibility: Record<string, boolean>;
  customTableVisibility: Record<string, boolean> | null;
  visibilityMode: 'all' | 'none' | 'custom';
  toggleTableVisibility: (tableName: string) => void;
  cycleVisibilityMode: () => void;
  tablesFetchMethod: string | null;
}

const Settings: React.FC<SettingsProps> = ({ user, tables, tableVisibility, customTableVisibility, visibilityMode, toggleTableVisibility, cycleVisibilityMode, tablesFetchMethod }) => {
  const [connections, setConnections] = useState(connectionManager.getConnections());
  const [activeConnection, setActiveConnection] = useState(localStorage.getItem('activeSupabaseConnection'));

  useEffect(() => {
    const connections = connectionManager.getConnections();
    const defaultConnection = connections.find(c => c.name === 'Default');
    const baOnlineConnection = connections.find(c => c.name === 'BAOnline');

    if (defaultConnection && !baOnlineConnection) {
      connectionManager.removeConnection('Default');
      connectionManager.addConnection('BAOnline', defaultConnection.url, defaultConnection.anonKey);
      if (activeConnection === 'Default') {
        connectionManager.setActiveConnection('BAOnline');
        setActiveConnection('BAOnline');
      }
      setConnections([...connectionManager.getConnections()]);
    }
  }, []);

  const handleAddConnection = (name: string, url: string, anonKey: string, serviceRoleKey?: string) => {
    connectionManager.addConnection(name, url, anonKey, serviceRoleKey);
    setConnections([...connectionManager.getConnections()]);
  };

  const handleRemoveConnection = (name: string) => {
    connectionManager.removeConnection(name);
    setConnections([...connectionManager.getConnections()]);
  };

  const handleSetActiveConnection = (name: string) => {
    connectionManager.setActiveConnection(name);
    setActiveConnection(name);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const visibilityState = useMemo(() => {
    return visibilityMode;
  }, [visibilityMode]);

  const toggleAllVisibility = () => {
    cycleVisibilityMode();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Настройки</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Управление подключениями</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Добавить новое подключение</h3>
            <ConnectionForm onAddConnection={handleAddConnection} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Существующие подключения</h3>
            <ConnectionList
              connections={connections}
              activeConnection={activeConnection}
              onSetActive={handleSetActiveConnection}
              onRemove={handleRemoveConnection}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Информация</h2>
        <div className="mb-6 p-4 bg-gray-700 rounded-md">
          <p className="text-gray-300">
            <span className="font-semibold text-emerald-400">Способ получения таблиц:</span> {tablesFetchMethod || 'Неизвестен'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {tablesFetchMethod === 'Сервисный ключ' 
              ? 'Используется сервисный ключ для прямого доступа к information_schema.' 
              : tablesFetchMethod === 'RPC-функция (get_user_tables)' 
                ? 'Используется RPC-функция get_user_tables для получения списка таблиц.' 
                : 'Не удалось определить способ получения таблиц.'}
          </p>
        </div>
      </div>
      
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
              <VisibilityMixedIcon className="w-6 h-6 text-white" />
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
                  ? 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {table.table_name}
            </button>
          ))}
        </div>
      </div>


    </div>
  );
};

export default Settings;
